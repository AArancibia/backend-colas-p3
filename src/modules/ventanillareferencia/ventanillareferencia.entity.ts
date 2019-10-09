import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ventanilla } from '../ventanilla/ventanilla.entity';
import { Referencia } from '../referencia/referencia.entity';

@Entity('ventanillareferencia')
export class Ventanillareferencia {
  // @PrimaryGeneratedColumn('increment')
  // idventanillareferencia: number;

  @Column({
    name: 'idreferencia',
    comment: 'Valor donde se referncia del ticket ( area, tematica, tramite)',
    primary: true,
  })
  idreferencia: number;

  @Column({
    name: 'idventanilla',
    comment: 'Llave foranea de la ventanilla ',
    primary: true,
  })
  idventanilla: number;

  @ManyToOne(type => Ventanilla, ventanilla => ventanilla.ventanillareferencia)
  @JoinColumn({ name: 'idventanilla' })
  ventanilla: Ventanilla;

  @ManyToOne(type => Referencia, referencia => referencia.ventanillareferencia)
  @JoinColumn({ name: 'idreferencia' })
  referencia: Referencia;

  // @ManyToOne(type => Ventanilla, ventanilla => ventanilla.ventanillareferencias)
  // @JoinColumn({ name: 'idventanilla' })
  // ventanilllas: Ventanilla;
}
