import { IEmpleadoRepository } from "@core/ports/out/empleados/IEmpleadoRepository";
import { Empleado, PromoverEmpleadoInput } from "@core/domain/empleados/empleado.entity";
import { prisma } from "../prisma.client";
import { NotFoundError, ConflictError, BadRequestError } from "@shared/errors/HttpError";

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
    }): Empleado {
        return {
            id: rawEmpleado.id,
            idUsuario: rawEmpleado.id_usuario,
            nombreCompletoEmpleado: [rawEmpleado.usuarios.nombre, rawEmpleado.usuarios.a_paterno, rawEmpleado.usuarios.a_materno].filter(Boolean).join(' '),
            correo: rawEmpleado.usuarios.credenciales_usuarios!.correo,
            activo: rawEmpleado.activo,
            fechaCreacion: rawEmpleado.fecha_creacion,
            fechaModificacion: rawEmpleado.fecha_modificacion,
        }
    };

}
