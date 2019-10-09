import { Controller, Get } from '@nestjs/common';
import { VentanillareferenciaService } from './ventanillareferencia.service';

@Controller('ventanillareferencia')
export class VentanillareferenciaController {
  constructor(
    private ventanillaReferenciaService: VentanillareferenciaService,
  ) {}

  @Get()
  obtenerVentanillaReferencia() {
    return this.ventanillaReferenciaService.obtenerVentanillaReferencia();
  }
}
