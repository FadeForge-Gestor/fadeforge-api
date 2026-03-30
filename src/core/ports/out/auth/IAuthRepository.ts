// Interfaz con los datos mínimos necesarios para autenticar un usuario
export interface CredencialesAuth {
    correo: string;
    hashContrasena: string;
    idUsuario: number;
    idRol: number;
}

// Interfaz del repositorio de autenticación
export interface IAuthRepository {
    buscarPorCorreo(correo: string): Promise<CredencialesAuth | null>;
}
