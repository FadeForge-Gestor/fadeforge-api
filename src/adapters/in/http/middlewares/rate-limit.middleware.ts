import rateLimit from 'express-rate-limit';

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
