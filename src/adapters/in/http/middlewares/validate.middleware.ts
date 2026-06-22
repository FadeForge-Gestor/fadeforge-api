import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { BadRequestError } from "@shared/errors/HttpError";

// Middleware para validar el cuerpo de la solicitud utilizando un esquema de zod
export const validate = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return next(new BadRequestError(result.error.issues[0].message));
        }
        req.body = result.data;
        next();
    };
};

export const validateParams = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            return next(new BadRequestError(result.error.issues[0].message));
        }
        req.validatedParams = result.data as Record<string, unknown>;
        next();
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return next(new BadRequestError(result.error.issues[0].message));
        }
        req.validatedQuery = result.data as Record<string, unknown>;
        next();
    };
};