import { Request, Response, NextFunction } from "express";
import { ICategoriaServicioUseCase } from "@core/ports/in/categoria-servicio/ICategoriaServicioUseCase";
import { ok } from "@shared/utils/response";

export class CategoriaServicios {

    // El controller recibe el caso de uso por inyección de dependencias,
    // igual que con auth — nunca instancia nada directamente.
    constructor(private readonly categoriaServiciosUseCase: ICategoriaServicioUseCase) {}

    // Método para listar todas las categorias de servicios
    async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoriaServicios = await this.categoriaServiciosUseCase.listar();
            res.status(200).json(ok(categoriaServicios));
        } catch (error) {
            next(error);
        }
    }

    // Método para listar todas las categorias de servicios activas
    async listarActivos(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoriaServicios = await this.categoriaServiciosUseCase.listarActivos();
            res.status(200).json(ok(categoriaServicios));
        } catch (error) {
            next(error);
        }
    }

    // Método para obtener una categoria servicio por ID
    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const categoriaServicio = await this.categoriaServiciosUseCase.obtenerPorId(id);
            res.status(200).json(ok(categoriaServicio));
        } catch (error) {
            next(error);
        }
    }

    // Método para crear una categoría de servicio
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoriaServicio = await this.categoriaServiciosUseCase.crear(req.body);
            res.status(201).json(ok(categoriaServicio));
        } catch (error) {
            next(error);
        }
    }

    // Método para actualizar una categoría servicio
    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const categoriaServicio = await this.categoriaServiciosUseCase.actualizar(id, req.body);
            res.status(200).json(ok(categoriaServicio));
        } catch (error) {
            next(error);
        }
    } 

    // Método para desactivar una categoría servicio
    async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.categoriaServiciosUseCase.desactivar(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

}