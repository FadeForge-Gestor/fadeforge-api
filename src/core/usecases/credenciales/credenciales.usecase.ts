import bcrypt from "bcrypt";
import { ICredencialRepository } from "@core/ports/out/credenciales/ICredencialRepository";
import { ICredencialUseCase } from "@core/ports/in/credenciales/ICredencialUseCase";
import { CambiarContrasenaInput, CambiarCorreoInput, ResetContrasenaInput } from "@core/domain/credencial/credencial.entity";
import { ConflictError, NotFoundError, UnauthorizedError } from "@shared/errors/HttpError";
import { IUsuarioRepository } from "@core/ports/out/usuarios/IUsuarioRepository";
import { IRolRepository } from "@core/ports/out/roles/IRolRepository";
import { ROLES } from "@shared/constants/roles";

// Implementación del caso de uso de credenciales
export class CredencialUseCase implements ICredencialUseCase {

    // Inyección de dependencias del repositorio de credenciales
    constructor(
        private readonly credencialRepository: ICredencialRepository,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly rolRepository: IRolRepository
    ) {}

    // Lógica del caso de uso para cambiar la contraseña
    async cambiarContrasena(idUsuario: number, input: CambiarContrasenaInput): Promise<void> {
        const credencial = await this.credencialRepository.buscarPorIdUsuario(idUsuario);
        if (!credencial) throw new NotFoundError(`Credencial para usuario con id ${idUsuario} no encontrada`);

        const contrasenaValida = await bcrypt.compare(input.contrasenaActual, credencial.hashContrasena);
        if (!contrasenaValida) throw new UnauthorizedError(`Contraseña actual incorrecta`);

        const nuevoHash = await bcrypt.hash(input.nuevaContrasena, 10);
        await this.credencialRepository.actualizarContrasena(idUsuario, nuevoHash);
    }

    // Lógica del caso para cambiar el correo
    async cambiarCorreo(idUsuario: number, input: CambiarCorreoInput): Promise<void> {
        const credencial = await this.credencialRepository.buscarPorIdUsuario(idUsuario);
        if (!credencial) throw new NotFoundError(`Credencial para usuario con id ${idUsuario} no encontrada`);

        const contrasenaValida = await bcrypt.compare(input.contrasenaActual, credencial.hashContrasena);
        if (!contrasenaValida) throw new UnauthorizedError(`Contraseña actual incorrecta`);

        const correoExiste = await this.credencialRepository.buscarPorCorreo(input.nuevoCorreo);
        if (correoExiste) throw new ConflictError('El correo ya está registrado');

        await this.credencialRepository.actualizarCorreo(idUsuario, input.nuevoCorreo);
    }

    // Lógica del caso para resetar la contraseña
   async resetearContrasena(idUsuario: number, input: ResetContrasenaInput): Promise<void> {
       const credencial = await this.credencialRepository.buscarPorIdUsuario(idUsuario);
       if (!credencial) throw new NotFoundError(`Credencial para usuario con id ${idUsuario} no encontrada`);

       const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
       if (!usuario) throw new NotFoundError(`Usuario con id ${idUsuario} no encontrado`);

       const rol = await this.rolRepository.buscarPorId(usuario.idRol);
       if (rol?.clave === ROLES.ADMIN) throw new ConflictError('No se puede resetear la contraseña de un administrador');

       const nuevoHash = await bcrypt.hash(input.nuevaContrasena, 10);
       await this.credencialRepository.actualizarContrasena(idUsuario, nuevoHash);
   }
}