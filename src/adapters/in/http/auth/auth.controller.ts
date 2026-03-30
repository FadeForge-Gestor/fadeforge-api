import { Request, Response, NextFunction } from "express";
import { IAuthUseCase } from "@core/ports/in/auth/IAuthUseCase";
import { loginSchema } from "./auth.schema";
import { BadRequestError } from "@shared/errors/HttpError"; 

// Controlador de la autentificación
export class AuthController {

    // Inyección de dependencias del caso de uso de la autentificación
    constructor(private readonly authUseCase: IAuthUseCase) {}

    // Método para manejar la solicitud de login
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = loginSchema.safeParse(req.body);

            if (!result.success) {
                throw new BadRequestError(result.error.message);
            }

            const output = await this.authUseCase.login(result.data);

            res.status(200).json({ ok: true, data: output });
        } catch (error) {
            next(error);
        }
    }
}