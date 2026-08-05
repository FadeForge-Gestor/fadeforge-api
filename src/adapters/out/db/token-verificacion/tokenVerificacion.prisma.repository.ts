import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { hashearToken } from '@core/domain/email/verificationToken';
import { prisma } from '../prisma.client';

export class TokenVerificacionPrismaRepository implements ITokenVerificacionRepository {

    async crear(idUsuario: number, token: string, expiraEn: Date): Promise<void> {
        await prisma.tokens_verificacion.upsert({
            where: { id_usuario: idUsuario },
            update: {
                token_hash: hashearToken(token),
                expira_en: expiraEn,
            },
            create: {
                id_usuario: idUsuario,
                token_hash: hashearToken(token),
                expira_en: expiraEn,
            },
        });
    }

    async buscarPorToken(token: string): Promise<{ idUsuario: number; expiraEn: Date } | null> {
        const ahora = new Date();
        await prisma.tokens_verificacion.deleteMany({
            where: { expira_en: { lt: ahora } },
        });

        const registro = await prisma.tokens_verificacion.findUnique({
            where: { token_hash: hashearToken(token) },
        });

        if (!registro) return null;
        return { idUsuario: registro.id_usuario, expiraEn: registro.expira_en };
    }

    async buscarTokenValido(token: string): Promise<{ idUsuario: number; expiraEn: Date } | null> {
        // Read-only: valida sin mutar. NO elimina expirados ni consume el token
        // (un GET no debe tener efectos; el consumo lo hace solo buscarPorToken en el POST).
        const registro = await prisma.tokens_verificacion.findUnique({
            where: { token_hash: hashearToken(token) },
        });

        if (!registro) return null;
        return { idUsuario: registro.id_usuario, expiraEn: registro.expira_en };
    }

    async eliminarPorIdUsuario(idUsuario: number): Promise<void> {
        await prisma.tokens_verificacion.deleteMany({
            where: { id_usuario: idUsuario },
        });
    }

    async contarEnviosHoy(idUsuario: number): Promise<number> {
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);

        return prisma.tokens_verificacion.count({
            where: {
                id_usuario: idUsuario,
                creado_en: { gte: inicioHoy },
            },
        });
    }
}
