import { IServicioRepository } from "@core/ports/out/servicios/IServicioRepository";
import { Servicio, CrearServicioInput, ActualizarServicioInput } from "@core/domain/servicio/servicio.entity";
import { prisma } from "../prisma.client";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";

export class ServiciosPrismaRepository implements IServicioRepository {

    private mapear(servicios: {
        id: number;
        nombre: string;
        descripcion: string | null;
        duracion_minutos: number;
        id_categoria: number;
        imagen_url: string | null;
        id_imagen: string | null;
        nombre_imagen: string | null;
        activo: boolean;
        fecha_creacion: Date;
        fecha_modificacion: Date;
    }): Servicio {
        return {
            id: servicios.id,
            nombre: servicios.nombre,
            descripcion: servicios.descripcion,
            duracionMinutos: servicios.duracion_minutos,
            idCategoria: servicios.id_categoria,
            imagenUrl: servicios.imagen_url,
            idImagen: servicios.id_imagen,
            nombreImagen: servicios.nombre_imagen,
            activo: servicios.activo,
            fechaCreacion: servicios.fecha_creacion,
            fechaModificacion: servicios.fecha_modificacion,
        }
    }

    // Método para listar todos los servicios ordenados por ID de forma ascendente
    async listarTodos(): Promise<Servicio[]> {
        const servicios = await prisma.servicios.findMany({
            orderBy: { id: 'asc' },
        });
        return servicios.map(c => this.mapear(c));
    }
    
    // Método para listar todos los servicios activos ordenados por ID de forma ascendente
    async listarActivos(): Promise<Servicio[]> {
        const servicios = await prisma.servicios.findMany({
            orderBy: { id: 'asc' },
            where: { activo: true }
        });
        return servicios.map(c => this.mapear(c));
    }

    // Método para buscar un servicio por id
    async buscarPorId(id: number): Promise<Servicio | null> {
        const servicio = await prisma.servicios.findUnique({ where: { id } });
        if (!servicio) return null;
        return this.mapear(servicio);
    }

    // Método para buscar un servicio por su nombre
    async buscarPorNombre(nombre: string): Promise<Servicio | null> {
        const servicio = await prisma.servicios.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' } } });
        if (!servicio) return null;
        return this.mapear(servicio);
    }

    // Método para crear un nuevo servicio
    async crear(input: CrearServicioInput): Promise<Servicio> {
        try {
            const servicio = await prisma.servicios.create({
                data: {
                    nombre: input.nombre,
                    descripcion: input.descripcion,
                    duracion_minutos: input.duracionMinutos,
                    id_categoria: input.idCategoria,
                    imagen_url: input.imagenUrl,
                    id_imagen: input.idImagen,
                    nombre_imagen: input.nombreImagen,
                }
            });
            return this.mapear(servicio);
        } catch (error: any) {
            if (error?.code === 'P2002') throw new ConflictError('Ya existe un servicio con este nombre');
            throw error;
        }
    }

    // Método para actualizar un servicio
    async actualizar(id: number, input: ActualizarServicioInput): Promise<Servicio> {
        try {
            const servicio = await prisma.servicios.update({
                where: { id },
                data: {
                    ...(input.nombre && { nombre: input.nombre }),
                    ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
                    ...(input.duracionMinutos && { duracion_minutos: input.duracionMinutos }),
                    ...(input.idCategoria && { id_categoria: input.idCategoria }),
                    ...(input.imagenUrl !== undefined && { imagen_url: input.imagenUrl }),
                    ...(input.idImagen !== undefined && { id_imagen: input.idImagen }),
                    ...(input.nombreImagen !== undefined && { nombre_imagen: input.nombreImagen }),
                    ...(input.activo !== undefined && { activo: input.activo }),
                    fecha_modificacion: new Date(),
                }
            });
            return this.mapear(servicio);
        } catch (error: any) {
            if (error?.code === 'P2025') throw new NotFoundError(`Servicio con id ${id} no encontrado`);
            if (error?.code === 'P2002') throw new ConflictError('Ya existe un servicio con ese nombre');
            throw error;
        }
    }

    // Soft delete: solo cambiamos activo = false, el registro permanece en la BD.
    async desactivar(id: number): Promise<void> {
        await prisma.servicios.update({
            where: { id },
            data: { activo: false, fecha_modificacion: new Date() },
        });
    }

    async buscarPrecioActual(idServicio: number): Promise<number | null> {
        const historial = await prisma.historial_precios.findFirst({
            where: { id_servicio: idServicio, fecha_fin: null },
            orderBy: { fecha_inicio: 'desc' },
        });
        if (!historial) return null;
        return historial.precio.toNumber();
    }

}