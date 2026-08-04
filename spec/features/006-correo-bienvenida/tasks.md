# 006 · Correo de bienvenida tras la verificación — Tareas

_Checklist accionable derivada del `plan.md`._

## Parte 1 — Puerto de salida

### Contrato 🔲

- [ ] `src/core/ports/out/email/IEmailService.ts`:
  - [ ] Agregar `enviarBienvenida(correo: string, nombre: string): Promise<void>` (aditivo, sin romper call sites).

## Parte 2 — ResendEmailService

### Servicio 🔲

- [ ] `src/adapters/out/email/resendEmail.service.ts`:
  - [ ] Cargar `this.templateBienvenida = loadTemplate('bienvenida')` en el constructor.
  - [ ] Extraer helper privado `enviar(correo: string, subject: string, html: string): Promise<void>` con el flujo compartido: `obtenerLogoUrl()` → `verificarLogoDisponible()` → `emails.send` → lanzar `Error` si `respuesta.error`.
  - [ ] Refactorizar `enviarVerificacion` para delegar en el helper (mismo comportamiento).
  - [ ] Implementar `enviarBienvenida(correo, nombre)`: subject `'Tu cuenta está activa — FadeForge'`, html con `this.templateBienvenida({ nombre, logoUrl })` vía el helper.

## Parte 3 — NullEmailService

### No-op 🔲

- [ ] `src/adapters/out/email/nullEmail.service.ts`:
  - [ ] Implementar `enviarBienvenida(_correo, _nombre)` como no-op.

## Parte 4 — ConfirmarEmailUseCase

### Use case 🔲

- [ ] `src/core/usecases/auth/confirmarEmail.usecase.ts`:
  - [ ] Constructor gana `usuarioRepository: IUsuarioRepository` y `emailService: IEmailService`.
  - [ ] Tras `actualizarEmailVerificado`: `Promise.all([usuarioRepository.buscarPorId(idUsuario), credencialRepository.buscarPorIdUsuario(idUsuario)])`.
  - [ ] Si alguno es `null` → `console.error` defensivo y `return` (la verificación ya quedó hecha).
  - [ ] `await this.emailService.enviarBienvenida(credencial.correo, usuario.nombre)` dentro de `try/catch` con `console.error` (side-effect: el fallo no rompe el flujo).

## Parte 5 — Template de bienvenida

### Template 🔲

- [ ] NUEVO `src/adapters/out/email/templates/bienvenida.mjml`:
  - [ ] Reusa `partials/header.mjml` (logo) y `partials/footer.mjml` (aviso + copyright).
  - [ ] Título "¡Tu cuenta está activa!" + "Hola {{nombre}}," + texto de que ya puede iniciar sesión.
  - [ ] Sin CTA a links (el frontend no existe) y sin token.
- [ ] `bienvenida.html` regenerado con `npm run build:emails`.

## Parte 6 — Routes (wire-up)

### Inyección 🔲

- [ ] `src/adapters/in/http/auth/auth.routes.ts`:
  - [ ] `new ConfirmarEmailUseCase(tokenVerificacionRepo, credencialesRepo, usuariosRepo, emailService)`.
  - [ ] Verificar que el controller no cambia (firma de `IConfirmarEmailUseCase` intacta).

## Parte 7 — Preview local

### Script 🔲

- [ ] `scripts/preview-email.mjs`:
  - [ ] Agregar `nombre: 'Vicente'` al objeto de render (la bienvenida saluda por nombre).

## Parte 8 — Tests

### ConfirmarEmailUseCase 🔲

- [ ] `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts`:
  - [ ] Agregar mocks de `usuarioRepository` (`jest.Mocked<IUsuarioRepository>`) y `emailService` (`jest.Mocked<IEmailService>`).
  - [ ] Actualizar el constructor de los tests (4 dependencias).
  - [ ] Caso: tras un POST exitoso, `enviarBienvenida` se llama con `(credencial.correo, usuario.nombre)`.
  - [ ] Caso: si el envío falla, el use case NO lanza (el fallo se loguea) y la verificación ya quedó hecha.
  - [ ] Caso: si `buscarPorId` devuelve `null`, no se llama a `enviarBienvenida` y el flujo termina con éxito (defensivo).

### ResendEmailService 🔲

- [ ] `tests/unit/adapters/out/email/resendEmail.service.test.ts`:
  - [ ] `enviarBienvenida` envía al correo correcto con subject "Tu cuenta está activa — FadeForge" y HTML con "Hola {nombre}".
  - [ ] Rechazo de Resend en la bienvenida → lanza `Error` con el mensaje del SDK.
  - [ ] Logo 404 → `BadRequestError` (flujo compartido con `enviarVerificacion`).

### TemplateLoader 🔲

- [ ] `tests/unit/adapters/out/email/templateLoader.test.ts`:
  - [ ] Describe de `bienvenida`: renderiza "¡Tu cuenta está activa!" y "Hola {nombre}".
  - [ ] Header con logo (`alt="FadeForge"`, `src` desde `{{logoUrl}}`) y footer con copyright.

### Mocks existentes 🔲

- [ ] `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts`: agregar `enviarBienvenida: jest.fn()` al mock de `IEmailService`.
- [ ] `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts`: agregar `enviarBienvenida: jest.fn()` al mock de `IEmailService`.

## Validación final 🔲

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Ejecutar `npm run build` y verificar que compila sin errores (incluye `build:emails`).
- [ ] Probar manualmente (feature ON): registrar cliente → confirmar con `POST /auth/confirmar` → recibir el correo de bienvenida con "Hola {nombre}" → verificar en logs que un fallo de envío no rompe el `200`.
- [ ] Verificar que `GET /auth/confirmar` (read-only) NO dispara la bienvenida.
- [ ] Verificar que reutilizar el token tras el POST responde 400 y no reenvía bienvenida.
- [ ] `EMAIL_TEMPLATE=bienvenida npm run preview:email` para revisar el template.
- [ ] Actualizar `spec/constitution/roadmap.md` (mover 006 a "Siguiente") al completar la implementación.
