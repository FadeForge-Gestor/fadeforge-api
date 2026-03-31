import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/HttpError';

// Interfaz para la carga útil del JWT
export interface JwtPayload {
    id: number;
    correo: string;
    rol: number;
}

// Middleware para autenticar al usuario mediante un token JWT
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers.authorization;

    // Verificar que el encabezado de autorización esté presente y tenga el formato correcto
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Token no proporcionado'));
    }

    // Extraer el token del encabezado
    const token = authHeader.split(' ')[1];

    // Verificar y decodificar el token
    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = { id: payload.id, correo: payload.correo, rol: payload.rol };
        next();
    } catch {
        next(new UnauthorizedError('Token inválido o expirado'));
    }
};

// Middleware para autorizar al usuario según su rol
export const authorize = (...roles: number[]) => {
    // Retornar un middleware que verifica si el usuario tiene uno de los roles permitidos
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return next(new ForbiddenError());
        }
        next();
    };
};
