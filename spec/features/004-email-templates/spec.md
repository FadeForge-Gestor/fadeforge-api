# 004 · Templates HTML para correos electrónicos

**Estado:** en implementación

## Qué hace

Implementa un sistema de templates HTML para los correos electrónicos de FadeForge API. Extrae el marcado HTML actual —hardcodeado inline en `ResendEmailService`— a archivos de template separados, usando un template engine liviano.

El template de verificación incluye el **logo de la app**, servido desde Cloudinary (`fadeforge/{env}/templates_email/logo_app`). La URL se pasa como variable de Handlebars (`{{logoUrl}}`) calculada por el adapter según el entorno (`dev`/`prod`), nunca hardcodeada en el HTML.

Esto sienta la base para:
- Mantener y evolucionar los diseños de correo sin tocar código de infraestructura.
- Agregar nuevos tipos de correo (recordatorios de citas, notificaciones, etc.) con solo crear un nuevo archivo de template.
- Tener una separación clara entre presentación (HTML) e infraestructura (adapter de email).

> **Fase 2 (en diseño):** sobre esta base, los templates se rediseñan con **MJML** (compilación en build-time) para lograr maquetación profesional, responsive y render consistente en Gmail/Outlook/móvil. Ver la sección "Fase 2" al final.

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
- Preview en caliente de templates (hot-reload en desarrollo).

---

## Fase 2 · Rediseño profesional con MJML (build-time)

**Estado:** en diseño — docs actualizadas, sin implementar.

### Qué hace

Rediseña los templates de la Fase 1 (`.hbs` maquetados a mano) usando **MJML 5** como lenguaje de maquetación, compilado a HTML en **build-time**. Resultado: correo profesional con header de logo, título, cuerpo, botón CTA con la paleta de FadeForge y footer con expiración y disclaimer, con render consistente en Gmail, Outlook desktop y móviles.

### Por qué

El template actual (fragmento HTML de 6 líneas) funciona, pero:

- **Renderiza distinto en cada cliente**: Outlook usa el motor de Word; Gmail elimina `<style>` y `<head>`. El HTML compilado por MJML (tablas + estilos inline) es lo que los clientes de correo respetan.
- **No es responsive**: en móvil el botón y el texto se ven mal.
- **Con 5 templates proyectados** (verificación, reset de contraseña, recordatorio de cita, etc.), maquetar a mano con tablas multiplica el mantenimiento y rompe la consistencia entre correos.

MJML resuelve los tres: HTML de calidad profesional, responsive por defecto, licencia **MIT (gratis, verificado en el repo oficial y FAQ de mjml.io)** y layout base reutilizable para los 5 templates.

### Criterios de aceptación (Fase 2)

- [ ] `mjml` está en `devDependencies` (solo build-time), auditado antes de instalar (árbol transitivo y licencia MIT).
- [ ] Los templates fuente viven en `src/adapters/out/email/templates/` como `.mjml`.
- [ ] El build compila los `.mjml` a HTML con los placeholders de Handlebars intactos y los copia a `dist/`.
- [ ] `ResendEmailService` sigue renderizando con Handlebars — el adapter NO compila MJML en runtime.
- [ ] El correo de verificación renderiza igual o mejor que hoy: logo, título, texto, botón CTA, footer — en Gmail, Outlook y móvil.
- [ ] El layout base (header/footer) es compartido por los templates (`mj-include`) si el spike lo permite.
- [ ] La paleta usa los colores de FadeForge (#111 + acento) y el logo sigue viniendo de `{{logoUrl}}` (LOGO_URL del `.env`).
- [ ] La validación 400 + TTL del logo (Fase 1) sigue funcionando sin cambios.
- [ ] Todos los tests pasan (`npm test`) y `npm run build` compila.

### Fuera de alcance (Fase 2)

- Compilar MJML en runtime (Opción B descartada: CPU por render sin ventajas sobre build-time).
- Maquetación a mano con tablas (Opción C descartada: 5 templates la vuelven no mantenible).
- i18n, preview en caliente, cambio de proveedor de email.
