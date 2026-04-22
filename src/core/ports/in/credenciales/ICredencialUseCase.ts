import { CambiarContrasenaInput, CambiarCorreoInput, ResetContrasenaInput } from "@core/domain/credencial/credencial.entity";

// Contraro que define las operaciones disponibles sobre credenciales.
// El controller solo conoce esta interfaz, nunca la implementación concreta.
export interface ICredencialUseCase {
    cambiarContrasena(idUsuario: number, input: CambiarContrasenaInput): Promise<void>;
    cambiarCorreo(idUsuario: number, input: CambiarCorreoInput): Promise<void>;
    resetearContrasena(idUsuario: number, input: ResetContrasenaInput): Promise<void>;
}