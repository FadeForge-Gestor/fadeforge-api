import { CredencialRaw } from '@core/domain/credencial/credencial.entity';

export interface ICredencialRepository {
    buscarPorIdUsuario(idUsuario: number): Promise<CredencialRaw | null>;
    buscarPorCorreo(correo: string): Promise<CredencialRaw | null>;
    actualizarContrasena(idUsuario: number, nuevoHashContrasena: string): Promise<void>;
    actualizarCorreo(idUsuario: number, nuevoCorreo: string): Promise<void>;
    actualizarEmailVerificado(idUsuario: number, verificado: boolean): Promise<void>;
}
