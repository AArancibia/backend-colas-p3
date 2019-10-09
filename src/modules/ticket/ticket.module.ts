import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { TipoticketModule } from './tipoticket/tipoticket.module';
import { EstadoticketModule } from './estadoticket/estadoticket.module';
import { DetestadoticketModule } from './detestadoticket/detestadoticket.module';
import { Ticket } from './ticket.entity';
import { Estado } from './estadoticket/estadoticket.entity';
import { Tipoticket } from './tipoticket/tipoticket.entity';
import { Administrado } from '../administrado/administrado.entity';
import { TicketGateway } from '../../gateways/ticket.gateway';
import { Ventanilla } from '../ventanilla/ventanilla.entity';
import { VentanillaService } from '../ventanilla/ventanilla.service';
import { VentanillaModule } from '../ventanilla/ventanilla.module';
import { VentanillaGateway } from '../../gateways/ventanilla.gateway';
import { DetestadoticketService } from './detestadoticket/detestadoticket.service';
import { Estadoventanilla } from '../ventanilla/estadoventanilla/estadoventanilla.entity';
import { Detestadoventanilla } from '../ventanilla/detestadoventanilla/detestadoventanilla.entity';
import { Detestadoticket } from './detestadoticket/detestadoticket.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Ventanillareferencia } from '../ventanillareferencia/ventanillareferencia.entity';

/**
 * Modulo de Ticket
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
        Ticket, Estado, Tipoticket,
        Administrado, Ventanilla,
        Estadoventanilla,
        Detestadoventanilla,
        Detestadoticket,
        Usuario,
        Ventanillareferencia
      ],
    ),
    TipoticketModule,
    EstadoticketModule,
    DetestadoticketModule,
    VentanillaModule,
  ],
  controllers: [TicketController],
  providers: [
    VentanillaService,
    TicketService,
    TicketGateway,
    DetestadoticketService,
    VentanillaGateway,
  ],
})
export class TicketModule {}
