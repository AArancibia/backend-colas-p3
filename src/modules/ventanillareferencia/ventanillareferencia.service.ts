import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ventanillareferencia } from './ventanillareferencia.entity';
import { Repository } from 'typeorm';
import { VentanillaReferenciaDTO } from './ventanillareferencia.dto';

@Injectable()
export class VentanillareferenciaService {
  constructor(
    @InjectRepository(Ventanillareferencia)
    private ventanillaReferenciaRepository: Repository<Ventanillareferencia>,
  ) {}

  async obtenerVentanillaReferencia() {
    const ventanillaReferencias = await this.ventanillaReferenciaRepository.find({
      relations: ['ventanilla', 'referencia']
    });
    return ventanillaReferencias;
  }

  async guardarVentanillaRefencia(
    ventanillaReferencia: VentanillaReferenciaDTO,
  ) {
    const nuevoRegistro = await this.ventanillaReferenciaRepository.create({
      ...ventanillaReferencia,
    });
    await this.ventanillaReferenciaRepository;
    return nuevoRegistro;
  }
}
