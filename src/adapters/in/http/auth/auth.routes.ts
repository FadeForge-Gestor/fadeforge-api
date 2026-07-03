import { Router } from 'express';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '@core/usecases/auth/login.usecase';
import { RegistroClienteUseCase } from '@core/usecases/auth/registroCliente.usecase';
import { AuthPrismaRepository } from '@adapters/out/db/auth/auth.prisma.repository';
import { UsuariosPrismaRepository } from '@adapters/out/db/usuarios/usuarios.prisma.repository';
import { RolesPrismaRepository } from '@adapters/out/db/roles/roles.prisma.repository';
import { validate } from '@middlewares/validate.middleware';
import { authRateLimit } from '@middlewares/rate-limit.middleware';
import { loginSchema, registroClienteSchema } from './auth.schema';

const router = Router();

const loginUseCase = new LoginUseCase(new AuthPrismaRepository());
const registroUseCase = new RegistroClienteUseCase(new UsuariosPrismaRepository(), new RolesPrismaRepository());
const controller = new AuthController(loginUseCase, registroUseCase);

router.post('/login', authRateLimit, validate(loginSchema), (req, res, next) => controller.login(req, res, next));
router.post('/registro', validate(registroClienteSchema), (req, res, next) => controller.registroCliente(req, res, next));

export default router;
