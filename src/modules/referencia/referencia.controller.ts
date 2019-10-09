import { Controller, Get } from '@nestjs/common';
import { ReferenciaService } from './referencia.service';

@Controller('referencia')
export class ReferenciaController {
  constructor(private referenciaService: ReferenciaService) {}

  @Get()
  obtenerReferencias() {
    return this.referenciaService.obtenerReferencias();
  }
}
