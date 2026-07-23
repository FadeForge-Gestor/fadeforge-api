import { EstadoBloqueo } from '@core/domain/login-security/loginSecurity.entity';

export interface ILoginSecurityRepository {
    registrarIntentoFallido(correo: string): Promise<EstadoBloqueo>;
    resetIntentos(correo: string): Promise<void>;
    estaBloqueado(correo: string): Promise<boolean>;
    obtenerEstado(correo: string): Promise<EstadoBloqueo | null>;
}
