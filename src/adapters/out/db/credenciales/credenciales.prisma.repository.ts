import { ICredencialRepository } from "@core/ports/out/credenciales/ICredencialRepository";
import { CredencialRaw } from "@core/domain/credencial/credencial.entity";
import { prisma } from "../prisma.client";

// Clase de repositorio para manejar las credenciales de los usuarios utilizando Prisma ORM
export class CredencialesPrismaRepository implements ICredencialRepository {

    private mapear (credencial: {
        id_usuario: number;
        correo: string;
        hash_contrasena: string;
        email_verificado: boolean;
    }): CredencialRaw {
        return {
            idUsuario: credencial.id_usuario,
            correo: credencial.correo,
            hashContrasena: credencial.hash_contrasena,
            emailVerificado: credencial.email_verificado,
        };
    }

    // Método para buscar las credenciales por el ID del usuario
    async buscarPorIdUsuario(idUsuario: number): Promise<CredencialRaw | null> {
        const credencial = await prisma.credenciales_usuarios.findUnique({ where: { id_usuario: idUsuario } });
        if (!credencial) return null;
        return this.mapear(credencial);
    }

    // Método para buscar las credenciales por el correo electrónico
    async buscarPorCorreo(correo: string): Promise<CredencialRaw | null> {
        const credencial = await prisma.credenciales_usuarios.findUnique({ where: { correo: correo } });
        if (!credencial) return null;
        return this.mapear(credencial);
    }

    // Método para actualizar la contraseña de un usuario dado su ID, estableciendo un nuevo hash de contraseña
    async actualizarContrasena(idUsuario: number, nuevoHashContrasena: string): Promise<void> {
        await prisma.credenciales_usuarios.update({
            where: { id_usuario: idUsuario },
            data: {
                hash_contrasena: nuevoHashContrasena,
                fecha_modificacion: new Date(),
            }
        });
    }

    // Método para actualizar el correo electrónico de un usuario dado su ID, estableciendo un nuevo correo
    async actualizarCorreo(idUsuario: number, nuevoCorreo: string): Promise<void> {
        await prisma.credenciales_usuarios.update({
            where: { id_usuario: idUsuario },
            data: {
                correo: nuevoCorreo,
                fecha_modificacion: new Date(),
            }
        });
    }

    // Método para actualizar el estado de verificación de email de un usuario
    async actualizarEmailVerificado(idUsuario: number, verificado: boolean): Promise<void> {
        await prisma.credenciales_usuarios.update({
            where: { id_usuario: idUsuario },
            data: {
                email_verificado: verificado,
                fecha_modificacion: new Date(),
            }
        });
    }

}