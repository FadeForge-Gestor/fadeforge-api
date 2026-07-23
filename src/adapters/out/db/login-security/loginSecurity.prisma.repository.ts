import { ILoginSecurityRepository } from '@core/ports/out/login-security/ILoginSecurityRepository';
import { EstadoBloqueo } from '@core/domain/login-security/loginSecurity.entity';
import { prisma } from '../prisma.client';

const MAX_INTENTOS = 5;
const DURACION_BLOQUEO_MINUTOS = 15;

export class LoginSecurityPrismaRepository implements ILoginSecurityRepository {

    async registrarIntentoFallido(correo: string): Promise<EstadoBloqueo> {
        const ahora = new Date();

        const registro = await prisma.intentos_login.upsert({
            where: { correo },
            update: {
                intentos_fallidos: { increment: 1 },
                fecha_modificacion: ahora,
            },
            create: {
                correo,
                intentos_fallidos: 1,
            },
        });

        const nuevosIntentos = registro.intentos_fallidos;

        if (nuevosIntentos >= MAX_INTENTOS) {
            const bloqueadoHasta = new Date(ahora.getTime() + DURACION_BLOQUEO_MINUTOS * 60 * 1000);

            await prisma.intentos_login.update({
                where: { correo },
                data: {
                    bloqueado_hasta: bloqueadoHasta,
                    fecha_modificacion: ahora,
                },
            });

            return {
                correo,
                intentosFallidos: nuevosIntentos,
                bloqueadoHasta,
                tiempoRestanteMs: DURACION_BLOQUEO_MINUTOS * 60 * 1000,
            };
        }

        return {
            correo,
            intentosFallidos: nuevosIntentos,
            bloqueadoHasta: null,
            tiempoRestanteMs: null,
        };
    }

    async resetIntentos(correo: string): Promise<void> {
        await prisma.intentos_login.deleteMany({
            where: { correo },
        });
    }

    async estaBloqueado(correo: string): Promise<boolean> {
        const estado = await this.obtenerEstado(correo);
        return estado !== null && estado.bloqueadoHasta !== null;
    }

    async obtenerEstado(correo: string): Promise<EstadoBloqueo | null> {
        const registro = await prisma.intentos_login.findUnique({
            where: { correo },
        });

        if (!registro) return null;

        const ahora = new Date();

        // Lazy deletion: si el bloqueo ya expiró, se elimina el registro y se retorna null
        if (registro.bloqueado_hasta && registro.bloqueado_hasta <= ahora) {
            await prisma.intentos_login.delete({
                where: { correo },
            });
            return null;
        }

        const tiempoRestanteMs = registro.bloqueado_hasta
            ? registro.bloqueado_hasta.getTime() - ahora.getTime()
            : null;

        return {
            correo: registro.correo,
            intentosFallidos: registro.intentos_fallidos,
            bloqueadoHasta: registro.bloqueado_hasta,
            tiempoRestanteMs,
        };
    }
}
