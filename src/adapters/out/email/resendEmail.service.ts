import { Resend } from 'resend';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { env } from '@config/env';
import { BadRequestError } from '@shared/errors/HttpError';
import { loadTemplate } from './templateLoader';

// Duración del caché de la verificación del logo: evita un HEAD request por cada envío.
const LOGO_TTL_MS = 5 * 60 * 1000;

export class ResendEmailService implements IEmailService {

    private readonly resend: Resend;
    private readonly templateVerificacion = loadTemplate('verificacion');

    // Caché del resultado de la verificación del logo:
    // null = sin verificar, true = disponible (o no confirmado por red), false = 404 confirmado.
    private logoDisponible: boolean | null = null;
    private ultimaVerificacionLogo = 0;

    constructor() {
        this.resend = new Resend(env.RESEND_API_KEY);
        this.templateVerificacion = loadTemplate('verificacion');
    }

    async enviarVerificacion(correo: string, token: string): Promise<void> {
        const link = `${env.API_URL}/api/v1/auth/confirmar?token=${token}`;
        const logoUrl = this.obtenerLogoUrl();

        await this.verificarLogoDisponible(logoUrl);

        // El SDK de Resend NO lanza excepción ante un rechazo (4xx/5xx):
        // devuelve { data: null, error }. Si no miramos el error, un envío
        // fallido queda invisible (el registro respondía "correo enviado" igual).
        const respuesta = await this.resend.emails.send({
            from: env.EMAIL_FROM,
            to: correo,
            subject: 'Confirma tu correo electrónico — FadeForge',
            html: this.templateVerificacion({
                link,
                horasExpiracion: env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS,
                logoUrl,
            }),
        });

        if (respuesta.error) {
            throw new Error(
                `Resend rechazó el envío a ${correo}: ${respuesta.error.message ?? JSON.stringify(respuesta.error)}`
            );
        }
    }

    private obtenerLogoUrl(): string {
        return env.LOGO_URL;
    }

    private async verificarLogoDisponible(logoUrl: string): Promise<void> {
        const ahora = Date.now();

        // Resultado cacheado dentro del TTL: no volvemos a consultar Cloudinary.
        if (this.logoDisponible !== null && ahora - this.ultimaVerificacionLogo < LOGO_TTL_MS) {
            if (!this.logoDisponible) {
                throw new BadRequestError('No se encontró el logo de la app para el correo de verificación');
            }
            return;
        }

        // Optimista: ante un problema de red no bloqueamos el envío,
        // y cacheamos el resultado para no reintentar dentro del TTL.
        this.logoDisponible = true;

        try {
            const respuesta = await fetch(logoUrl, { method: 'HEAD' });
            if (respuesta.status === 404) {
                this.logoDisponible = false;
            }
        } catch {
            // Problema de red transitorio: el envío continúa (logoDisponible queda en true).
        } finally {
            this.ultimaVerificacionLogo = Date.now();
        }

        if (!this.logoDisponible) {
            throw new BadRequestError('No se encontró el logo de la app para el correo de verificación');
        }
    }
}
