import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Table,
} from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { Estadoventanilla } from './estadoventanilla/estadoventanilla.entity';
import { Ticket } from '../ticket/ticket.entity';
import { Ventanillareferencia } from '../ventanillareferencia/ventanillareferencia.entity';

@Entity('tb_ventanilla')
export class Ventanilla {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {
    nullable: false,
    comment: 'Codigo de la ventanilla',
    name: 'codigoventanilla',
  })
  codigoventanilla: string;

  // @Column('varchar', {
  //   nullable: true,
  // })
  // tipoatencion: string;

  @Column('varchar', {
    name: 'ubicacion',
    comment: 'Ubicacion de la ventanilla',
    nullable: true,
  })
  ubicacion: string;

  @OneToMany(type => Ticket, ticket => ticket.ventanilla) /*, { eager: true } */
  tickets: Ticket;

  /*@RelationId( ( ventanilla: Ventanilla ) => ventanilla.tickets )
  estadosTicket: number[];*/

  @ManyToOne(type => Usuario, usuario => usuario.ventanillas)
  @JoinColumn({ name: 'idusuario' })
  usuario: Usuario;

  @Column('integer', {
    nullable: true,
  })
  idusuario: number;

  @Column('boolean', {
    nullable: true,
  })
  unica: boolean;

  @ManyToMany(type => Estadoventanilla)
  @JoinTable()
  estados: Estadoventanilla[];

  @OneToMany(
    type => Ventanillareferencia,
    ventanillareferencia => ventanillareferencia.ventanilla,
  )
  public ventanillareferencia: Ventanillareferencia[];
}
