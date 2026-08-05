jest.mock('@adapters/out/db/prisma.client', () => ({
    prisma: {
        tokens_verificacion: {
            upsert: jest.fn(),
            deleteMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
        },
    },
}));

import { TokenVerificacionPrismaRepository } from '@adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository';
import { prisma } from '@adapters/out/db/prisma.client';
import { hashearToken } from '@core/domain/email/verificationToken';

const mockPrisma = jest.mocked(prisma);

describe('TokenVerificacionPrismaRepository', () => {

    let repository: TokenVerificacionPrismaRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new TokenVerificacionPrismaRepository();
    });

    describe('crear', () => {

        it('debe persistir el digest sha256 del token, no el token en claro', async () => {
            const tokenEnClaro = 'token-plano-123';
            const expiraEn = new Date(Date.now() + 60 * 60 * 1000);
            mockPrisma.tokens_verificacion.upsert.mockResolvedValue({} as never);

            await repository.crear(42, tokenEnClaro, expiraEn);

            expect(mockPrisma.tokens_verificacion.upsert).toHaveBeenCalledWith({
                where: { id_usuario: 42 },
                update: {
                    token_hash: hashearToken(tokenEnClaro),
                    expira_en: expiraEn,
                },
                create: {
                    id_usuario: 42,
                    token_hash: hashearToken(tokenEnClaro),
                    expira_en: expiraEn,
                },
            });
            // El token en claro jamás se persiste ni se pasa a Prisma.
            expect(mockPrisma.tokens_verificacion.upsert).not.toHaveBeenCalledWith(
                expect.objectContaining({ update: expect.objectContaining({ token_hash: tokenEnClaro }) })
            );
        });
    });

    describe('buscarPorToken', () => {

        it('debe encontrar el registro con un único findUnique por digest sha256', async () => {
            const tokenEnClaro = 'token-plano-123';
            const expiraEn = new Date(Date.now() + 60 * 60 * 1000);
            mockPrisma.tokens_verificacion.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.tokens_verificacion.findUnique.mockResolvedValue({
                id: 1,
                id_usuario: 42,
                token_hash: hashearToken(tokenEnClaro),
                expira_en: expiraEn,
                creado_en: new Date(),
            });

            const resultado = await repository.buscarPorToken(tokenEnClaro);

            expect(resultado).toEqual({ idUsuario: 42, expiraEn });
            expect(mockPrisma.tokens_verificacion.findUnique).toHaveBeenCalledTimes(1);
            expect(mockPrisma.tokens_verificacion.findUnique).toHaveBeenCalledWith({
                where: { token_hash: hashearToken(tokenEnClaro) },
            });
            // O(1): nunca se barre la tabla con findMany.
            expect(mockPrisma.tokens_verificacion.findMany).not.toBeDefined();
        });

        it('debe devolver null si el digest no existe', async () => {
            mockPrisma.tokens_verificacion.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.tokens_verificacion.findUnique.mockResolvedValue(null);

            const resultado = await repository.buscarPorToken('token-inexistente');

            expect(resultado).toBeNull();
            expect(mockPrisma.tokens_verificacion.findUnique).toHaveBeenCalledWith({
                where: { token_hash: hashearToken('token-inexistente') },
            });
        });

        it('debe eliminar los tokens expirados antes de buscar (lazy deletion)', async () => {
            mockPrisma.tokens_verificacion.deleteMany.mockResolvedValue({ count: 1 });
            mockPrisma.tokens_verificacion.findUnique.mockResolvedValue(null);

            await repository.buscarPorToken('token-plano-123');

            expect(mockPrisma.tokens_verificacion.deleteMany).toHaveBeenCalledWith({
                where: { expira_en: { lt: expect.any(Date) } },
            });
        });
    });

    describe('buscarTokenValido', () => {

        it('debe encontrar el registro con findUnique por digest sin mutar (read-only)', async () => {
            const tokenEnClaro = 'token-plano-123';
            const expiraEn = new Date(Date.now() + 60 * 60 * 1000);
            mockPrisma.tokens_verificacion.findUnique.mockResolvedValue({
                id: 1,
                id_usuario: 42,
                token_hash: hashearToken(tokenEnClaro),
                expira_en: expiraEn,
                creado_en: new Date(),
            });

            const resultado = await repository.buscarTokenValido(tokenEnClaro);

            expect(resultado).toEqual({ idUsuario: 42, expiraEn });
            expect(mockPrisma.tokens_verificacion.findUnique).toHaveBeenCalledWith({
                where: { token_hash: hashearToken(tokenEnClaro) },
            });
            // Read-only: un GET no debe limpiar ni consumir nada.
            expect(mockPrisma.tokens_verificacion.deleteMany).not.toHaveBeenCalled();
        });

        it('debe devolver null si el digest no existe sin eliminar nada', async () => {
            mockPrisma.tokens_verificacion.findUnique.mockResolvedValue(null);

            const resultado = await repository.buscarTokenValido('token-incorrecto');

            expect(resultado).toBeNull();
            expect(mockPrisma.tokens_verificacion.deleteMany).not.toHaveBeenCalled();
        });
    });
});
