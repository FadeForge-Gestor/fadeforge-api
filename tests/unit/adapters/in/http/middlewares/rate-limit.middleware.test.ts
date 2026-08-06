const capturedConfigs: Record<string, unknown>[] = [];

jest.mock('express-rate-limit', () => {
    return jest.fn((config: Record<string, unknown>) => {
        capturedConfigs.push(config);
        return jest.fn();
    });
});

import { authRateLimit, userLoginRateLimit, apiRateLimit, authRegisterRateLimit, authConfirmRateLimit, authResendRateLimit } from '@middlewares/rate-limit.middleware';

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

describe('apiRateLimit', () => {

    it('debe exportar una función middleware', () => {
        expect(typeof apiRateLimit).toBe('function');
    });

    it('debe configurar una ventana de 15 minutos por defecto', () => {
        expect(capturedConfigs[2].windowMs).toBe(15 * 60 * 1000);
    });

    it('debe limitar a 100 peticiones por ventana por defecto', () => {
        expect(capturedConfigs[2].limit).toBe(100);
    });

    it('debe incluir mensaje de error mencionando la IP', () => {
        const message = capturedConfigs[2].message as { status: string; message: string };
        expect(message.status).toBe('error');
        expect(message.message).toContain('esta IP');
    });

    it('debe usar standardHeaders draft-8 y sin legacy headers', () => {
        expect(capturedConfigs[2].standardHeaders).toBe('draft-8');
        expect(capturedConfigs[2].legacyHeaders).toBe(false);
    });
});

describe('authRegisterRateLimit', () => {

    it('debe exportar una función middleware', () => {
        expect(typeof authRegisterRateLimit).toBe('function');
    });

    it('debe limitar a 5 peticiones por ventana de 15 minutos', () => {
        expect(capturedConfigs[3].windowMs).toBe(15 * 60 * 1000);
        expect(capturedConfigs[3].limit).toBe(5);
    });

    it('debe incluir mensaje de error mencionando la IP', () => {
        const message = capturedConfigs[3].message as { status: string; message: string };
        expect(message.status).toBe('error');
        expect(message.message).toContain('esta IP');
    });
});

describe('authConfirmRateLimit', () => {

    it('debe exportar una función middleware', () => {
        expect(typeof authConfirmRateLimit).toBe('function');
    });

    it('debe limitar a 30 peticiones por ventana de 15 minutos', () => {
        expect(capturedConfigs[4].windowMs).toBe(15 * 60 * 1000);
        expect(capturedConfigs[4].limit).toBe(30);
    });

    it('debe incluir mensaje de error mencionando la IP', () => {
        const message = capturedConfigs[4].message as { status: string; message: string };
        expect(message.status).toBe('error');
        expect(message.message).toContain('esta IP');
    });
});

describe('authResendRateLimit', () => {

    it('debe exportar una función middleware', () => {
        expect(typeof authResendRateLimit).toBe('function');
    });

    it('debe limitar a 5 peticiones por ventana de 15 minutos', () => {
        expect(capturedConfigs[5].windowMs).toBe(15 * 60 * 1000);
        expect(capturedConfigs[5].limit).toBe(5);
    });

    it('debe incluir mensaje de error mencionando la IP', () => {
        const message = capturedConfigs[5].message as { status: string; message: string };
        expect(message.status).toBe('error');
        expect(message.message).toContain('esta IP');
    });
});
