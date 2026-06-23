import { Request, Response, NextFunction } from "express";
import { HttpError } from "@shared/errors/HttpError";
import { env } from "@config/env";

export const errorMiddleware = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({
            ok: false,
            name: error.name,
            message: error.message,
        });
        return;
    }

    if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({
            ok: false,
            name: 'BadRequest',
            message: 'El cuerpo de la petición no es JSON válido',
        });
        return;
    }

    // Error inesperado - solo muestra el detalle en desarrollo
    if (env.NODE_ENV === 'development') {
        console.error(error);
    }

    res.status(500).json({
        ok: false,
        name: 'InternalServerError',
        message: 'Error interno del servidor',
    });
}