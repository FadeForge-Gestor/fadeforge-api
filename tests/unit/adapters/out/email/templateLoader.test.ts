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

        it('debe generar HTML de email profesional (tablas, role=presentation y responsive)', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/token', horasExpiracion: 24, logoUrl: 'https://example.com/logo.png' });
            expect(html).toContain('<table');
            expect(html).toContain('role="presentation"');
            expect(html).toMatch(/@media/);
        });

        it('debe renderizar el botón CTA como <a> con estilos inline y el link', () => {
            const template = loadTemplate('verificacion');
            const html = template({ link: 'https://example.com/confirmar?token=abc', horasExpiracion: 24, logoUrl: 'https://example.com/logo.png' });
            const boton = /<a[^>]*href="https:\/\/example\.com\/confirmar\?token=abc"[^>]*>[\s\S]*?Confirmar correo[\s\S]*?<\/a>/.exec(html);
            expect(boton).not.toBeNull();
            expect(boton![0]).toContain('background:#111111');
            expect(boton![0]).toContain('style=');
        });

        it('debe lanzar error si el template no existe', () => {
            expect(() => loadTemplate('template-inexistente')).toThrow();
        });
    });
});
