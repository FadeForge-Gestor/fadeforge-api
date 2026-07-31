import { ResendEmailService } from '@adapters/out/email/resendEmail.service';
import { BadRequestError } from '@shared/errors/HttpError';

jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn().mockResolvedValue({}),
        },
    })),
}));

jest.mock('@config/env', () => ({
    env: {
        RESEND_API_KEY: 'test-key',
        EMAIL_FROM: 'test@fadeforge.com',
        FRONTEND_URL: 'http://localhost:3000',
        EMAIL_VERIFICATION_EXPIRES_IN_HOURS: 24,
        CLOUDINARY_CLOUD_NAME: 'fadeforge-test',
        LOGO_URL: 'https://res.cloudinary.com/fadeforge-test/image/upload/v1/logo-prueba.png',
        NODE_ENV: 'development',
    },
}));

describe('ResendEmailService', () => {
    const fetchOriginal = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn() as unknown as typeof fetch;
    });

    afterEach(() => {
        global.fetch = fetchOriginal;
    });

    it('debe lanzar BadRequestError (400) si el logo no existe en Cloudinary', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({ status: 404 });

        const service = new ResendEmailService();

        await expect(service.enviarVerificacion('cliente@example.com', 'token123'))
            .rejects.toThrow(BadRequestError);
    });

    it('debe enviar el correo si el logo existe', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });

        const service = new ResendEmailService();

        await expect(service.enviarVerificacion('cliente@example.com', 'token123'))
            .resolves.toBeUndefined();
    });

    it('debe enviar el correo si hay un problema de red al verificar el logo', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

        const service = new ResendEmailService();

        await expect(service.enviarVerificacion('cliente@example.com', 'token123'))
            .resolves.toBeUndefined();
    });

    it('debe cachear el resultado de la verificación dentro del TTL (un solo HEAD)', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ status: 200 });
        global.fetch = fetchMock as unknown as typeof fetch;

        const service = new ResendEmailService();
        await service.enviarVerificacion('a@example.com', 'token-a');
        await service.enviarVerificacion('b@example.com', 'token-b');

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('debe cachear el 404 y volver a lanzar BadRequestError dentro del TTL', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ status: 404 });
        global.fetch = fetchMock as unknown as typeof fetch;

        const service = new ResendEmailService();
        await expect(service.enviarVerificacion('a@example.com', 'token-a'))
            .rejects.toThrow(BadRequestError);
        await expect(service.enviarVerificacion('b@example.com', 'token-b'))
            .rejects.toThrow(BadRequestError);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('debe cachear el problema de red y no reintentar dentro del TTL', async () => {
        const fetchMock = jest.fn().mockRejectedValue(new Error('network down'));
        global.fetch = fetchMock as unknown as typeof fetch;

        const service = new ResendEmailService();
        await service.enviarVerificacion('a@example.com', 'token-a');
        await service.enviarVerificacion('b@example.com', 'token-b');

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('debe reintentar la verificación después de que expira el TTL', async () => {
        jest.useFakeTimers();
        try {
            const fetchMock = jest.fn().mockResolvedValue({ status: 200 });
            global.fetch = fetchMock as unknown as typeof fetch;

            const service = new ResendEmailService();
            await service.enviarVerificacion('a@example.com', 'token-a');
            jest.advanceTimersByTime(5 * 60 * 1000 + 1);
            await service.enviarVerificacion('b@example.com', 'token-b');

            expect(fetchMock).toHaveBeenCalledTimes(2);
        } finally {
            jest.useRealTimers();
        }
    });
});
