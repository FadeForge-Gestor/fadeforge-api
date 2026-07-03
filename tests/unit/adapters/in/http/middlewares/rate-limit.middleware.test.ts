let capturedConfig: Record<string, unknown> = {};

jest.mock('express-rate-limit', () => {
    return jest.fn((config: Record<string, unknown>) => {
        capturedConfig = config;
        return jest.fn();
    });
});

import { authRateLimit } from '@middlewares/rate-limit.middleware';

describe('authRateLimit', () => {

    it('debe exportar una función middleware', () => {
        expect(typeof authRateLimit).toBe('function');
    });

    it('debe configurar una ventana de 15 minutos', () => {
        expect(capturedConfig.windowMs).toBe(15 * 60 * 1000);
    });

    it('debe limitar a 10 intentos por ventana', () => {
        expect(capturedConfig.limit).toBe(10);
    });

    it('debe incluir mensaje de error en español con mención del tiempo de espera', () => {
        const message = capturedConfig.message as { status: string; message: string };
        expect(message.status).toBe('error');
        expect(message.message).toContain('15 minutos');
    });

    it('no debe usar legacy headers', () => {
        expect(capturedConfig.legacyHeaders).toBe(false);
    });
});
