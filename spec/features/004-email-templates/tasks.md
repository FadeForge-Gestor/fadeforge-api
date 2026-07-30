# 004 · Templates HTML para correos electrónicos — Tareas

_Checklist accionable derivada del `plan.md`._

## Dependencia

- [ ] Auditar `handlebars`: `npm show handlebars` (versión, dependencias, vulnerabilidades).
- [ ] Ejecutar `npm install handlebars`.
- [ ] Verificar que `npm test` y `npm run build` siguen funcionando.

## Build script

- [ ] Modificar `package.json`:
  - [ ] `"build": "tsc && node -e \"require('fs').cpSync('src', 'dist', { filter: f => f.endsWith('.hbs'), recursive: true })\""`.
  - [ ] Verificar localmente: `npm run build` y los `.hbs` aparecen en `dist/`.

## Template de verificación

- [ ] Crear `src/adapters/out/email/templates/verificacion.hbs`:
  - [ ] Variables: `{{link}}` y `{{horasExpiracion}}`.
  - [ ] Mismo contenido visual que el HTML inline actual (incluye el texto "Si no creaste esta cuenta...").

## Template loader

- [ ] Crear `src/adapters/out/email/templateLoader.ts`:
  - [ ] `const TEMPLATES_DIR = join(__dirname, 'templates')`.
  - [ ] Función `loadTemplate(nombre: string): HandlebarsTemplateFunction`.
  - [ ] Lee archivo `.hbs` con `readFileSync` y compila con `Handlebars.compile()`.

## ResendEmailService — usar template

- [ ] Modificar `src/adapters/out/email/resendEmail.service.ts`:
  - [ ] Importar `loadTemplate` desde `./templateLoader`.
  - [ ] Cargar `verificacion` template en el constructor.
  - [ ] Reemplazar HTML inline por `this.templateVerificacion({ link, horasExpiracion })`.
  - [ ] Eliminar el string HTML multilínea.

## Tests

- [ ] Crear `tests/unit/adapters/out/email/templateLoader.test.ts`:
  - [ ] Test: `{{link}}` se renderiza correctamente.
  - [ ] Test: `{{horasExpiracion}}` se renderiza como string.
  - [ ] Test: HTML generado contiene los textos esperados.

## Validación final

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Ejecutar `npm run build` y verificar:
  - [ ] Compila sin errores.
  - [ ] `dist/adapters/out/email/templates/` existe con los `.hbs`.
- [ ] Ejecutar `npm run dev` y verificar que los templates se cargan al arrancar.
