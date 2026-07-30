import { Resend } from 'resend';
import Handlebars from 'handlebars';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { env } from '@config/env';
import { loadTemplate } from './templateLoader';

export class ResendEmailService implements IEmailService {

    private readonly resend: Resend;
    private readonly templateVerificacion: HandlebarsTemplateDelegate;

    constructor() {
        this.resend = new Resend(env.RESEND_API_KEY);
        this.templateVerificacion = loadTemplate('verificacion');
    }

    async enviarVerificacion(correo: string, token: string): Promise<void> {
        const link = `${env.FRONTEND_URL}/confirmar?token=${token}`;

        await this.resend.emails.send({
            from: env.EMAIL_FROM,
            to: correo,
            subject: 'Confirma tu correo electrónico — FadeForge',
            html: this.templateVerificacion({
                link,
                horasExpiracion: env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS,
            }),
        });
    }
}
