import { IAuthRepository, CredencialesUsuario } from "@core/ports/out/auth/IAuthRepository";
import { prisma } from './../prisma.client';

// Clase que implementa el repositorio de autenticación utilizando Prisma para acceder a la base de datos. Esta clase se encarga de buscar las credenciales del usuario por correo electrónico y devolver la información correspondiente, incluyendo el hash de la contraseña y los detalles del usuario asociado.
export class AuthPrismaRepository implements IAuthRepository {

    // Método que busca las credenciales del usuario por correo electrónico. Utiliza Prisma para realizar una consulta a la base de datos y obtener la información del usuario y su contraseña hash. Si no se encuentra el usuario, devuelve null.
    async buscarPorCorreo(correo: string): Promise<CredencialesUsuario | null> {
        const resultado = await prisma.credenciales_usuarios.findFirst({
            where: { correo },
            include: { usuarios: true }
        })

        if (!resultado) return null;

        // Mapeamos la información obtenida y retornamos el objeto
        return {
            correo: resultado.correo,
            hashContrasena: resultado.hash_contrasena,
            usuario: {
                id: resultado.usuarios.id,
                nombre: resultado.usuarios.nombre,
                aPaterno: resultado.usuarios.a_paterno,
                aMaterno: resultado.usuarios.a_materno,
                telefono: resultado.usuarios.telefono,
                idRol: resultado.usuarios.id_rol
            }
        }
    }
}