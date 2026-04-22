import { Request, Response, NextFunction } from "express";
import { ICredencialUseCase } from "@core/ports/in/credenciales/ICredencialUseCase";

export class CredencialesController {

    // El controller recibe el caso de uso por inyección de dependencias,
    constructor(private readonly credencialUseCase: ICredencialUseCase) {}

    // Método para cambiar la contraseña del usuario autentificado
    async cambiarContrasena(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idUsuario = req.user!.id;
            await this.credencialUseCase.cambiarContrasena(idUsuario, req.body);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Método para restablecer la contraseña de un usuarios
    async cambiarCorreo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idUsuario = req.user!.id;
            await this.credencialUseCase.cambiarCorreo(idUsuario, req.body);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Método para restablecer la contraseña de un usuario
    async resetContrasena(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idUsuario = Number(req.params.id);
            await this.credencialUseCase.resetearContrasena(idUsuario, req.body);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

}
