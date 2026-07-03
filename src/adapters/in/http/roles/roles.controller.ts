import { Request, Response, NextFunction } from 'express';
import { IRolUseCase } from '@core/ports/in/roles/IRolUseCase';
import { IdParamDto } from './roles.schema';
import { ok } from '@shared/utils/response';

export class RolesController {

    constructor(private readonly rolUseCase: IRolUseCase) {}

    async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const roles = await this.rolUseCase.listar();
            res.status(200).json(ok(roles));
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.validatedParams as IdParamDto;
            const rol = await this.rolUseCase.obtenerPorId(id);
            res.status(200).json(ok(rol));
        } catch (error) {
            next(error);
        }
    }
}
