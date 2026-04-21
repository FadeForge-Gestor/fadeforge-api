import { IUsuarioRepository } from "@core/ports/out/usuarios/IUsuarioRepository";
import { Usuario, CrearUsuarioInput, ActualizarUsuarioInput } from "@core/domain/usuario/usuario.entity";
import { prisma } from "../prisma.client";
import { NotFoundError, ConflictError, BadRequestError } from "@shared/errors/HttpError";
import bcrypt from "bcrypt";

export class UsuariosPrismaRepository implements IUsuarioRepository {

    private mapear(usuario: {
        id: number;
        nombre: string;
        a_paterno: string;
        a_materno: string | null;
        telefono: string;
        id_rol: number;
        activo: boolean;
        fecha_creacion: Date;
        fecha_modificacion: Date;
    }): Usuario {
        return {
            id: usuario.id,
            nombre: usuario.nombre,
            aPaterno: usuario.a_paterno,
            aMaterno: usuario.a_materno,
            telefono: usuario.telefono,
            idRol: usuario.id_rol,
            activo: usuario.activo,
            fechaCreacion: usuario.fecha_creacion,
            fechaModificacion: usuario.fecha_modificacion,
        };
    }

    async listarTodos(): Promise<Usuario[]> {
        const usuarios = await prisma.usuarios.findMany({
            orderBy: { id: "asc" },
        });
        return usuarios.map(u => this.mapear(u));
    }

    async buscarPorId(id: number): Promise<Usuario | null> {
        const usuario = await prisma.usuarios.findUnique({ where: { id } });
        if (!usuario) return null;
        return this.mapear(usuario);
    }

    async buscarPorCorreo(correo: string): Promise<Usuario | null> {
        const credencial = await prisma.credenciales_usuarios.findUnique({
            where: { correo },
            include: { usuarios: true },
        });
        if (!credencial) return null;
        return this.mapear(credencial.usuarios);
    }

    async crear(input: CrearUsuarioInput): Promise<Usuario> {
        try {
            const hash = await bcrypt.hash(input.contrasena, 10);

            const usuario = await prisma.$transaction(async (tx) => {
                const nuevo = await tx.usuarios.create({
                    data: {
                        nombre: input.nombre,
                        a_paterno: input.aPaterno,
                        a_materno: input.aMaterno,
                        telefono: input.telefono,
                        id_rol: input.idRol,
                    },
                });

                await tx.credenciales_usuarios.create({
                    data: {
                        id_usuario: nuevo.id,
                        correo: input.correo,
                        hash_contrasena: hash,
                    },
                });

                return nuevo;
            });

            return this.mapear(usuario);
        } catch (error: any) {
            if (error?.code === 'P2002') throw new ConflictError('El correo ya está registrado');
            throw error;
        }
    }

    async actualizar(id: number, input: ActualizarUsuarioInput): Promise<Usuario> {
        try {
            const usuario = await prisma.usuarios.update({
                where: { id },
                data: {
                    ...(input.nombre && { nombre: input.nombre }),
                    ...(input.aPaterno && { a_paterno: input.aPaterno }),
                    ...(input.aMaterno !== undefined && { a_materno: input.aMaterno }),
                    ...(input.telefono && { telefono: input.telefono }),
                    ...(input.idRol && { id_rol: input.idRol }),
                    ...(input.activo !== undefined && { activo: input.activo }),
                    fecha_modificacion: new Date(),
                },
            });
            return this.mapear(usuario);
        } catch (error: any) {
            if (error?.code === 'P2025') throw new NotFoundError(`Usuario con id ${id} no encontrado`);
            if (error?.code === 'P2003') throw new BadRequestError('El rol especificado no existe');
            throw error;
        }
    }

    async desactivar(id: number): Promise<void> {
        await prisma.usuarios.update({
            where: { id },
            data: { activo: false, fecha_modificacion: new Date() },
        });
    }
}
