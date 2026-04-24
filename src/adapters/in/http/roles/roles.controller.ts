import { Request, Response, NextFunction } from 'express';
import { IRolUseCase } from '@core/ports/in/roles/IRolUseCase';
import { ok } from '@shared/utils/response';

export class RolesController {

    // El controller recibe el caso de uso por inyección de dependencias,
    // igual que con auth — nunca instancia nada directamente.
    constructor(private readonly rolUseCase: IRolUseCase) {}

    // Listamos los roles
    async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const roles = await this.rolUseCase.listar();
            res.status(200).json(ok(roles));
        } catch (error) {
            next(error);
        }
    }

    // Listamos los roles activos
    async listarActivos(_req: Request, res: Response, next: NextFunction) {
        try {
            const roles = await this.rolUseCase.listarActivos();
            res.status(200).json(ok(roles));
        } catch (error) {
            next(error);
        }
    }

    // Obtenemos por id un rol
    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const rol = await this.rolUseCase.obtenerPorId(id);
            res.status(200).json(ok(rol));
        } catch (error) {
            next(error);
        }
    }

    // Creamos un nuevo rol
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rol = await this.rolUseCase.crear(req.body);
            res.status(201).json(ok(rol));
        } catch (error) {
            next(error);
        }
    }

    // Actualizmaos un rol
    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const rol = await this.rolUseCase.actualizar(id, req.body);
            res.status(200).json(ok(rol));
        } catch (error) {
            next(error);
        }
    }

    // Desactivamos un rol
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
