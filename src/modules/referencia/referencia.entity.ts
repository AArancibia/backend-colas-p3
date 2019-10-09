import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ventanillareferencia } from '../ventanillareferencia/ventanillareferencia.entity';

@Entity('referencia')
export class Referencia {
  @PrimaryGeneratedColumn('increment')
  idreferencia: number;

  @Column({
    name: 'descripcion',
    comment: 'Descripcion de la llave si es de area, idtupa o idtramite',
    nullable: true,
  })
  descripcion: string;

  @OneToMany(
    type => Ventanillareferencia,
    ventanillareferencia => ventanillareferencia.referencia,
  )
  public ventanillareferencia: Ventanillareferencia[];
}
