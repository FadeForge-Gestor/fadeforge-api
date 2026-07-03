import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol } from '@core/domain/rol/rol.entity';
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

    // Método para buscar por id un ROL
    async buscarPorId(id: number): Promise<Rol | null> {
        const rol = await prisma.roles.findUnique({ where: { id } });
        if (!rol) return null;
        return this.mapear(rol);
    }

    // Método para buscar por clave un rol
    async buscarPorClave(clave: string): Promise<Rol | null> {
        const rol = await prisma.roles.findFirst({ where: { clave: { equals: clave, mode: 'insensitive' } } });
        if (!rol) return null;
        return this.mapear(rol);
    }
}
