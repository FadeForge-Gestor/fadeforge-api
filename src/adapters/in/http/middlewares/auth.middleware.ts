import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/HttpError';

interface JwtPayload {
    id: number;
    correo: string;
    rol: number;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = { id: payload.id, correo: payload.correo, rol: payload.rol };
        next();
    } catch {
        next(new UnauthorizedError('Token inválido o expirado'));
    }
};

export const authorize = (...roles: number[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return next(new ForbiddenError());
        }
        next();
    };
};
