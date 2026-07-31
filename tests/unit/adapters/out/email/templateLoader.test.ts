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

        it('debe renderizar {{logoUrl}} con el valor proporcionado', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24, logoUrl: 'https://res.cloudinary.com/fadeforge/image/upload/v1/fadeforge/dev/templates_email/logo_app' });
            expect(html).toContain('https://res.cloudinary.com/fadeforge/image/upload/v1/fadeforge/dev/templates_email/logo_app');
        });

        it('debe incluir la etiqueta <img> del logo con alt FadeForge', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24, logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('<img');
            expect(html).toContain('alt="FadeForge"');
        });

        it('debe generar el HTML con los textos esperados del correo de verificación', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24, logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('Bienvenido a FadeForge');
            expect(html).toContain('Confirmar correo');
            expect(html).toContain('Si no creaste esta cuenta');
        });

        it('debe lanzar error si el template no existe', () => {
            expect(() => loadTemplate('template-inexistente')).toThrow();
        });
    });
});
