import { Router } from 'express';
import { ServiciosController } from './Servicios.controller';
import { ServiciosUseCase } from '@core/usecases/servicios/servicios.usecase';
import { ServiciosPrismaRepository } from '@adapters/out/db/servicios/servicios.prisma.repository';
