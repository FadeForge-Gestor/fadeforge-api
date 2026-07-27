import { VerificationTokenData } from '@core/domain/email/verificationToken';

export interface ITokenVerificacionRepository {
    crear(idUsuario: number, tokenHash: string, expiraEn: Date): Promise<void>;
    buscarPorTokenHash(tokenHash: string): Promise<VerificationTokenData | null>;
    eliminarPorIdUsuario(idUsuario: number): Promise<void>;
    contarEnviosHoy(idUsuario: number): Promise<number>;
}
