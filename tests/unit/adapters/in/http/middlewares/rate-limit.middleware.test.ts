const capturedConfigs: Record<string, unknown>[] = [];

jest.mock('express-rate-limit', () => {
    return jest.fn((config: Record<string, unknown>) => {
        capturedConfigs.push(config);
        return jest.fn();
    });
});

import { authRateLimit, userLoginRateLimit } from '@middlewares/rate-limit.middleware';

describe('authRateLimit', () => {

    it('debe exportar una función middleware', () => {
        expect(typeof authRateLimit).toBe('function');
    });

    it('debe configurar una ventana de 15 minutos', () => {
        expect(capturedConfigs[0].windowMs).toBe(15 * 60 * 1000);
    });

    it('debe limitar a 10 intentos por ventana', () => {
        expect(capturedConfigs[0].limit).toBe(10);
    });

    it('debe incluir mensaje de error en español con mención del tiempo de espera', () => {
        const message = capturedConfigs[0].message as { status: string; message: string };
        expect(message.status).toBe('error');
        expect(message.message).toContain('15 minutos');
    });

    it('no debe usar legacy headers', () => {
        expect(capturedConfigs[0].legacyHeaders).toBe(false);
    });
});

describe('userLoginRateLimit', () => {

    it('debe exportar una función middleware', () => {
        expect(typeof userLoginRateLimit).toBe('function');
    });

    it('debe configurar una ventana de 15 minutos', () => {
        expect(capturedConfigs[1].windowMs).toBe(15 * 60 * 1000);
    });

    it('debe limitar a 5 intentos por ventana por correo', () => {
        expect(capturedConfigs[1].limit).toBe(5);
    });

    it('debe usar el correo del body como key', () => {
        const keyGenerator = capturedConfigs[1].keyGenerator as (req: { body: { correo: string } }) => string;
        expect(keyGenerator({ body: { correo: 'Test@Gmail.COM' } })).toBe('test@gmail.com');
    });

    it('debe incluir mensaje distinguishable del authRateLimit', () => {
        const message = capturedConfigs[1].message as { status: string; message: string };
        expect(message.message).toContain('correo');
    });
});
