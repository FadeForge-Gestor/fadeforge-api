import { loginSchema, registroClienteSchema } from '@adapters/in/http/auth/auth.schema';

const clienteValido = {
    nombre: 'Juan',
    aPaterno: 'Pérez',
    aMaterno: 'García',
    telefono: '5512345678',
    correo: 'juan@gmail.com',
    contrasena: 'Abc123!@#',
};

describe('loginSchema', () => {

    it('debe pasar con datos válidos', () => {
        const result = loginSchema.safeParse({ correo: 'test@test.com', contrasena: 'cualquier' });
        expect(result.success).toBe(true);
    });

    it('debe fallar con correo inválido', () => {
        const result = loginSchema.safeParse({ correo: 'no-es-correo', contrasena: '123456' });
        expect(result.success).toBe(false);
    });

    it('debe fallar con contraseña vacía', () => {
        const result = loginSchema.safeParse({ correo: 'test@test.com', contrasena: '' });
        expect(result.success).toBe(false);
    });
});

describe('registroClienteSchema', () => {

    it('debe pasar con todos los campos válidos y contraseña fuerte', () => {
        const result = registroClienteSchema.safeParse(clienteValido);
        expect(result.success).toBe(true);
    });

    it('debe pasar sin aMaterno (campo opcional)', () => {
        const { aMaterno, ...sinMaterno } = clienteValido;
        const result = registroClienteSchema.safeParse(sinMaterno);
        expect(result.success).toBe(true);
    });

    it('debe fallar si la contraseña tiene menos de 8 caracteres', () => {
        const result = registroClienteSchema.safeParse({ ...clienteValido, contrasena: 'Ab1!' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues[0].message).toContain('8 caracteres');
    });

    it('debe fallar si la contraseña contiene espacios', () => {
        const result = registroClienteSchema.safeParse({ ...clienteValido, contrasena: 'Abc 123!@#' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues[0].message).toContain('espacios');
    });

    it('debe fallar si la contraseña no tiene mayúsculas', () => {
        const result = registroClienteSchema.safeParse({ ...clienteValido, contrasena: 'abc123!@#' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues[0].message).toContain('mayúsculas');
    });

    it('debe fallar si la contraseña no tiene minúsculas', () => {
        const result = registroClienteSchema.safeParse({ ...clienteValido, contrasena: 'ABC123!@#' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues[0].message).toContain('mayúsculas');
    });

    it('debe fallar si la contraseña no tiene números', () => {
        const result = registroClienteSchema.safeParse({ ...clienteValido, contrasena: 'Abcdef!@#' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues[0].message).toContain('números');
    });

    it('debe fallar si la contraseña no tiene símbolos', () => {
        const result = registroClienteSchema.safeParse({ ...clienteValido, contrasena: 'Abcdef123' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues[0].message).toContain('símbolos');
    });

    it('debe fallar si falta el correo', () => {
        const { correo, ...sinCorreo } = clienteValido;
        const result = registroClienteSchema.safeParse(sinCorreo);
        expect(result.success).toBe(false);
    });

    it('debe fallar si el teléfono tiene menos de 10 caracteres', () => {
        const result = registroClienteSchema.safeParse({ ...clienteValido, telefono: '55123' });
        expect(result.success).toBe(false);
    });
});
