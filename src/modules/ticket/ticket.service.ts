import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { Estado } from './estadoticket/estadoticket.entity';
import { Between, In, Not, Repository, Transaction } from 'typeorm';
import { TicketDto } from './ticket.dto';
import { Tipoticket } from './tipoticket/tipoticket.entity';
import { formatFechaCorta, formatFechaLarga } from '../../shared/utils';
import { Administrado } from '../administrado/administrado.entity';
import { Ventanilla } from '../ventanilla/ventanilla.entity';
import { TicketGateway } from '../../gateways/ticket.gateway';
import { Detestadoticket } from './detestadoticket/detestadoticket.entity';
import { VentanillaService } from '../ventanilla/ventanilla.service';
import { DetestadoticketService } from './detestadoticket/detestadoticket.service';
import { Ventanillareferencia } from '../ventanillareferencia/ventanillareferencia.entity';
const threads = require('threads');
const config  = threads.config;
config.set({
  basepath : {
    node :  __dirname //+ '/directory',
    //web  : 'http://myserver.local/thread-scripts',
  },
});
const spawn   = threads.spawn;

/**
 * Servicio del Modulo Ticket
 */
@Injectable()
export class TicketService {

  /**
   * Variable Logger para obtener los log
   * @var
   */
  private logger = new Logger( 'TicketService' );

  /**
   * Constructor de la clase TicketService
   * @constructor
   */
  constructor(
    @InjectRepository( Ticket ) private ticketRepository: Repository< Ticket >,
    @InjectRepository( Estado ) private estadoRepository: Repository< Estado >,
    @InjectRepository( Detestadoticket ) private detEstadoTicketRepository: Repository< Detestadoticket >,
    @InjectRepository( Tipoticket ) private tipoTicketRepository: Repository< Tipoticket >,
    @InjectRepository( Administrado ) private administradoRepository: Repository< Administrado >,
    @InjectRepository( Ventanilla ) private ventanillaRepository: Repository< Ventanilla >,
    @InjectRepository(Ventanillareferencia)
    private ventanillaReferenciaRepository: Repository<Ventanillareferencia>,
    private ventanillaService: VentanillaService,
    private detEstadoTicketService: DetestadoticketService,
    private wsTicket: TicketGateway,
  ) {}

  async encontrarReferencia(data) {
    const ventanillaReferencia = await this.ventanillaReferenciaRepository.find(
      {
        where: data,
      },
    );
    return ventanillaReferencia;
  }

  /**
   * Servicio para actualizazr idtematica o idtramite del Ticket
   * @param {number} idticket - Id del Ticket
   * @param {number} ticket - Ticket a Actualizar
   * @function actualizarTematicaOrTramite
   * @returns {Ticket} Ticket actualizado.
   */
  async actualizarTematicaOrTramite(
    idticket: number,
    ticket: any,
  ) {
    const ticketActualizado = await this.ticketRepository.update( idticket, {
      idtematica: ticket ? ticket.idtematica : null,
      idtramite: ticket ? ticket.idtramite : null,
    });
    const ticketAEmitir = await this.wsTicket.getDetEstadoTicket();
    this.wsTicket.ws.emit( '[TICKET] DETESTADO', ticketAEmitir );
    return ticketActualizado ;
  }

  /**
   * Servicio para listar Tickets
   * @function getTickets
   * @returns {(Ticket|Array)} Lista de Tickets.
   */
  async getTickets() {
    const tickets = await this.ticketRepository.find({
      relations: [ 'administrado', 'detEstados', 'estados' ],
      where: {
        fechacorta: formatFechaCorta(),
      },
      order: { fecha: 'ASC' },
    });
    const ticketsRO: Ticket[] = [];
    tickets.map(
      ticket => {
        ticket.detEstados.sort( ( a, b ) => new Date( b.fecha ).getTime() - new Date( a.fecha).getTime() );
        const ultimoEstado = ticket.detEstados[ 0 ].estadoticketId;
        if ( ultimoEstado === 4 || ultimoEstado === 6 ) {
          return;
        }
        ticketsRO.push( ticket );
      },
    );
    return ticketsRO;
  }

