# 004 · Templates HTML para correos electrónicos

**Estado:** en implementación

## Qué hace

Implementa un sistema de templates HTML para los correos electrónicos de FadeForge API. Extrae el marcado HTML actual —hardcodeado inline en `ResendEmailService`— a archivos de template separados, usando un template engine liviano.

El template de verificación incluye el **logo de la app**, servido desde Cloudinary (`fadeforge/{env}/templates_email/logo_app`). La URL se pasa como variable de Handlebars (`{{logoUrl}}`) calculada por el adapter según el entorno (`dev`/`prod`), nunca hardcodeada en el HTML.

Esto sienta la base para:
- Mantener y evolucionar los diseños de correo sin tocar código de infraestructura.
- Agregar nuevos tipos de correo (recordatorios de citas, notificaciones, etc.) con solo crear un nuevo archivo de template.
- Tener una separación clara entre presentación (HTML) e infraestructura (adapter de email).

## Por qué

Hoy `resendEmail.service.ts` tiene el HTML del correo de verificación embebido como un string multilínea:

```typescript
html: `
    <h1>Bienvenido a FadeForge</h1>
    <p>Haz clic en el siguiente enlace para confirmar tu correo electrónico:</p>
    <a href="${link}">Confirmar correo</a>
    <p>Este enlace expira en ${env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS} horas.</p>
`,
```

Esto tiene tres problemas:

1. **Mantenimiento**: cambiar el diseño del correo requiere modificar el adapter de infraestructura, mezclando concerns que deberían estar separados.
2. **Escalabilidad**: cuando aparezcan nuevos tipos de correo (recordatorio de cita, bienvenida, recuperación de contraseña), el adapter se va a llenar de HTML inline.
3. **Testabilidad**: no se puede verificar el HTML generado sin instanciar el adapter real.

## Criterios de aceptación

- [ ] Los templates de email viven en archivos separados dentro de `src/adapters/out/email/templates/`.
- [ ] `ResendEmailService.enviarVerificacion()` renderiza un template en lugar de usar HTML inline.
- [ ] El template recibe variables (como `link` y `horasExpiracion`) y las interpola correctamente.
- [ ] El template de verificación muestra el logo de la app en `{{logoUrl}}`, apuntando a `fadeforge/{dev|prod}/templates_email/logo_app` en Cloudinary según el entorno.
- [ ] La URL del logo se calcula en el adapter (infraestructura), no está hardcodeada en el template.
- [ ] El HTML generado es funcionalmente equivalente al actual (mismo contenido, mismas variables).
- [ ] No se agrega lógica de negocio a los templates (son de solo presentación).
- [ ] Todos los tests existentes siguen pasando (`npm test`).
- [ ] `npm run build` compila sin errores.

## Fuera de alcance

- Agregar nuevos tipos de correo (recordatorio de cita, bienvenida, etc.) — cada uno será una feature separada.
- Cambiar de proveedor de email (Resend, SendGrid, SMTP, etc.).
- Soporte multi-idioma (i18n) en los templates.
- Diseño responsive avanzado o maquetación profesional de emails.
- Preview en caliente de templates (hot-reload en desarrollo).
