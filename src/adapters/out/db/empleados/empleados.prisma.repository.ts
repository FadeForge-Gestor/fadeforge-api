import { IEmpleadoRepository } from "@core/ports/out/empleados/IEmpleadoRepository";
import { Empleado, EmpleadoDetalle, PromoverEmpleadoInput } from "@core/domain/empleado/empleado.entity";
import { prisma } from "../prisma.client";

export class EmpleadosPrismaRepository implements IEmpleadoRepository {

    private mapear(rawEmpleado: {
        id: number;
        id_usuario: number;
        activo: boolean;
        fecha_creacion: Date;
        fecha_modificacion: Date;
        usuarios: {
            nombre: string;
            a_paterno: string;
            a_materno: string | null;
            credenciales_usuarios: {
                correo: string;
            } | null;
        };
    }): EmpleadoDetalle {
        return {
            id: rawEmpleado.id,
            idUsuario: rawEmpleado.id_usuario,
            nombreCompleto: [rawEmpleado.usuarios.nombre, rawEmpleado.usuarios.a_paterno, rawEmpleado.usuarios.a_materno].filter(Boolean).join(' '),
            correo: rawEmpleado.usuarios.credenciales_usuarios!.correo,
            activo: rawEmpleado.activo,
            fechaCreacion: rawEmpleado.fecha_creacion,
            fechaModificacion: rawEmpleado.fecha_modificacion,
        }
    };

    // Método para listar todos los empleados de forma ascendente
    async listarTodos(): Promise<EmpleadoDetalle[]> {
        const empleados = await prisma.empleados.findMany({
            orderBy: { usuarios: { nombre: 'asc' } },
            include: {
                usuarios: {
                    include: { credenciales_usuarios: true }
                }
            }
        });
        return empleados.map(e => this.mapear(e));
    }

    // Método para listar todos los empleados activos y los ordena por su nombre alfabeticamente
    async listarActivos(): Promise<EmpleadoDetalle[]> {
        const empleados = await prisma.empleados.findMany({
            orderBy: { usuarios: { nombre: 'asc' } },
            where: { activo: true },
            include: {
                usuarios: {
                    include: { credenciales_usuarios: true }
                }
            }
        });
        return empleados.map(e => this.mapear(e));
    }

    // Método para buscar un empleado por ID
    async buscarPorId(id: number): Promise<EmpleadoDetalle | null> {
        const empleado = await prisma.empleados.findUnique({
            where: { id },
            include: {
                usuarios: {
                    include: { credenciales_usuarios: true }
                }
            }
        });
        if (!empleado) return null;
        return this.mapear(empleado); 
    }

    // Método para buscar un empleado por su id de usuario
    async buscarPorIdUsuario(idUsuario: number): Promise<Empleado | null> {
        const empleado = await prisma.empleados.findUnique({
            where: { id_usuario: idUsuario },
            include: {
                usuarios: {
                    include: { credenciales_usuarios: true }
                }
            }
        });
        if (!empleado) return null;
        return this.mapear(empleado);
    }

    // Método para agregarle el puesto a un empleado
    async promover(input: PromoverEmpleadoInput): Promise<EmpleadoDetalle> {
        const empleado = await prisma.empleados.create({
            data: { id_usuario: input.idUsuario },
            include: {
                usuarios: {
                    include: { credenciales_usuarios: true }
                }
            }
        });
        return this.mapear(empleado);
    }

    // Método para desactivar un empleado estableciendo su campo "activo" a false
    async desactivar(id: number): Promise<void> {
        await prisma.empleados.update({
            where: { id },
            data: { activo: false, fecha_modificacion: new Date() },
        })
    }

}
