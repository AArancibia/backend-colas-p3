import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { formatFechaCorta } from '../shared/utils';
import { Detestadoventanilla } from '../modules/ventanilla/detestadoventanilla/detestadoventanilla.entity';
import { Ticket } from '../modules/ticket/ticket.entity';
import { Repository } from 'typeorm';
import * as moment from 'moment';
import { Ventanilla } from '../modules/ventanilla/ventanilla.entity';

@WebSocketGateway( 8081, {
  namespace: 'ventanilla',
})
export class VentanillaGateway {
  @WebSocketServer()
  wsVentanilla: any;

  constructor(
    @InjectRepository( Detestadoventanilla ) private detEstadoVentanillaRepository: Repository< Detestadoventanilla >,
    @InjectRepository( Ventanilla) private ventanillaRepository: Repository< Ventanilla >,
  ) {}

  @SubscribeMessage( '[VENTANILLA] LISTA' )
  async obtenerVentanillas() {
    const ventanillas = await this.ventanillaRepository.find(
      {
        relations: [ 'usuario' ],
      },
    );
    return ventanillas;
  }

  @SubscribeMessage( '[VENTANILLA] ULTIMOESTADO' )
  async ultimoEstadoVentanilla() {
    const fecha2 = moment( formatFechaCorta() ).add('days', 1).format('YYYY-MM-DD');
    const qb = await this.detEstadoVentanillaRepository.createQueryBuilder('t1');
    const detVentanillas = qb
      .innerJoinAndSelect( 't1.ventanilla', 'tb_ventanilla' )  // Ticket , 'ticket', 'ticket.id = t1.ticketId'
      .innerJoinAndSelect( 'ticket', 'ticket', 'ticket.idventanilla = tb_ventanilla.id')
      .where(
        sq => {
          const subQuery = qb.subQuery()
            .select( 'max( fecha )')
            .from( Detestadoventanilla, 't2' )
            .where( 't1.tbVentanillaId = t2.tbVentanillaId' )
            .getQuery();
          return 't1.fecha = ' + subQuery;
        },
      )
      .andWhere(
        ' t1.fecha between :fec1 and :fec2 ',
        {
          fec1: `${ formatFechaCorta() } ` + '00:00:00',
          fec2: `${ fecha2 } ` + '00:00:00',
        },
      )
      .getMany();
    return detVentanillas;
  }

}