import { CredencialesAuth } from '@core/domain/auth/auth.entity';

export interface IAuthRepository {
    buscarPorCorreo(correo: string): Promise<CredencialesAuth | null>;
}
