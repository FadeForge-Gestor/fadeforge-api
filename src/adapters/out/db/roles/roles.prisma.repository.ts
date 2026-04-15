import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol, CrearRolInput, ActualizarRolInput } from '@core/domain/rol/rol.entity';
import { prisma } from '../prisma.client';

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
    }): Rol {
        return {
            id: rol.id,
            clave: rol.clave,
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            activo: rol.activo,
            fechaCreacion: rol.fecha_creacion,
        };
    }

    async listarTodos(): Promise<Rol[]> {
        const roles = await prisma.roles.findMany({
            orderBy: { id: 'asc' },
        });
        return roles.map(this.mapear);
    }

    async buscarPorId(id: number): Promise<Rol | null> {
        const rol = await prisma.roles.findUnique({ where: { id } });
        if (!rol) return null;
        return this.mapear(rol);
    }

    async crear(input: CrearRolInput): Promise<Rol> {
        const rol = await prisma.roles.create({
            data: {
                clave: input.clave,
                nombre: input.nombre,
                descripcion: input.descripcion,
            },
        });
        return this.mapear(rol);
    }

    async actualizar(id: number, input: ActualizarRolInput): Promise<Rol> {
        const rol = await prisma.roles.update({
            where: { id },
            data: {
                ...(input.clave && { clave: input.clave }),
                ...(input.nombre && { nombre: input.nombre }),
                ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
                ...(input.activo !== undefined && { activo: input.activo }),
            },
        });
        return this.mapear(rol);
    }

    // Soft delete: solo cambiamos activo = false, el registro permanece en la BD.
    async desactivar(id: number): Promise<void> {
        await prisma.roles.update({
            where: { id },
            data: { activo: false },
        });
    }
}
