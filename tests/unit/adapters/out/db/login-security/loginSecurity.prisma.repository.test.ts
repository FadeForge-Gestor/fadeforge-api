jest.mock('@adapters/out/db/prisma.client', () => ({
    prisma: {
        intentos_login: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

import { LoginSecurityPrismaRepository } from '@adapters/out/db/login-security/loginSecurity.prisma.repository';
import { prisma } from '@adapters/out/db/prisma.client';

const mockPrisma = jest.mocked(prisma);

describe('LoginSecurityPrismaRepository', () => {

    let repository: LoginSecurityPrismaRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new LoginSecurityPrismaRepository();
    });

    describe('registrarIntentoFallido', () => {

        it('debe crear un registro nuevo con 1 intento si no existe', async () => {
            mockPrisma.intentos_login.upsert.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 1,
                bloqueado_hasta: null,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });

            const result = await repository.registrarIntentoFallido('test@test.com');

            expect(mockPrisma.intentos_login.upsert).toHaveBeenCalledWith({
                where: { correo: 'test@test.com' },
                update: expect.objectContaining({
                    intentos_fallidos: { increment: 1 },
                }),
                create: {
                    correo: 'test@test.com',
                    intentos_fallidos: 1,
                },
            });

            expect(result.intentosFallidos).toBe(1);
            expect(result.bloqueadoHasta).toBeNull();
        });

        it('debe incrementar intentos si ya existe un registro', async () => {
            mockPrisma.intentos_login.upsert.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 3,
                bloqueado_hasta: null,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });

            const result = await repository.registrarIntentoFallido('test@test.com');

            expect(result.intentosFallidos).toBe(3);
            expect(result.bloqueadoHasta).toBeNull();
        });

        it('debe bloquear la cuenta al llegar a 5 intentos', async () => {
            mockPrisma.intentos_login.upsert.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 5,
                bloqueado_hasta: null,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });
            mockPrisma.intentos_login.update.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 5,
                bloqueado_hasta: new Date(),
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });

            const result = await repository.registrarIntentoFallido('test@test.com');

            expect(mockPrisma.intentos_login.update).toHaveBeenCalled();
            expect(result.tiempoRestanteMs).toBe(15 * 60 * 1000);
        });
    });

    describe('resetIntentos', () => {

        it('debe eliminar el registro del correo', async () => {
            mockPrisma.intentos_login.deleteMany.mockResolvedValue({ count: 1 });

            await repository.resetIntentos('test@test.com');

            expect(mockPrisma.intentos_login.deleteMany).toHaveBeenCalledWith({
                where: { correo: 'test@test.com' },
            });
        });
    });

    describe('estaBloqueado', () => {

        it('debe retornar false si no hay registro', async () => {
            mockPrisma.intentos_login.findUnique.mockResolvedValue(null);

            const result = await repository.estaBloqueado('test@test.com');

            expect(result).toBe(false);
        });

        it('debe retornar false si el registro no tiene bloqueado_hasta', async () => {
            mockPrisma.intentos_login.findUnique.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 2,
                bloqueado_hasta: null,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });

            const result = await repository.estaBloqueado('test@test.com');

            expect(result).toBe(false);
        });

        it('debe retornar true si bloqueado_hasta es futuro', async () => {
            const futuro = new Date(Date.now() + 10 * 60 * 1000);
            mockPrisma.intentos_login.findUnique.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 5,
                bloqueado_hasta: futuro,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });

            const result = await repository.estaBloqueado('test@test.com');

            expect(result).toBe(true);
        });

        it('debe limpiar registro expirado y retornar false (lazy deletion)', async () => {
            const pasado = new Date(Date.now() - 1 * 60 * 1000);
            mockPrisma.intentos_login.findUnique.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 5,
                bloqueado_hasta: pasado,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });
            mockPrisma.intentos_login.delete.mockResolvedValue({} as never);

            const result = await repository.estaBloqueado('test@test.com');

            expect(result).toBe(false);
            expect(mockPrisma.intentos_login.delete).toHaveBeenCalledWith({
                where: { correo: 'test@test.com' },
            });
        });
    });

    describe('obtenerEstado', () => {

        it('debe retornar null si no hay registro', async () => {
            mockPrisma.intentos_login.findUnique.mockResolvedValue(null);

            const result = await repository.obtenerEstado('test@test.com');

            expect(result).toBeNull();
        });

        it('debe retornar estado con tiempoRestanteMs cuando está bloqueado', async () => {
            const futuro = new Date(Date.now() + 10 * 60 * 1000);
            mockPrisma.intentos_login.findUnique.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 5,
                bloqueado_hasta: futuro,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });

            const result = await repository.obtenerEstado('test@test.com');

            expect(result).not.toBeNull();
            expect(result!.intentosFallidos).toBe(5);
            expect(result!.bloqueadoHasta).toBe(futuro);
            expect(result!.tiempoRestanteMs).toBeGreaterThan(0);
        });

        it('debe retornar null y limpiar si el bloqueo expiró', async () => {
            const pasado = new Date(Date.now() - 1 * 60 * 1000);
            mockPrisma.intentos_login.findUnique.mockResolvedValue({
                id: 1,
                correo: 'test@test.com',
                intentos_fallidos: 5,
                bloqueado_hasta: pasado,
                fecha_creacion: new Date(),
                fecha_modificacion: new Date(),
            });
            mockPrisma.intentos_login.delete.mockResolvedValue({} as never);

            const result = await repository.obtenerEstado('test@test.com');

            expect(result).toBeNull();
        });
    });
});
