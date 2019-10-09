import { Module } from '@nestjs/common';
import { ReferenciaController } from './referencia.controller';
import { ReferenciaService } from './referencia.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referencia } from './referencia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Referencia])],
  controllers: [ReferenciaController],
  providers: [ReferenciaService],
})
export class ReferenciaModule {}
