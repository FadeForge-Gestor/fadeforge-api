import { VerificationTokenData } from '@core/domain/email/verificationToken';

export interface ITokenVerificacionRepository {
    // Recibe el token en claro; el hashing (sha256) es responsabilidad del repositorio.
    crear(idUsuario: number, token: string, expiraEn: Date): Promise<void>;
    buscarPorToken(token: string): Promise<VerificationTokenData | null>;
    buscarTokenValido(token: string): Promise<VerificationTokenData | null>;
    eliminarPorIdUsuario(idUsuario: number): Promise<void>;
    contarEnviosHoy(idUsuario: number): Promise<number>;
}
