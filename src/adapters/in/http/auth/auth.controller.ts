import { Request, Response, NextFunction } from "express";
import { IAuthUseCase } from "@core/ports/in/auth/IAuthUseCase";
import { IRegistroClienteUseCase } from "@core/ports/in/auth/IRegistroClienteUseCase";
import { ok } from "@shared/utils/response";

export class AuthController {

    constructor(
        private readonly authUseCase: IAuthUseCase,
        private readonly registroClienteUseCase: IRegistroClienteUseCase,
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
}