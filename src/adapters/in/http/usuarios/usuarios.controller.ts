import { Request, Response, NextFunction } from "express";
import { IUsuarioUseCase } from "@core/ports/in/usuarios/IUsuarioUseCase";
import { ok } from "@shared/utils/response";

export class UsuariosController {

    constructor(private readonly usuarioUseCase: IUsuarioUseCase) {}

    // Método para listar los usuarios
    async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const usuarios = await this.usuarioUseCase.listar();
            res.status(200).json(ok(usuarios));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener un usuario por ID
    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const usuario = await this.usuarioUseCase.obtenerPorId(id);
            res.status(200).json(ok(usuario));
        } catch (error) {
            next(error);
        }
    }

    // Método para crear un usuario
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const usuario = await this.usuarioUseCase.crear(req.body);
            res.status(201).json(ok(usuario));
        } catch (error) {
            next(error);
        }
    }

    // Método para actualizar un usuario
    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const usuario = await this.usuarioUseCase.actualizar(id, req.body, req.user!.id);
            res.status(200).json(ok(usuario));
        } catch (error) {
            next(error);
        }
    } 

    // Método para desactivar un usuario
    async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.usuarioUseCase.desactivar(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Método para reactivar un usuario
    async reactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.usuarioUseCase.reactivar(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

}