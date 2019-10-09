import { Module } from '@nestjs/common';
import { VentanillareferenciaController } from './ventanillareferencia.controller';
import { VentanillareferenciaService } from './ventanillareferencia.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ventanillareferencia } from './ventanillareferencia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ventanillareferencia])],
  controllers: [VentanillareferenciaController],
  providers: [VentanillareferenciaService],
})
export class VentanillareferenciaModule {}
