import { ok, fail } from '@shared/utils/response';

// Pruebas unitarias para los helpers de respuesta de la API
// ok() y fail() son funciones puras: dado el mismo input, siempre retornan el mismo output
describe('ok', () => {

    it('debe retornar ok: true con la data proporcionada', () => {
        const result = ok({ id: 1, correo: 'test@test.com' });

        expect(result.ok).toBe(true);
        expect(result.data).toEqual({ id: 1, correo: 'test@test.com' });
    });

    it('debe funcionar con cualquier tipo de data', () => {
        expect(ok('texto').data).toBe('texto');
        expect(ok(42).data).toBe(42);
        expect(ok(null).data).toBeNull();
    });
});

describe('fail', () => {

    it('debe retornar ok: false con name y message', () => {
        const result = fail('NotFoundError', 'Recurso no encontrado');

        expect(result.ok).toBe(false);
        expect(result.name).toBe('NotFoundError');
        expect(result.message).toBe('Recurso no encontrado');
    });

    // stack es opcional — solo se incluye en desarrollo para no exponer internos en producción
    it('debe incluir stack cuando se proporciona', () => {
        const result = fail('Error', 'Algo falló', 'Error: Algo falló\n  at ...');

        expect(result.stack).toBe('Error: Algo falló\n  at ...');
    });

    it('debe dejar stack como undefined cuando no se proporciona', () => {
        const result = fail('Error', 'Algo falló');

        expect(result.stack).toBeUndefined();
    });
});
