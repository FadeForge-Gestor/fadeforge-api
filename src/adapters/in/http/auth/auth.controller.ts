import { Request, Response, NextFunction } from "express";
import { IAuthUseCase } from "@core/ports/in/auth/IAuthUseCase";
import { IRegistroClienteUseCase } from "@core/ports/in/auth/IRegistroClienteUseCase";
import { IConfirmarEmailUseCase } from "@core/ports/in/auth/IConfirmarEmailUseCase";
import { IReenviarVerificacionUseCase } from "@core/ports/in/auth/IReenviarVerificacionUseCase";
import { ok } from "@shared/utils/response";

export class AuthController {

    constructor(
        private readonly authUseCase: IAuthUseCase,
        private readonly registroClienteUseCase: IRegistroClienteUseCase,
        private readonly confirmarEmailUseCase: IConfirmarEmailUseCase,
        private readonly reenviarVerificacionUseCase: IReenviarVerificacionUseCase,
    ) {}

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const output = await this.authUseCase.login(req.body);
            res.status(200).json(ok(output));
        } catch (error) {
            next(error);
        }
    }

    async registroCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const output = await this.registroClienteUseCase.registrar(req.body);
            res.status(201).json(ok(output));
        } catch (error) {
            next(error);
        }
    }

    async confirmarEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.query.token as string;
            await this.confirmarEmailUseCase.confirmar(token);
            res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/correo-confirmado`);
        } catch (error) {
            next(error);
        }
    }

    async reenviarVerificacion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await this.reenviarVerificacionUseCase.reenviar(req.body.correo);
            res.status(200).json(ok({ mensaje: 'Correo de verificación reenviado' }));
        } catch (error) {
            next(error);
        }
    }
}
