// Este archivo define la interfaz del repositorio de credenciales, que es una abstracción sobre la capa de persistencia (en este caso, PRISMA).
export interface CredencialRaw {
    idUsuario: number;
    correo: string;
    hashContrasena: string;
}


// Contrato que define las operaciones disponibles sobre credenciales.
// El caso de uso solo conoce esta interfaz, nunca PRISMA directamente.
export interface ICredencialRepository {
    buscarPorIdUsuario(idUsuario: number): Promise<CredencialRaw | null>;
    actualizarContrasena(idUsuario: number, nuevoHashContrasena: string): Promise<void>;
    actualizarCorreo(idUsuario: number, nuevoCorreo: string): Promise<void>;
}