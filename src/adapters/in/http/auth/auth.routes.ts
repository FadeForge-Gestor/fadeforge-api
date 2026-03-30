import { Router } from 'express';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '@core/usecases/auth/login.usecase';
import { AuthPrismaRepository } from '@adapters/out/db/auth/auth.prisma.repository';

// Configuración de rutas para la autentificación
const router = Router();

// Inyección de dependencias y creación del controlador
const repositorio = new AuthPrismaRepository();
const casoDeUso = new LoginUseCase(repositorio);
const controller = new AuthController(casoDeUso);

router.post('/login', (req, res, next) => controller.login(req, res, next));

export default router;
