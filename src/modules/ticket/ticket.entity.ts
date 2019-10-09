import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Ventanilla } from '../ventanilla/ventanilla.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Tipoticket } from './tipoticket/tipoticket.entity';
import { Administrado } from '../administrado/administrado.entity';
import { Estado } from './estadoticket/estadoticket.entity';
import { formatFechaCorta, formatFechaLarga } from '../../shared/utils';
import { Detestadoticket } from './detestadoticket/detestadoticket.entity';

@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('integer', {
    nullable: true,
  })
  idtematica: number;

  @Column('integer', {
    nullable: true,
  })
  idtramite: number;

  @Column('timestamp', { nullable: false })
  fecha: Date | string;

  @Column('varchar', {
    nullable: false,
  })
  codigo: string;

  @Column('boolean', {
    nullable: true,
    default: false,
  })
  preferencial: boolean;

  @Column('bigint', {
    nullable: false,
  })
  correlativo: number;

  @Column('boolean', {
    nullable: true,
  })
  urgente: boolean;

  @Column('date')
  fechacorta: Date | string;

  @ManyToMany(type => Estado, { cascade: true })
  @JoinTable()
  estados: Estado[];

  /* PARA PODER OBTERNER LOS DETESTADOS DEL TICKET */
  @OneToMany(type => Detestadoticket, det => det.ticket, { cascade: true })
  detEstados: Detestadoticket[];

  @ManyToOne(type => Ventanilla, ventanilla => ventanilla.id)
  @JoinColumn({ name: 'idventanilla' })
  ventanilla: Ventanilla;

  @Column('integer', {
    nullable: true,
  })
  idventanilla: number;

  @Column('integer', {
    nullable: true,
  })
  idreferencia: number;

  @ManyToOne(type => Tipoticket, tipoTicket => tipoTicket.idtipoticket)
  @JoinColumn({ name: 'idtipoticket' })
  tipoTicket: Tipoticket;

  @Column('integer', {
    name: 'idtipoticket',
  })
  idtipoticket: number;

  @ManyToOne(type => Administrado, administrado => administrado.id)
  @JoinColumn({ name: 'idadministrado' })
  administrado: Administrado;

  @Column('integer', {
    name: 'idadministrado',
  })
  idadministrado: number;

  @RelationId((tickets: Ticket) => tickets.estados)
  estadosIds: number[];

  @BeforeInsert()
  asignarFecha() {
    this.fecha = new Date();
  }

  @BeforeInsert()
  asignarFechaCorta() {
    this.fechacorta = formatFechaCorta();
  }
}
