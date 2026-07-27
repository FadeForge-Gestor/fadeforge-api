import { Resend } from 'resend';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { env } from '@config/env';

export class ResendEmailService implements IEmailService {

    private readonly resend: Resend;

    constructor() {
        this.resend = new Resend(env.RESEND_API_KEY);
    }

    async enviarVerificacion(correo: string, token: string): Promise<void> {
        const link = `${env.FRONTEND_URL}/confirmar?token=${token}`;

        await this.resend.emails.send({
            from: env.EMAIL_FROM,
            to: correo,
            subject: 'Confirma tu correo electrónico',
            html: `
                <h1> Bienvenido a FadeForge</h1>
                <p>Haz clic en el siguiente enlace para confirmar tu correo electrónico:</p>
                <a href="${link}">Confirmar correo</a>
                <p>Este enlace expira en ${env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS} horas.</p>
                <p>Si no creaste esta cuenta, podés ignorar este mensaje.</p>
            `,
        });
    }
}
