import { ActualizarCitaSchema, CambiarEstadoCitaSchema } from '@adapters/in/http/citas/citas.schema';

describe('ActualizarCitaSchema', () => {

    it('debe fallar si el objeto está vacío', () => {
        const result = ActualizarCitaSchema.safeParse({});

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Debes enviar al menos un campo para actualizar');
        }
    });

    it('debe pasar si al menos un campo está presente', () => {
        const result = ActualizarCitaSchema.safeParse({ idEmpleado: 1 });

        expect(result.success).toBe(true);
    });
});

describe('CambiarEstadoCitaSchema', () => {

    it('debe fallar si el estado es cancelada sin motivoCancelado', () => {
        const result = CambiarEstadoCitaSchema.safeParse({ estado: 'cancelada' });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('motivo de cancelación');
        }
    });

    it('debe pasar si el estado es cancelada con motivoCancelado', () => {
        const result = CambiarEstadoCitaSchema.safeParse({
            estado: 'cancelada',
            motivoCancelado: 'Cliente no se presentó',
        });

        expect(result.success).toBe(true);
    });

    it('debe pasar si el estado no es cancelada sin motivoCancelado', () => {
        const result = CambiarEstadoCitaSchema.safeParse({ estado: 'finalizada' });

        expect(result.success).toBe(true);
    });
});
