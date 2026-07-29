import { Router } from 'express';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '@core/usecases/auth/login.usecase';
import { RegistroClienteUseCase } from '@core/usecases/auth/registroCliente.usecase';
import { ConfirmarEmailUseCase } from '@core/usecases/auth/confirmarEmail.usecase';
import { ReenviarVerificacionUseCase } from '@core/usecases/auth/reenviarVerificacion.usecase';
import { AuthPrismaRepository } from '@adapters/out/db/auth/auth.prisma.repository';
import { LoginSecurityPrismaRepository } from '@adapters/out/db/login-security/loginSecurity.prisma.repository';
import { UsuariosPrismaRepository } from '@adapters/out/db/usuarios/usuarios.prisma.repository';
import { RolesPrismaRepository } from '@adapters/out/db/roles/roles.prisma.repository';
import { CredencialesPrismaRepository } from '@adapters/out/db/credenciales/credenciales.prisma.repository';
import { ResendEmailService } from '@adapters/out/email/resendEmail.service';
import { NullEmailService } from '@adapters/out/email/nullEmail.service';
import { TokenVerificacionPrismaRepository } from '@adapters/out/email/tokenVerificacion.prisma.repository';
import { IdempotencyMemoryRepository } from '@adapters/out/memory/idempotency/idempotency.memory.repository';
import { idempotency } from '@middlewares/idempotency.middleware';
import { validate } from '@middlewares/validate.middleware';
import { authRateLimit, userLoginRateLimit } from '@middlewares/rate-limit.middleware';
import { loginSchema, registroClienteSchema, reenviarVerificacionSchema } from './auth.schema';
import { env } from '@config/env';

const router = Router();

const authRepo = new AuthPrismaRepository();
const loginSecurityRepo = new LoginSecurityPrismaRepository();
const usuariosRepo = new UsuariosPrismaRepository();
const rolesRepo = new RolesPrismaRepository();
const credencialesRepo = new CredencialesPrismaRepository();
const tokenVerificacionRepo = new TokenVerificacionPrismaRepository();
const emailService = env.EMAIL_VERIFICATION_ENABLED
    ? new ResendEmailService()
    : new NullEmailService();
const idempotencyRepo = new IdempotencyMemoryRepository();

const loginUseCase = new LoginUseCase(authRepo, loginSecurityRepo);
const registroUseCase = new RegistroClienteUseCase(
    usuariosRepo,
    rolesRepo,
    emailService,
    tokenVerificacionRepo,
);
const confirmarEmailUseCase = new ConfirmarEmailUseCase(tokenVerificacionRepo, credencialesRepo);
const reenviarVerificacionUseCase = new ReenviarVerificacionUseCase(
    tokenVerificacionRepo,
    emailService,
    usuariosRepo,
    credencialesRepo,
);

const controller = new AuthController(
    loginUseCase,
    registroUseCase,
    confirmarEmailUseCase,
    reenviarVerificacionUseCase,
);

router.post('/login', authRateLimit, userLoginRateLimit, validate(loginSchema), (req, res, next) => controller.login(req, res, next));
router.post('/registro', validate(registroClienteSchema), (req, res, next) => controller.registroCliente(req, res, next));

router.get('/confirmar', (req, res, next) => controller.confirmarEmail(req, res, next));
router.post('/reenviar-verificacion', idempotency(idempotencyRepo), validate(reenviarVerificacionSchema), (req, res, next) => controller.reenviarVerificacion(req, res, next));

export default router;
