import { Request, Response, NextFunction } from "express";
import { IHistorialPrecioUseCase } from "@core/ports/in/historial-precio/IHistorialPrecioUseCase";
import { ok } from "@shared/utils/response";

export class HistorialPrecioController {

    // El controller recibe el caso de uso por inyección de dependencias
    constructor(private readonly historialPrecioUseCase: IHistorialPrecioUseCase) {}

    // Método para listar todos los precios de un servicio
    async listarPorServicio(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idServicio = Number(req.params.idServicio);
            const historial = await this.historialPrecioUseCase.listarPorServicio(idServicio);
            res.status(200).json(ok(historial));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener el precio vigente de un servicio
    async obtenerPrecioActual(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idServicio = Number(req.params.idServicio);
            const precio = await this.historialPrecioUseCase.obtenerPrecioActual(idServicio);
            res.status(200).json(ok(precio));
        } catch (error) {
            next(error);
        }
    }

    // Método para registrar un nuevo precio para un servicio
    async registrarPrecio(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const historial = await this.historialPrecioUseCase.registrarPrecio(req.body);
            res.status(201).json(ok(historial));
        } catch (error) {
            next(error);
        }
    }

}