  /**
   * Servicio para actualizazr idtematica o idtramite del Ticket
   * @param {TicketDto} ticket - Clase TicketDto
   * @function crearTicket
   * @returns {Ticket} Nuevo Ticket creado.
   */
  async crearTicket( ticket: TicketDto ) {
    const { idtipoticket, preferencial, idadministrado, urgente, idreferencia } = ticket;
    const estado = await this.estadoRepository.findOne( { where: { idestado: 1 } });
    const administrado = await this.administradoRepository.findOne({ where: { id: idadministrado }});
    const nuevoTicket: Ticket = await this.ticketRepository.create({
      ...ticket,
      administrado,
      preferencial,
      idreferencia
    });
    nuevoTicket.estados = [ estado ];
    const abrTicket = await this.obtenerTipoTicket( idtipoticket );
    const correlativo = await this.obtenerCorrelativo( idtipoticket, formatFechaCorta() );
    nuevoTicket.correlativo = correlativo;
    nuevoTicket.codigo = `${ urgente ? 'U' : '' }${ preferencial ? 'P' : '' }${ abrTicket }-${ correlativo }`;
    await this.ticketRepository.save( nuevoTicket );
    await this.detEstadoTicketRepository.update({
      ticketId:  nuevoTicket.id,
      estadoticketId: 1,
    }, { fecha: formatFechaLarga() });
    const ticketBD = await this.ticketRepository.findOne({
      where: { id: nuevoTicket.id },
      relations: ['administrado', 'detEstados', 'estados', 'tipoTicket' ],
    });
    this.wsTicket.ws.emit( '[TICKET] Nuevo', ticketBD );
    const ticketAEmitir = await this.wsTicket.getDetEstadoTicket();
    this.wsTicket.ws.emit( '[TICKET] DETESTADO', ticketAEmitir );
    const thread = spawn('./detestadoticket/detestadoworker.ts');//ts
    const gateway = this.wsTicket;
    const detTicketService = this.detEstadoTicketService;

    thread
      .send( ticketBD.detEstados )
      .on('message', async function(message) {
        const ticketSinAtender: number = 
              await detTicketService.obtenerUltimoEstadoTicket( message[ 0 ].ticketId );
        if ( ticketSinAtender === 1 ) gateway.ws.emit('[TICKET] SINATENDER', ticketBD );
        thread.kill();
      });
    return ticketBD;
  }

  /**
   * Servicio para actualizazr idtematica o idtramite del Ticket
   * @param {number} idticket -  Id del Ticket
   * @param {number} idestado -  Id de EstadoTicket
   * @function guardarNuevoEstado
   * @returns {Ticket} Ticket Actualizado.
   */
  async guardarNuevoEstado(
    idticket: number,
    idestado: number,
  ) {
    const ticket = await this.ticketRepository.findOne( { where: { id: idticket }, });
    if ( !ticket ) throw new 
                        HttpException( `No existe el ticket con el id: ${ idticket }`, HttpStatus.NOT_FOUND );
    let idestadoVentanilla;
    if ( idestado == 4  ||  idestado == 6 ) {
      idestadoVentanilla = 3;
    } else if ( idestado == 3 ) {
      idestadoVentanilla = 2;
    } else if ( idestado == 2 ) {
      idestadoVentanilla = 1;
    }
    await this.ventanillaService.guardarNuevoEstado( ticket.idventanilla, idestadoVentanilla );
    const guardarDetEstadoTicket = await this.detEstadoTicketRepository.createQueryBuilder()
      .insert()
      .into( Detestadoticket )
      .values({
        estadoticketId: idestado,
        ticketId: idticket,
        fecha: formatFechaLarga(),
      })
      .returning(['*'])
      .execute();
    const ticketActualizado = await this.ticketRepository.findOne({
      where: { id: idticket },
      relations: [ 'estados', 'administrado', 'detEstados' ],
    });
    this.wsTicket.ws.emit( '[TICKET] NUEVO ESTADO', ticketActualizado );
    const ticketAEmitir = await this.wsTicket.getDetEstadoTicket();
    this.wsTicket.ws.emit( '[TICKET] DETESTADO', ticketAEmitir );
    return ticketActualizado;
  }

  /**
   * Servicio para asignar la ventanilla a un Ticket,
   * y registra un nuevo estado para el ticket ( Llamando ) y un nuevo estado para
   * la ventanilla ( Llamando )
   * @param {number} idticket -  Id del Ticket
   * @param {number} idventanilla -  Id de Ventanilla
   * @function asignarVentanilla
   * @returns {Ticket} Ticket Actualizado.
   */
  async asignarVentanilla(
    idticket: number,
    idventanilla: number,
  ) {
    const ticket = await this.ticketRepository.findOne( {
      where: { id: idticket },
      relations: [ 'estados', 'administrado' ],
    });
    if ( !ticket ) throw new HttpException( `No existe el ticket con el id: ${ idticket }`, HttpStatus.NOT_FOUND );

    const ventanilla = await this.ventanillaRepository.findOne({ where: { idventanilla }});
    if ( !ventanilla ) throw new HttpException( `No existe la ventanilla con el id: ${ idventanilla }`, HttpStatus.NOT_FOUND );

    const llamandoEstado = await this.estadoRepository.findOne({ where: { id: 2 }});

    ticket.estados = [ ...ticket.estados, llamandoEstado ];

    const actualizarTicket: Ticket = await this.ticketRepository.create({
      ...ticket,
      idventanilla,
    });

    await this.ticketRepository.save( actualizarTicket );

    await this.detEstadoTicketRepository.update({
      ticketId:  idticket,
      estadoticketId: 2,
    }, { fecha: formatFechaLarga()  });
    const ticketparaEmitir = await await this.ticketRepository.findOne( {
      where: { id: idticket },
      relations: [ 'administrado', 'detEstados' ],
    });
    const ticketAEmitir = await this.wsTicket.getDetEstadoTicket();
    this.wsTicket.ws.emit( '[TICKET] DETESTADO', ticketAEmitir );
    this.wsTicket.ws.emit( 'ventanillaAsignadaAlTicket', ticketparaEmitir );
    await this.ventanillaService.guardarNuevoEstado( idventanilla, 1 );
    const ticketllamando = await this.wsTicket.llamadaTickets();
    this.wsTicket.ws.emit( '[TICKET] LLAMARTICKET', ticketllamando );
    return actualizarTicket;
  }

