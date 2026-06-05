import { Request, Response, NextFunction } from "express";
import { ICitasUseCase } from "@core/ports/in/citas/ICitasUseCase";
import { ok } from "@shared/utils/response";

export class CitasController {

    constructor(private readonly citasUseCase: ICitasUseCase) {}

    // Métodos para listar y obtener las citas por un rango de fechas, por ID, por folio y por cliente
    async listarPorRangoFecha(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { desde, hasta } = req.query;
            const citas = await this.citasUseCase.listarPorRangoFecha(new Date(desde as string), new Date(hasta as string));
            res.status(200).json(ok(citas));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener una cita por su ID
    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const cita = await this.citasUseCase.obtenerPorId(id);
            res.status(200).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener una cita por su folio
    async obtenerPorFolio(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const folio = String(req.params.folio);
            const cita = await this.citasUseCase.obtenerPorFolio(folio);
            res.status(200).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

    // Método para listar las citas de un cliente por su ID
    async listarPorCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idCliente = Number(req.params.idCliente);
            const citas = await this.citasUseCase.listarPorCliente(idCliente);
            res.status(200).json(ok(citas));
        } catch (error) {
            next(error);
        }
    }

    // Método para crear una nueva cita
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cita = await this.citasUseCase.crear(req.body);
            res.status(201).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

    // Método para actualizar una cita existente
    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const cita = await this.citasUseCase.actualizar(id, req.body);
            res.status(200).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

    // Método para cambiar el estado de una cita
    async cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const { estado, motivoCancelado, canceladoPor } = req.body;
            const cita = await this.citasUseCase.cambiarEstado(id, estado, motivoCancelado, canceladoPor);
            res.status(200).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

}