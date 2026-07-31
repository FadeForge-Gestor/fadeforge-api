# 004 · Templates HTML para correos electrónicos — Tareas

_Checklist accionable derivada del `plan.md`._

## Dependencia ✅

- [x] Auditar `handlebars`: `npm show handlebars` (versión, dependencias, vulnerabilidades).
- [x] Ejecutar `npm install handlebars`.
- [x] Verificar que `npm test` y `npm run build` siguen funcionando.

## URL de la imagen

- La URL real del logo vive solo en `.env` como `LOGO_URL`. No se documenta la URL literal en el repo — es un valor sensible de entorno.

## Build script ✅

- [x] Modificar `package.json`:
  - [x] `"build": "tsc && node -e \"require('fs').cpSync('src', 'dist', { filter: f => f.endsWith('.hbs'), recursive: true })\""`.
  - [x] Verificar localmente: `npm run build` y los `.hbs` aparecen en `dist/`.

## Template de verificación ✅

- [x] Crear `src/adapters/out/email/templates/verificacion.hbs`:
  - [x] Variables: `{{link}}` y `{{horasExpiracion}}`.
  - [x] Mismo contenido visual que el HTML inline actual (incluye el texto "Si no creaste esta cuenta...").

## Template loader ✅

- [x] Crear `src/adapters/out/email/templateLoader.ts`:
  - [x] `const TEMPLATES_DIR = join(__dirname, 'templates')`.
  - [x] Función `loadTemplate(nombre: string): HandlebarsTemplateFunction`.
  - [x] Lee archivo `.hbs` con `readFileSync` y compila con `Handlebars.compile()`.

## ResendEmailService — usar template ✅

- [x] Modificar `src/adapters/out/email/resendEmail.service.ts`:
  - [x] Importar `loadTemplate` desde `./templateLoader`.
  - [x] Cargar `verificacion` template en el constructor.
  - [x] Reemplazar HTML inline por `this.templateVerificacion({ link, horasExpiracion })`.
  - [x] Eliminar el string HTML multilínea.

## Tests ✅

- [x] Crear `tests/unit/adapters/out/email/templateLoader.test.ts`:
  - [x] Test: `{{link}}` se renderiza correctamente.
  - [x] Test: `{{horasExpiracion}}` se renderiza como string.
  - [x] Test: HTML generado contiene los textos esperados.

## Logo de la app en el template (opción B) ✅

- [x] Subir el logo a Cloudinary (hecho por el usuario en el dashboard).
- [x] Agregar `LOGO_URL` como variable **requerida** en `src/config/env.ts` (fail-fast si falta).
- [x] Documentar `LOGO_URL` en `.env.template` con un valor de ejemplo falso (nunca valores reales).
- [x] Modificar `src/adapters/out/email/templates/verificacion.hbs`:
  - [x] Agregar `<img src="{{logoUrl}}" alt="FadeForge" />` al inicio del template.
- [x] Modificar `src/adapters/out/email/resendEmail.service.ts`:
  - [x] `obtenerLogoUrl()` devuelve `env.LOGO_URL` (sin adivinar patrones de carpeta/public_id).
  - [x] Pasar `logoUrl` al render del template junto a `link` y `horasExpiracion`.
- [x] Actualizar `tests/unit/adapters/out/email/templateLoader.test.ts`:
  - [x] Test: `{{logoUrl}}` se renderiza con el valor proporcionado.
  - [x] Test: el HTML contiene la etiqueta `<img` con `alt="FadeForge"`.
  - [x] Test: renderizar el template con `logoUrl` de prueba y verificar que aparece en el HTML.
- [x] Actualizar el mock de `@config/env` en `tests/unit/adapters/out/email/resendEmail.service.test.ts` con un `LOGO_URL` de prueba (valor falso).

## Error 400 si el logo no existe ✅

- [x] Modificar `src/adapters/out/email/resendEmail.service.ts`:
  - [x] Verificar existencia del logo con `fetch(logoUrl, { method: 'HEAD' })` antes de enviar.
  - [x] Si responde `404` → lanzar `BadRequestError` (HTTP 400).
  - [x] Si hay error de red (`fetch` lanza) → continuar con el envío.
