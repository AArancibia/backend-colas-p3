import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { Ticket } from './ticket.entity';
import { TicketDto, TicketRO } from './ticket.dto';
import { ApiUseTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/guards/auth.guard';

/**
 * Controlador del Modulo Ticket
 */
@ApiUseTags('Ticket')
@Controller('ticket')
//@UseGuards(new AuthGuard())
export class TicketController {
  constructor(private ticketService: TicketService) {}

  /**
   * Controlador para llamar a servicio de listarTickets
   * @function obtenerTickets
   * @returns {(Ticket|Array)} Listas de Tickets
   */
  @ApiOperation({
    title: 'Listar Tickets',
    description: 'Consulta para listar tickets de día actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de Tickets',
    isArray: true,
    type: TicketRO,
  })
  @Get()
  async obtenerTickets() {
    return this.ticketService.getTickets();
  }

  /**
   * Servicio para actualizazr idtematica o idtramite del Ticket
   * @param {TicketDto} ticket - Request de Entidad Ticket
   * @function crearTicket
   * @returns {Ticket} Ticket creado.
   */
  @ApiOperation({
    title: 'Crear Ticket',
    description: 'Consulta para crear nuevo Ticket',
  })
  @ApiResponse({ status: 201, description: 'Crear Ticket', isArray: false })
  @Post()
  async crearTicket(@Body() ticket: TicketDto) {
    return this.ticketService.crearTicket(ticket);
  }

  /**
   * Actualizar Ticket
   * @param {number} idticket id del ticket
   * @param {number} idventanilla id de la ventanilla
   * @returns TicketRO
   */
  @ApiOperation({
    title: 'Asignar Ventanilla',
    description: 'Asignación de Ticket a Ventanilla',
  })
  @ApiResponse({ status: 200, description: '', isArray: false })
  @Put(':idticket/asignar/:idventanilla')
  async asignarVentanilla(
    @Param('idticket') idticket: number,
    @Param('idventanilla') idventanilla: number,
  ) {
    return this.ticketService.asignarVentanilla(idticket, idventanilla);
  }

  /**
   * Funcion que sirve para llamar al servicio de asignar urgente a Ticket
   * @param {number} idticket - Id del Ticket
   * @function ticketUrgente
   * @returns {Ticket} Ticket actualizado.
   */
  @ApiOperation({
    title: 'Asignar Urgente Ticket',
    description: 'Consulta para asignar urgencia a Ticket',
  })
  @ApiResponse({
    status: 200,
    description: 'Asignar Urgente a Ticket',
    isArray: false,
  })
  @Put(':id/urgente')
  async ticketUrgente(@Param('id') idticket: number) {
    return this.ticketService.ticketUrgente(idticket);
  }

  /**
   * funcion que sirve para llamar a servicio de guardar nuevo estdo para Ticket
   * @param {number} idticket - Id del Ticket
   * @param {number} idestado - Id del EstadoTicket
   * @function guardarNuevoEstado
   * @returns {Ticket} Ticket actualizado.
   */
  @ApiOperation({
    title: 'Guardar Nuevo Estado para Ticket',
    description: 'Guardar nuevo estado en DetEstadoTicket',
  })
  @ApiResponse({
    status: 201,
    description: 'Guardar Nuevo Estado a Ticket',
    isArray: false,
  })
  @Post(':idticket/estado/:idestado')
  guardarNuevoEstado(
    @Param('idticket') idticket: number,
    @Param('idestado') idestado: number,
  ) {
    return this.ticketService.guardarNuevoEstado(idticket, idestado);
  }

  /**
   * Funcion que llama al servicio de Derivar a Otra Ventanilla
   * @param {number} idticket - Id del Ticket
   * @param {number} idventanilla - Id de la Ventanilla
   * @function derivarOtraVentanilla
   * @returns {Ticket} Ticket actualizado.
   */
  @ApiOperation({
    title: 'Derivar Ticket',
    description: 'Derivar ticket a Otra Ventanilla',
  })
  @ApiResponse({ status: 200, description: 'Derivar Ticket', isArray: true })
  @Post(':idticket/derivar/:idventanilla')
  derivarOtraVentanilla(
    @Param('idticket') idticket: number,
    @Param('idventanilla') idventanilla: number,
  ) {
    return this.ticketService.derivarOtraVentanilla(idticket, idventanilla);
  }

  @Post('/referencia')
  async buscarReferencia(
    //@Param('id') idreferencia?: number,
    @Body() data,
  ) {
    return this.ticketService.encontrarReferencia(data);
  }

  /**
   * Servicio para actualizazr idtematica o idtramite del Ticket
   * @param {number} idticket - Id del Ticket
   * @param {any} actualizarTematicaTramite
   * @function actualizarTematicaOrTramite
   * @returns {Ticket} Ticket actualizado.
   */
  @ApiOperation({
    title: 'Tramite a Ticket',
    description: 'Guardar tramite en Ticket',
  })
  @ApiResponse({
    status: 200,
    description: 'Actualizar temática o trámite a Ticket',
    isArray: false,
  })
  @Put(':idticket/tematica/tramite')
  guardarTramiteEnTicket(
    @Param('idticket') idticket: number,
    @Body() actualizarTematicaTramite: any,
  ) {
    return this.ticketService.actualizarTematicaOrTramite(
      idticket,
      actualizarTematicaTramite,
    );
  }
}
