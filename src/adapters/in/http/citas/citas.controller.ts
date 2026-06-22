import { Request, Response, NextFunction } from "express";
import { ICitasUseCase } from "@core/ports/in/citas/ICitasUseCase";
import { ok } from "@shared/utils/response";
import { ROLES } from "@shared/constants/roles";
import { BadRequestError } from "@shared/errors/HttpError";

export class CitasController {

    constructor(private readonly citasUseCase: ICitasUseCase) {}

    // Métodos para listar y obtener las citas por un rango de fechas, por ID, por folio y por cliente
    async listarPorRangoFecha(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { desde, hasta } = req.validatedQuery as { desde: Date; hasta: Date };
            const citas = await this.citasUseCase.listarPorRangoFecha(desde, hasta);
            res.status(200).json(ok(citas));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener una cita por su ID
    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const cita = await this.citasUseCase.obtenerPorId(id, req.user!);
            res.status(200).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener una cita por su folio
    async obtenerPorFolio(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const folio = String(req.params.folio);
            const cita = await this.citasUseCase.obtenerPorFolio(folio, req.user!);
            res.status(200).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

    // Método para listar las citas de un cliente por su ID
    async listarPorCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idCliente = Number(req.params.idCliente);
            const citas = await this.citasUseCase.listarPorCliente(idCliente, req.user!);
            res.status(200).json(ok(citas));
        } catch (error) {
            next(error);
        }
    }

    // Método para crear una nueva cita
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id: userId, rol } = req.user!;
            const idCliente = rol === ROLES.CLIENTE ? userId : req.body.idCliente;
            if (!idCliente) return next(new BadRequestError('El campo idCliente es requerido'));
            const cita = await this.citasUseCase.crear({ ...req.body, idCliente });
            res.status(201).json(ok(cita));
        } catch (error) {
            next(error);
        }
    }

    // Método para actualizar una cita existente
    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const cita = await this.citasUseCase.actualizar(id, req.body, req.user!);
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