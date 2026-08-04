import { IEmailService } from '@core/ports/out/email/IEmailService';

export class NullEmailService implements IEmailService {
    async enviarVerificacion(_correo: string, _token: string): Promise<void> {
        // No-op: email verification is disabled
    }

    async enviarBienvenida(_correo: string, _nombre: string): Promise<void> {
        // No-op: email verification is disabled
    }
}
