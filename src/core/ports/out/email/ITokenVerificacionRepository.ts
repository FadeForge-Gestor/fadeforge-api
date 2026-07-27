export interface ITokenVerificacionRepository {
    crear(idUsuario: number, tokenHash: string, expiraEn: Date): Promise<void>;
    buscarPorTokenHash(tokenHash: string): Promise<{ idUsuario: number; expiraEn: Date } | null>;
    eliminarPorIdUsuario(idUsuario: number): Promise<void>;
    contarEnviosHoy(idUsuario: number): Promise<number>;
}
