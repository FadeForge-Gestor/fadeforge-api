import { IAuthRepository, CredencialesAuth } from '@core/ports/out/auth/IAuthRepository';
import { prisma } from '../prisma.client';

// Implementación del repositorio de autenticación utilizando Prisma
export class AuthPrismaRepository implements IAuthRepository {

    // Método para buscar las credenciales de un usuario por su correo electrónico
    async buscarPorCorreo(correo: string): Promise<CredencialesAuth | null> {
        const resultado = await prisma.credenciales_usuarios.findUnique({
            where: { correo },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        roles: { select: { clave: true } }
                    }
                }
            }
        });

        if (!resultado) return null;

        return {
            correo: resultado.correo,
            hashContrasena: resultado.hash_contrasena,
            idUsuario: resultado.usuarios.id,
            claveRol: resultado.usuarios.roles.clave,
        };
    }
}
