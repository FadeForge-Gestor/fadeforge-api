import bcrypt from 'bcrypt';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { prisma } from '../db/prisma.client';

export class TokenVerificacionPrismaRepository implements ITokenVerificacionRepository {

    async crear(idUsuario: number, tokenHash: string, expiraEn: Date): Promise<void> {
        await prisma.tokens_verificacion.upsert({
            where: { id_usuario: idUsuario },
            update: {
                token_hash: tokenHash,
                expira_en: expiraEn,
            },
            create: {
                id_usuario: idUsuario,
                token_hash: tokenHash,
                expira_en: expiraEn,
            },
        });
    }

    async buscarPorTokenHash(tokenHash: string): Promise<{ idUsuario: number; expiraEn: Date } | null> {
        const ahora = new Date();
        await prisma.tokens_verificacion.deleteMany({
            where: { expira_en: { lt: ahora } },
        });

        const tokens = await prisma.tokens_verificacion.findMany();
        for (const token of tokens) {
            const coincide = await bcrypt.compare(tokenHash, token.token_hash);
            if (coincide) {
                return { idUsuario: token.id_usuario, expiraEn: token.expira_en };
            }
        }
        return null;
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