  /**
   * Servicio para derivar ticket a otra ventanilla, reseteando los estados del ticket a
   * Derivado y Espera
   * @param {number} idticket -  Id del Ticket
   * @param {number} idventanilla -  Id de la Ventanilla
   * @function guardarNuevoEstado
   * @returns {Ticket} Ticket Actualizado.
   */
  async derivarOtraVentanilla(
    idticket: number,
    idventanilla: number,
  ) {
    const ticket = await this.ticketRepository.findOne( { where: { id: idticket } });
    if ( !ticket ) throw new HttpException( `No existe el ticket con el id: ${ idticket }`, HttpStatus.NOT_FOUND );

    const ventanillaAntigua = ticket.idventanilla;

    const ventanilla = await this.ventanillaRepository.findOne({ where: { idventanilla }});
    if ( !ventanilla ) throw new HttpException( `No existe la ventanilla con el id: ${ idventanilla }`, HttpStatus.NOT_FOUND );

    const estadosTickets = await this.detEstadoTicketRepository.find( { where: { ticketId: idticket }});
    const borrarTickets = await this.detEstadoTicketRepository.remove( estadosTickets );

    const buscarEstados = await this.estadoRepository.find({ where: { id: In( [ 5, 1 ] ) }});

    await this.ventanillaService.guardarNuevoEstado( ventanillaAntigua, 3, true );
    await this.ventanillaService.guardarNuevoEstado( idventanilla, 3 );

    await this.detEstadoTicketRepository.save(
      {
        ticketId: idticket, estadoticketId: buscarEstados[ 1 ].id,
        fecha: formatFechaLarga(),
      },
    );
    await this.detEstadoTicketRepository.save(
      {
        ticketId: idticket, estadoticketId: buscarEstados[ 0 ].id,
        fecha: formatFechaLarga(),
      },
    );

    await this.ticketRepository.update( idticket, {
      idventanilla,
    });
    const ticketaEmitir = await this.ticketRepository.findOne({
      where: { id: idticket }, relations: [ 'administrado', 'detEstados' ],
    });
    this.wsTicket.ws.emit( '[TICKET] DERIVADO', {
      ticketaEmitir,
      ventanillaAntigua,
    });
    const ticketAEmitir = await this.wsTicket.getDetEstadoTicket();
    this.wsTicket.ws.emit( '[TICKET] DETESTADO', ticketAEmitir );
    return ticketaEmitir;
  }

  /**
   * Servicio para asignar urgencia a Ticket
   * @param {number} idticket -  Id del Ticket
   * @function ticketUrgente
   * @returns {Ticket} Ticket Actualizado.
   */
  async ticketUrgente(
    idticket: number,
  ) {
    let ticket = await this.ticketRepository.findOne({ where: { id: idticket }});
    if ( !ticket ) throw new HttpException( `No se encuentra el ticket con id: ${ idticket }`, HttpStatus.NOT_FOUND );
    const ticketActualizado = await this.ticketRepository.update(
      { id: idticket },
      {
        urgente: true,
      },
    );
    const ticketAEmitir = await this.wsTicket.getDetEstadoTicket();
    this.wsTicket.ws.emit( '[TICKET] DETESTADO', ticketAEmitir );
    ticket = await this.ticketRepository.findOne({
      where: { id: idticket },
      relations: ['administrado', 'detEstados', 'estados'],
    });
    this.wsTicket.ws.emit('[TICKET] URGENTE', ticket );
    return ticketActualizado;
  }

  /**
   * Funcion para consulta la entidad TipoTicket y obtener la abreviatura del tipo de Ticket
   * @param {number} idticket -  Id del Ticket
   * @function obtenerTipoTicket
   * @returns {string} Abreviatura del tipo  de Ticket
   */
  async obtenerTipoTicket( idtipoticket: number ): Promise< string > {
    const ticket = await this.tipoTicketRepository.findOne(
      {
        where: {
          idtipoticket,
        },
        select: ['abr'],
      },
    );
    return ticket.abr;
  }

  /**
   * Funcion para consulta la entidad Ticket y traer el ultimo correlativo de ticket y sumarle mas uno para
   * la asignacion a nuevo Ticket
   * @param {number} idtipoticket -  Id del tipo de Ticket
   * @param {Date} fechacorta -  Fecha Corta del Ticket
   * @function obtenerTipoTicket
   * @returns {number} Correlativo del Nuevo Ticket
   */
  async obtenerCorrelativo( idtipoticket: number, fechacorta: Date | string ): Promise< number > {
    const ticket = await this.ticketRepository.findOne(
      {
        where: {
          idtipoticket,
          fechacorta,
        },
        select: ['correlativo'],
        order: { correlativo: 'DESC' },
      },
    );
    let correlativo = !ticket ? 0 : ticket.correlativo++;
    correlativo++;
    return correlativo;
  }
}
