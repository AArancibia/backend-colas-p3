import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Referencia } from './referencia.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReferenciaService {
  constructor(
    @InjectRepository(Referencia)
    private referenciaRepository: Repository<Referencia>,
  ) {}

  async obtenerReferencias() {
    const referencias = await this.referenciaRepository.find();
    return referencias;
  }
}
