import { Usuario } from "@core/domain/usuario/usuario.entity";

// Interfaz para el repositorio de autenticación
export interface CredencialesUsuario {
    usuario: Usuario;
    correo: string;
    hashContrasena: string;
}

// Interfaz para el repositorio de autenticación para buscar un usuario por correo electrónico
export interface IAuthRepository {
    buscarPorCorreo(correo: string): Promise<CredencialesUsuario | null>;
}

