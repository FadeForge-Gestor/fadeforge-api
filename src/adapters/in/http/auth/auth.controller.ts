import { Request, Response, NextFunction } from "express";
import { IAuthUseCase } from "@core/ports/in/auth/IAuthUseCase";
import { IRegistroClienteUseCase } from "@core/ports/in/auth/IRegistroClienteUseCase";
import { IConfirmarEmailUseCase } from "@core/ports/in/auth/IConfirmarEmailUseCase";
import { IReenviarVerificacionUseCase } from "@core/ports/in/auth/IReenviarVerificacionUseCase";
import { IValidarTokenVerificacionUseCase } from "@core/ports/in/auth/IValidarTokenVerificacionUseCase";
import { BadRequestError } from '@shared/errors/HttpError';
import { ok } from "@shared/utils/response";

export class AuthController {

    constructor(
        private readonly authUseCase: IAuthUseCase,
        private readonly registroClienteUseCase: IRegistroClienteUseCase,
        private readonly confirmarEmailUseCase: IConfirmarEmailUseCase,
        private readonly reenviarVerificacionUseCase: IReenviarVerificacionUseCase,
        private readonly validarTokenVerificacionUseCase: IValidarTokenVerificacionUseCase,
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
            const token = req.query.token as string | undefined;
            if (!token) {
                throw new BadRequestError('El token de verificación es requerido');
            }

            // GET read-only: valida sin mutar (un GET no debe tener efectos).
            const { valido } = await this.validarTokenVerificacionUseCase.validar(token);
            if (!valido) {
                throw new BadRequestError('El token de verificación es inválido o expiró');
            }

            res.status(200).json(ok({ valido: true, mensaje: 'El token es válido' }));
        } catch (error) {
            next(error);
        }
    }

    async confirmarEmailPost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // POST consume el token: marca email_verificado=true y lo elimina (single-use).
            await this.confirmarEmailUseCase.confirmar(req.body.token);
            res.status(200).json(ok({ mensaje: 'Correo electrónico verificado. Ya podés iniciar sesión.' }));
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
