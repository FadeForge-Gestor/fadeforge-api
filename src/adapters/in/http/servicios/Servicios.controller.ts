import { Request, Response, NextFunction } from "express";
import { IServicioUseCase } from "@core/ports/in/servicios/IServicioUseCase";
import { ok } from "@shared/utils/response";

export class ServiciosController {

    // El controller recibe el caso de uso por inyección de dependencias,
    constructor(private readonly serviciosUseCase: IServicioUseCase) {}

    // Método para listar todos los servicios
    async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const servicios = await this.serviciosUseCase.listar();
            res.status(200).json(ok(servicios));
        } catch (error) {
            next(error);
        }
    }

    // Método para listar todos los servicios activos
    async listarActivos(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const servicios = await this.serviciosUseCase.listarActivos();
            res.status(200).json(ok(servicios));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener un servicio por ID
    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const servicio = await this.serviciosUseCase.obtenerPorId(id);
            res.status(200).json(ok(servicio));
        } catch (error) {
            next(error);
        }
    }

    // Método para desactivar un servicio
    async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.serviciosUseCase.desactivar(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

}
