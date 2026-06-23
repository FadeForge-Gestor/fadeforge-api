import { actualizarRolSchema } from '@adapters/in/http/roles/roles.schema';

describe('actualizarRolSchema', () => {

    it('debe fallar si el objeto está vacío', () => {
        const result = actualizarRolSchema.safeParse({});

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Debes enviar al menos un campo para actualizar');
        }
    });

    it('debe pasar si al menos un campo está presente', () => {
        const result = actualizarRolSchema.safeParse({ nombre: 'Supervisor' });

        expect(result.success).toBe(true);
    });
});
