jest.mock('@adapters/out/db/prisma.client', () => ({
    prisma: {
        tokens_verificacion: {
            upsert: jest.fn(),
            deleteMany: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

import bcrypt from 'bcrypt';
import { TokenVerificacionPrismaRepository } from '@adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository';
import { prisma } from '@adapters/out/db/prisma.client';

const mockPrisma = jest.mocked(prisma);

describe('TokenVerificacionPrismaRepository', () => {

    let repository: TokenVerificacionPrismaRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new TokenVerificacionPrismaRepository();
    });

    describe('buscarPorToken', () => {

        it('debe encontrar el registro con el token correcto (bcrypt REAL)', async () => {
            const tokenEnClaro = 'token-plano-123';
            // Hash real de bcrypt, tal como lo persiste RegistroClienteUseCase
            const tokenHash = await bcrypt.hash(tokenEnClaro, 10);

            const expiraEn = new Date(Date.now() + 60 * 60 * 1000);
            mockPrisma.tokens_verificacion.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.tokens_verificacion.findMany.mockResolvedValue([
                {
                    id: 1,
                    id_usuario: 42,
                    token_hash: tokenHash,
                    expira_en: expiraEn,
                    creado_en: new Date(),
                },
            ]);

            const resultado = await repository.buscarPorToken(tokenEnClaro);

            expect(resultado).toEqual({ idUsuario: 42, expiraEn });
        });

        it('debe devolver null con un token incorrecto', async () => {
            const tokenHash = await bcrypt.hash('token-correcto', 10);

            mockPrisma.tokens_verificacion.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.tokens_verificacion.findMany.mockResolvedValue([
                {
                    id: 1,
                    id_usuario: 42,
                    token_hash: tokenHash,
                    expira_en: new Date(Date.now() + 60 * 60 * 1000),
                    creado_en: new Date(),
                },
            ]);

            const resultado = await repository.buscarPorToken('token-incorrecto');

            expect(resultado).toBeNull();
        });

        it('debe eliminar los tokens expirados antes de buscar (lazy deletion)', async () => {
            mockPrisma.tokens_verificacion.deleteMany.mockResolvedValue({ count: 1 });
            mockPrisma.tokens_verificacion.findMany.mockResolvedValue([]);

            await repository.buscarPorToken('token-plano-123');

            expect(mockPrisma.tokens_verificacion.deleteMany).toHaveBeenCalledWith({
                where: { expira_en: { lt: expect.any(Date) } },
            });
        });
    });
});
