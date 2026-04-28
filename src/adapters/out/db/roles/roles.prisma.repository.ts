import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol, CrearRolInput, ActualizarRolInput } from '@core/domain/rol/rol.entity';
import { prisma } from '../prisma.client';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

export class RolesPrismaRepository implements IRolRepository {

    // Mapeamos el resultado de Prisma a nuestra entidad de dominio.
    // Así el resto del sistema nunca depende de los nombres de columna de la BD.
    private mapear(rol: {
        id: number;
        clave: string;
        nombre: string;
        descripcion: string | null;
        activo: boolean;
        fecha_creacion: Date;
        fecha_modificacion: Date;
    }): Rol {
        return {
            id: rol.id,
            clave: rol.clave,
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            activo: rol.activo,
            fechaCreacion: rol.fecha_creacion,
            fechaModificacion: rol.fecha_modificacion,
        };
    }

    // Método para listar todos los roles
    async listarTodos(): Promise<Rol[]> {
        const roles = await prisma.roles.findMany({
            orderBy: { id: 'asc' },
        });
        return roles.map(r => this.mapear(r));
    }

    // Método para listar todos los roles que esten activos
    async listarActivos(): Promise<Rol[]> {
        const roles = await prisma.roles.findMany({
            orderBy: { id: 'asc' },
            where: { activo: true },
        });
        return roles.map(r => this.mapear(r));
    }

    // Método para buscar por id un ROL
    async buscarPorId(id: number): Promise<Rol | null> {
        const rol = await prisma.roles.findUnique({ where: { id } });
        if (!rol) return null;
        return this.mapear(rol);
    }

    // Método para buscar por nombre un rol
    async buscarPorNombre(nombre: string): Promise<Rol | null> {
        const rol = await prisma.roles.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' } } });
        if (!rol) return null;
        return this.mapear(rol);
    }

    // Método para buscar por clave un rol
    async buscarPorClave(clave: string): Promise<Rol | null> {
        const rol = await prisma.roles.findFirst({ where: { clave: { equals: clave, mode: 'insensitive' } } });
        if (!rol) return null;
        return this.mapear(rol);
    }

    // Método para crear un nuevo ROL
    async crear(input: CrearRolInput): Promise<Rol> {
        try {
            const rol = await prisma.roles.create({
                data: {
                    clave: input.clave,
                    nombre: input.nombre,
                    descripcion: input.descripcion,
                },
            });
            return this.mapear(rol);
        } catch (error: any) {
            if (error?.code === 'P2002') throw new ConflictError('Ya existe un rol con esa clave o nombre');
            throw error;
        }
    }

    // Método para actualizar un ROL
    async actualizar(id: number, input: ActualizarRolInput): Promise<Rol> {
        try {
            const rol = await prisma.roles.update({
                where: { id },
                data: {
                    ...(input.clave && { clave: input.clave }),
                    ...(input.nombre && { nombre: input.nombre }),
                    ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
                    ...(input.activo !== undefined && { activo: input.activo }),
                    fecha_modificacion: new Date(),
                },
            });
            return this.mapear(rol);
        } catch (error: any) {
            if (error?.code === 'P2025') throw new NotFoundError(`Rol con id ${id} no encontrado`);
            if (error?.code === 'P2002') throw new ConflictError('Ya existe un rol con esa clave o nombre');
            throw error;
        }
    }

    // Soft delete: solo cambiamos activo = false, el registro permanece en la BD.
    async desactivar(id: number): Promise<void> {
        await prisma.roles.update({
            where: { id },
            data: { activo: false, fecha_modificacion: new Date() },
        });
    }
}
