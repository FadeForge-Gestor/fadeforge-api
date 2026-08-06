import rateLimit from 'express-rate-limit';
import { env } from '@config/env';

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos.',
    },
});

export const userLoginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => req.body?.correo?.toLowerCase() ?? 'unknown',
    message: {
        status: 'error',
        message: 'Demasiados intentos para este correo. Intentá de nuevo en 15 minutos.',
    },
});

// Global: toda la API bajo /api/v1 (docs Swagger queda fuera por orden de montaje en server.ts)
export const apiRateLimit = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: 'error',
        message: `Demasiadas solicitudes desde esta IP. Intentá de nuevo en ${env.RATE_LIMIT_WINDOW_MINUTES} minutos.`,
    },
});

// Estrictos por endpoint público de auth
export const authRegisterRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Demasiadas solicitudes desde esta IP. Intentá de nuevo en 15 minutos.',
    },
});

export const authConfirmRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Demasiadas solicitudes desde esta IP. Intentá de nuevo en 15 minutos.',
    },
});

export const authResendRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Demasiadas solicitudes desde esta IP. Intentá de nuevo en 15 minutos.',
    },
});
