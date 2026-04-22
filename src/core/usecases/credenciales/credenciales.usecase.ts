import bcrypt from "bcrypt";
import { ICredencialRepository } from "@core/ports/out/credenciales/ICredencialRepository";
import { ICredencialUseCase } from "@core/ports/in/credenciales/ICredencialUseCase";
import { CambiarContrasenaInput, CambiarCorreoInput, ResetContrasenaInput } from "@core/domain/credencial/credencial.entity";
import { ConflictError, NotFoundError, UnauthorizedError } from "@shared/errors/HttpError";

// Implementación del caso de uso de credenciales
export class CredencialUseCase implements ICredencialUseCase {

    // Inyección de dependencias del repositorio de credenciales
    constructor(private readonly CredencialRepository: ICredencialRepository) {}

    // Lógica del caso de uso para cambiar la contraseña
    async cambiarContrasena(idUsuario: number, input: CambiarContrasenaInput): Promise<void> {
        const credencial = await this.CredencialRepository.buscarPorIdUsuario(idUsuario);
        if (!credencial) throw new NotFoundError(`Credencial para usuario con id ${idUsuario} no encontrada`);

        const contrasenaValida = await bcrypt.compare(input.contrasenaActual, credencial.hashContrasena);
        if (!contrasenaValida) throw new UnauthorizedError(`Contraseña actual incorrecta`);

        const nuevoHash = await bcrypt.hash(input.nuevaContrasena, 10);
        await this.CredencialRepository.actualizarContrasena(idUsuario, nuevoHash);
    }

    // Lógica del caso para cambiar el correo
    async cambiarCorreo(idUsuario: number, input: CambiarCorreoInput): Promise<void> {
        const credencial = await this.CredencialRepository.buscarPorIdUsuario(idUsuario);
        if (!credencial) throw new NotFoundError(`Credencial para usuario con id ${idUsuario} no encontrada`);

        const contrasenaValida = await bcrypt.compare(input.contrasenaActual, credencial.hashContrasena);
        if (!contrasenaValida) throw new UnauthorizedError(`Contraseña actual incorrecta`);

}