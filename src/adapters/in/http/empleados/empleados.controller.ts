import { ok } from "@shared/utils/response";
import { Request, Response, NextFunction } from "express";
import { IEmpleadoUseCase } from "@core/ports/in/empleados/IEmpleadoUseCase";

export class EmpleadosController {

    // El controller recibe el caso de uso por inyección de dependencias,
    // igual que con auth — nunca instancia nada directamente.
    constructor(private readonly empleadoUseCase: IEmpleadoUseCase) {}

    // Método para listar todo los empleados
    async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empleados = await this.empleadoUseCase.listar();
            res.status(200).json(ok(empleados))
        } catch (error) {
            next(error);
        }
    }

    // Método para listar los empleados que están activos
    async listarActivos(req: Request, res: Response, next: NextFunction): Promise<void> {}

}