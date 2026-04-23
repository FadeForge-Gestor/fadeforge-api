import { Request, Response, NextFunction } from 'express';
import { IRolUseCase } from '@core/ports/in/roles/IRolUseCase';
import { ok } from '@shared/utils/response';

export class RolesController {

    // El controller recibe el caso de uso por inyección de dependencias,
    // igual que con auth — nunca instancia nada directamente.
    constructor(private readonly rolUseCase: IRolUseCase) {}

    async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const roles = await this.rolUseCase.listar();
            res.status(200).json(ok(roles));
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const rol = await this.rolUseCase.obtenerPorId(id);
            res.status(200).json(ok(rol));
        } catch (error) {
            next(error);
        }
    }

    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rol = await this.rolUseCase.crear(req.body);
            res.status(201).json(ok(rol));
        } catch (error) {
            next(error);
        }
    }

    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const rol = await this.rolUseCase.actualizar(id, req.body);
            res.status(200).json(ok(rol));
        } catch (error) {
            next(error);
        }
    }

    async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.rolUseCase.desactivar(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
