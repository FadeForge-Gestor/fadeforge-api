import { ICategoriaServicioRepository } from "@core/ports/out/categoria-servicio/ICategoriaServicioRepository";
import { CategoriaServicio, CrearCategoriaServicioInput, ActualizarCategoriaServicioInput } from "@core/domain/categoria-servicio/categoriaServicio.entity";
import { prisma } from "../prisma.client";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";

export class CategoriaServicioPrismaRepository implements ICategoriaServicioRepository {

    private mapear(categoriaServicios: {
        id: number;
        nombre: string;
        descripcion: string | null;
        activo: boolean;
        fecha_creacion: Date;
        fecha_modificacion: Date;
    }): CategoriaServicio {
        return {
            id: categoriaServicios.id,
            nombre: categoriaServicios.nombre,
            descripcion: categoriaServicios.descripcion,
            activo: categoriaServicios.activo,
            fechaCreacion: categoriaServicios.fecha_creacion,
            fechaModificacion: categoriaServicios.fecha_modificacion,
        }
    }

    // Método para listar todas las categorías de servicios ordenados por ID de forma ascendente
    async listarTodos(): Promise<CategoriaServicio[]> {
        const categoriasServicios = await prisma.categorias_servicios.findMany({
            orderBy: { id: 'asc' },
        });
        return categoriasServicios.map(c => this.mapear(c));
    }

    // Método para listar todas las categorías activas de servicios ordenados por ID de forma ascendente
    async listarActivos(): Promise<CategoriaServicio[]> {
        const categoriasServicios = await prisma.categorias_servicios.findMany({
            orderBy: { id: 'asc' },
            where: { activo: true }
        });
        return categoriasServicios.map(c => this.mapear(c));
    }

    // Método para buscar una categoría de servicio por id
    async buscarPorId(id: number): Promise<CategoriaServicio | null> {
        const categoriaServicio = await prisma.categorias_servicios.findUnique({ where: { id } });
        if (!categoriaServicio) return null;
        return this.mapear(categoriaServicio);
    }

    // Método para buscar una categoría de servicio por su nombre
    async buscarPorNombre(nombre: string): Promise<CategoriaServicio | null> {
        const categoriaServicio = await prisma.categorias_servicios.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' } } });
        if (!categoriaServicio) return null;
        return this.mapear(categoriaServicio);
    }

    // Método para crear una nueva categoria de servicio
    async crear(input: CrearCategoriaServicioInput): Promise<CategoriaServicio> {
        try {
            const categoriaServicio = await prisma.categorias_servicios.create({
                data: {
                    nombre: input.nombre,
                    descripcion: input.descripcion
                }
            });
            return this.mapear(categoriaServicio);
        } catch (error: any) {
            if (error?.code === 'P2002') throw new ConflictError('Ya existe una categoria de un servicio con este nombre');
            throw error;
        }
    }

    // Método para actualizar una categoría de servicio
    async actualizar(id: number, input: ActualizarCategoriaServicioInput): Promise<CategoriaServicio> {
        try {
            const categoriaServicio = await prisma.categorias_servicios.update({
                where: { id },
                data: {
                    ...(input.nombre && { nombre: input.nombre }),
                    ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
                    ...(input.activo !== undefined && { activo: input.activo }),
                    fecha_modificacion: new Date(),
                }
            });
            return this.mapear(categoriaServicio);
        } catch (error: any) {
            if (error?.code === 'P2025') throw new NotFoundError(`Categoría de Servicio con id ${id} no encontrado`);
            if (error?.code === 'P2002') throw new ConflictError('Ya existe una categoría con ese nombre');
            throw error;
        }
    }

    // Soft delete: solo cambiamos activo = false, el registro permanece en la BD.
    async desactivar(id: number): Promise<void> {
        await prisma.categorias_servicios.update({
            where: { id },
            data: { activo: false, fecha_modificacion: new Date() },
        });
    }

}