- [x] Crear `tests/unit/adapters/out/email/resendEmail.service.test.ts`:
  - [x] Test: `404` del logo → `BadRequestError`.
  - [x] Test: `200` del logo → el correo se envía.
  - [x] Test: error de red al verificar → el correo se envía.
- [x] Cachear el resultado de la verificación con TTL de 5 min en memoria:
  - [x] Un solo `HEAD` dentro del TTL (dos envíos seguidos → un fetch).
  - [x] `404` cacheado → se relanza `BadRequestError` sin nuevo fetch.
  - [x] Red caída cacheada → no se reintenta dentro del TTL.
  - [x] TTL expirado → se vuelve a verificar.

## Fase 2 · Rediseño profesional con MJML (build-time) 🔲

_Docs actualizadas — sin implementar._

### Auditoría de la dependencia ✅

- [x] `npm show mjml` — verificar versión, licencia (MIT), dependencias y vulnerabilidades.
- [x] Auditar el árbol transitivo (`mjml-cli`, `mjml-core`, `mjml-validator`, `mjml-preset-core`, `@babel/runtime`).
- [x] Confirmar Node ≥ 22 (proyecto: 24.11.1 ✅).
- [x] Instalar `mjml` como **devDependency** (solo build-time, nunca en producción).
- [x] `npm audit` post-instalación: 20 vulns → 15 tras `overrides: { "lodash": "4.18.1" }` (mjml introdujo solo lodash 4.17.21, ya saneado). Baseline pre-existente documentado en `spec/constitution/tech-stack.md`.

### Spike de integración ✅

- [x] Crear un `.mjml` de prueba con `{{logoUrl}}` en `src`, `{{{link}}}` en `href` y `{{horasExpiracion}}` en texto.
- [x] Compilar con el CLI de MJML y verificar que los placeholders sobreviven intactos (✅ sin fallback de tokens).
- [x] Probar `mj-include` con un partial header/footer (✅ funciona con `--config.allowIncludes true`).
- [x] Verificar que el glob `*.mjml` no compila los partials (✅ no recursivo; usar forward slashes y carpeta de salida existente).

### Template profesional ✅

- [x] Crear `src/adapters/out/email/templates/verificacion.mjml`:
  - [x] Header: logo (`{{logoUrl}}`, 160px, alt FadeForge).
  - [x] Título "Bienvenido a FadeForge" + texto de instrucciones.
  - [x] Botón CTA "Confirmar correo" (`{{{link}}}`) con paleta FadeForge (#111).
  - [x] Footer: expiración (`{{horasExpiracion}}`) + disclaimer.
- [x] Crear `templates/partials/header.mjml` y `footer.mjml` reutilizables.

### Pipeline de build ✅

- [x] Agregar script de prebuild: `build:emails` compila `*.mjml` → HTML con placeholders intactos.
- [x] Ajustar `npm run build`: pipeline `build:emails && tsc && cpSync` (filter `.hbs` + `.html`).
- [x] Decidir y documentar: el HTML compilado se commitea (dev sin build) y `build:emails` lo regenera.
- [x] Verificar `npm run build` en limpio (borrando `dist/` antes) — ✅ `dist/.../templates/` queda solo con `verificacion.html` + `partials/`.

### Tests ✅

- [x] Verificar que los tests existentes de `templateLoader` siguen pasando con el HTML compilado (✅ 286 tests).
- [x] Nuevo test: el HTML compilado contiene `<table`, `role="presentation"` y media queries.
- [x] Test de regresión: textos y placeholders renderizan igual que hoy (✅).

### Validación visual

- [x] Generar preview local del HTML compilado con el logo real (✅ abierto en navegador).
- [ ] Revisar render en Gmail/Outlook/móvil (Litmus o envío de prueba con Resend).

## Validación final

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Ejecutar `npm run build` y verificar:
  - [ ] Compila sin errores.
  - [ ] `dist/adapters/out/email/templates/` existe con los `.hbs`.
  - [ ] (Fase 2) Los templates compilados por MJML están en `dist/adapters/out/email/templates/`.
- [ ] Ejecutar `npm run dev` y verificar que los templates se cargan al arrancar.
