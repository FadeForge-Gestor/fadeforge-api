import { Request, Response, NextFunction } from "express";
import { IAuthUseCase } from "@core/ports/in/auth/IAuthUseCase";
import { ok } from "@shared/utils/response";

// Controlador de la autentificación
export class AuthController {

    // Inyección de dependencias del caso de uso de la autentificación
    constructor(private readonly authUseCase: IAuthUseCase) {}

    // Método para manejar la solicitud de login
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const output = await this.authUseCase.login(req.body);
            res.status(200).json(ok(output));
        } catch (error) {
            next(error);
        }
    }
}