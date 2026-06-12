import { ok } from "@shared/utils/response";
import { Request, Response, NextFunction } from "express";
import { IEmpleadoUseCase } from "@core/ports/in/empleados/IEmpleadoUseCase";

export class EmpleadosController {

    constructor(private readonly empleadoUseCase: IEmpleadoUseCase) {}

    // Método para listar todo los empleados
    async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empleados = await this.empleadoUseCase.listar();
            res.status(200).json(ok(empleados))
        } catch (error) {
            next(error);
        }
    }

    // Método para listar los empleados que están activos
    async listarActivos(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empleados = await this.empleadoUseCase.listarActivos();
            res.status(200).json(ok(empleados))
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener un empleado por id
    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const empleado = await this.empleadoUseCase.obtenerPorId(id);
            res.status(200).json(ok(empleado));
        } catch (error) {
            next(error);
        }
    }

    // Método promover un empleado
    async promover(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empleado = await this.empleadoUseCase.promover(req.body);
            res.status(201).json(ok(empleado));
        } catch (error) {
            next(error);
        }
    }

    // Método para desactivar un usuario
    async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.empleadoUseCase.desactivar(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
    
}