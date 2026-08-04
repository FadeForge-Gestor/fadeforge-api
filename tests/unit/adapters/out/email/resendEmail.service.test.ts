import { ResendEmailService } from '@adapters/out/email/resendEmail.service';
import { BadRequestError } from '@shared/errors/HttpError';

jest.mock('resend', () => {
    const send = jest.fn().mockResolvedValue({});
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: { send },
        })),
        __sendMock: send,
    };
});

jest.mock('@config/env', () => ({
    env: {
        RESEND_API_KEY: 'test-key',
        EMAIL_FROM: 'test@fadeforge.com',
        FRONTEND_URL: 'http://localhost:3000',
        API_URL: 'http://localhost:4000',
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

    it('debe apuntar el link del correo al backend API_URL/api/v1/auth/confirmar', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });

        const { __sendMock } = jest.requireMock('resend') as { __sendMock: jest.Mock };
        __sendMock.mockClear();

        const service = new ResendEmailService();
        await service.enviarVerificacion('cliente@example.com', 'token123');

        const html = __sendMock.mock.calls[0][0].html;
        expect(html).toContain('http://localhost:4000/api/v1/auth/confirmar?token=token123');
    });

    it('debe lanzar Error si Resend rechaza el envío (el rechazo ya no queda invisible)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });

        const { __sendMock } = jest.requireMock('resend') as { __sendMock: jest.Mock };
        __sendMock.mockResolvedValue({
            data: null,
            error: {
                name: 'validation_error',
                message: 'El remitente onboarding@resend.dev no puede enviar a este destinatario',
            },
        });

        const service = new ResendEmailService();

        await expect(service.enviarVerificacion('cliente@example.com', 'token123'))
            .rejects.toThrow('no puede enviar a este destinatario');
    });
});
