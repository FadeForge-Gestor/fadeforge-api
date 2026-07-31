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

        it('debe lanzar error si el template no existe', () => {
            expect(() => loadTemplate('template-inexistente')).toThrow();
        });
    });
});
