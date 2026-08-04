import { loadTemplate } from '@adapters/out/email/templateLoader';

describe('templateLoader', () => {
    describe('loadTemplate', () => {
        it('debe compilar el template de verificación sin errores', () => {
            const template = loadTemplate('verificacion');
            expect(template).toBeInstanceOf(Function);
        });

        it('debe renderizar {{link}} con el valor proporcionado', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/confirmar?token=abc123', horasExpiracion: 24 });
            expect(html).toContain('https://example.com/confirmar?token=abc123');
        });

        it('debe renderizar {{horasExpiracion}} como string', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 48 });
            expect(html).toContain('48');
        });

        it('debe incluir el header de marca con el nombre de la empresa sobre fondo oscuro', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24 });
            expect(html).toContain('FadeForge');
            expect(html).toMatch(/background[^;]*#111111/);
        });

        it('debe incluir el copyright y los derechos reservados en el footer', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24 });
            expect(html).toContain('© 2026 FadeForge. Todos los derechos reservados.');
        });

        it('debe generar el HTML con los textos esperados del correo de verificación', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24, logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('Bienvenido a FadeForge');
            expect(html).toContain('Confirmar correo');
            expect(html).toContain('Si no creaste esta cuenta');
        });

        it('debe generar HTML de email profesional (tablas, role=presentation y responsive)', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24, logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('<table');
            expect(html).toContain('role="presentation"');
            expect(html).toMatch(/@media/);
        });

        it('debe renderizar el botón CTA full-width (misma proporción que el header) con estilos inline y el link', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/confirmar?token=abc', horasExpiracion: 24 });
            const boton = /<table[^>]*border-collapse:separate[^>]*>[\s\S]*?Confirmar correo[\s\S]*?<\/table>/.exec(html);
            expect(boton).not.toBeNull();
            expect(boton![0]).toContain('width:100%');
            expect(boton![0]).toContain('background:#111111');
            expect(boton![0]).toContain('href="https://example.com/confirmar?token=abc"');
        });

        it('debe ocultar el token como texto visible: viaja solo en el href del botón', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/confirmar?token=abc', horasExpiracion: 24 });
            expect(html).not.toContain('¿No funciona el botón? Copia y pega este enlace en tu navegador:');
            expect(html).not.toContain('Copia y pega este enlace');
            expect(html).toContain('El Token es de un solo uso y expira en 24 horas.');
            expect(html).toContain('href="https://example.com/confirmar?token=abc"');
        });

        it('debe renderizar el logo en el header desde {{logoUrl}}', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24, logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('alt="FadeForge"');
            expect(html).toContain('src="https://example.com/logo.png"');
        });

        it('debe lanzar error si el template no existe', () => {
            expect(() => loadTemplate('template-inexistente')).toThrow();
        });
    });

    describe('bienvenida', () => {
        it('debe compilar el template de bienvenida sin errores', () => {
            const template = loadTemplate('bienvenida');
            expect(template).toBeInstanceOf(Function);
        });

        it('debe renderizar el título y el saludo por nombre', () => {
            const template = loadTemplate('bienvenida');
            const html = template({ nombre: 'Vicente', logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('¡Tu cuenta está activa!');
            expect(html).toContain('Hola Vicente,');
        });

        it('debe incluir el header con logo desde {{logoUrl}} y el footer con copyright', () => {
            const template = loadTemplate('bienvenida');
            const html = template({ nombre: 'Vicente', logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('alt="FadeForge"');
            expect(html).toContain('src="https://example.com/logo.png"');
            expect(html).toContain('© 2026 FadeForge. Todos los derechos reservados.');
        });

        it('no debe contener token ni links a URLs inexistentes (el frontend no existe)', () => {
            const template = loadTemplate('bienvenida');
            const html = template({ nombre: 'Vicente', logoUrl: 'https://example.com/logo.png' });
            expect(html).not.toContain('token');
            expect(html).not.toContain('http://localhost:3000');
            expect(html).not.toContain('href="');
        });
    });
});
