import { Router } from "express";
import { EmpleadosController } from "./empleados.controller";
import { EmpleadosUseCase } from "@core/usecases/empleados/empleados.usecase";
import { EmpleadosPrismaRepository } from "@adapters/out/db/empleados/empleados.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";