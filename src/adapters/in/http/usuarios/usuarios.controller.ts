import { Request, Response, NextFunction } from "express";
import { IUsuarioUseCase } from "@core/ports/in/usuarios/IUsuarioUseCase";
import { ok } from "@shared/utils/response";

export class UsuariosController {

    // El controller recibe el caso de uso por inyección de dependencias,
    // igual que con auth — nunca instancia nada directamente.
    constructor(private readonly usuarioUseCase: IUsuarioUseCase) {}

    async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const usuarios = await this.usuarioUseCase.listar();
            res.status(200).json(ok(usuarios));
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const usuario = await this.usuarioUseCase.obtenerPorId(id);
            res.status(200).json(ok(usuario));
        } catch (error) {
            next(error);
        }
    }

    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const usuario = await this.usuarioUseCase.crear(req.body);
            res.status(201).json(ok(usuario));
        } catch (error) {
            next(error);
        }
    }

    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const usuarios = await this.usuarioUseCase.actualizar(id, req.body);
            res.status(200).json(ok(usuarios));
        } catch (error) {
            next(error);
        }
    } 

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.usuarioUseCase.eliminar(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

}