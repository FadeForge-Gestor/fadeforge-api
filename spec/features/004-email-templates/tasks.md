# 004 · Templates HTML para correos electrónicos — Tareas

_Checklist accionable derivada del `plan.md`._

## Dependencia ✅

- [x] Auditar `handlebars`: `npm show handlebars` (versión, dependencias, vulnerabilidades).
- [x] Ejecutar `npm install handlebars`.
- [x] Verificar que `npm test` y `npm run build` siguen funcionando.

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

- [x] Subir el asset `logo_app` a Cloudinary en `fadeforge/dev/templates_email/` (hecho por el usuario en el dashboard).
- [x] Modificar `src/adapters/out/email/templates/verificacion.hbs`:
  - [x] Agregar `<img src="{{logoUrl}}" alt="FadeForge" />` al inicio del template.
- [x] Modificar `src/adapters/out/email/resendEmail.service.ts`:
  - [x] Calcular `carpeta` según `env.NODE_ENV` (`prod` si `production`, si no `dev`).
  - [x] Construir `logoUrl` con el patrón `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/fadeforge/${carpeta}/templates_email/logo_app`.
  - [x] Pasar `logoUrl` al render del template junto a `link` y `horasExpiracion`.
- [x] Actualizar `tests/unit/adapters/out/email/templateLoader.test.ts`:
  - [x] Test: `{{logoUrl}}` se renderiza con el valor proporcionado.
  - [x] Test: el HTML contiene la etiqueta `<img` con `alt="FadeForge"`.
  - [x] Test: renderizar el template con `logoUrl` de prueba y verificar que aparece en el HTML.

## Error 400 si el logo no existe ✅

- [x] Modificar `src/adapters/out/email/resendEmail.service.ts`:
  - [x] Verificar existencia del logo con `fetch(logoUrl, { method: 'HEAD' })` antes de enviar.
  - [x] Si responde `404` → lanzar `BadRequestError` (HTTP 400).
  - [x] Si hay error de red (`fetch` lanza) → continuar con el envío.
- [x] Crear `tests/unit/adapters/out/email/resendEmail.service.test.ts`:
  - [x] Test: `404` del logo → `BadRequestError`.
  - [x] Test: `200` del logo → el correo se envía.
  - [x] Test: error de red al verificar → el correo se envía.

## Validación final

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Ejecutar `npm run build` y verificar:
  - [ ] Compila sin errores.
  - [ ] `dist/adapters/out/email/templates/` existe con los `.hbs`.
- [ ] Ejecutar `npm run dev` y verificar que los templates se cargan al arrancar.
