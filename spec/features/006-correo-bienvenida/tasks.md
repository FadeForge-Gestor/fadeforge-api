# 006 · Correo de bienvenida tras la verificación — Tareas

_Checklist accionable derivada del `plan.md`._

## Parte 1 — Puerto de salida

### Contrato 🔲

- [x] `src/core/ports/out/email/IEmailService.ts`:
  - [x] Agregar `enviarBienvenida(correo: string, nombre: string): Promise<void>` (aditivo, sin romper call sites).

## Parte 2 — ResendEmailService

### Servicio 🔲

- [x] `src/adapters/out/email/resendEmail.service.ts`:
  - [x] Cargar `this.templateBienvenida = loadTemplate('bienvenida')` en el constructor.
  - [x] Extraer helper privado `enviar(correo: string, subject: string, html: string): Promise<void>` con el flujo compartido: `obtenerLogoUrl()` → `verificarLogoDisponible()` → `emails.send` → lanzar `Error` si `respuesta.error`.
  - [x] Refactorizar `enviarVerificacion` para delegar en el helper (mismo comportamiento).
  - [x] Implementar `enviarBienvenida(correo, nombre)`: subject `'Tu cuenta está activa — FadeForge'`, html con `this.templateBienvenida({ nombre, logoUrl })` vía el helper.

## Parte 3 — NullEmailService

### No-op 🔲

- [x] `src/adapters/out/email/nullEmail.service.ts`:
  - [x] Implementar `enviarBienvenida(_correo, _nombre)` como no-op.

## Parte 4 — ConfirmarEmailUseCase

### Use case 🔲

- [x] `src/core/usecases/auth/confirmarEmail.usecase.ts`:
  - [x] Constructor gana `usuarioRepository: IUsuarioRepository` y `emailService: IEmailService`.
  - [x] Tras `actualizarEmailVerificado`: `Promise.all([usuarioRepository.buscarPorId(idUsuario), credencialRepository.buscarPorIdUsuario(idUsuario)])`.
  - [x] Si alguno es `null` → `console.error` defensivo y `return` (la verificación ya quedó hecha).
  - [x] `await this.emailService.enviarBienvenida(credencial.correo, usuario.nombre)` dentro de `try/catch` con `console.error` (side-effect: el fallo no rompe el flujo).

## Parte 5 — Template de bienvenida

### Template 🔲

- [x] NUEVO `src/adapters/out/email/templates/bienvenida.mjml`:
  - [x] Reusa `partials/header.mjml` (logo) y `partials/footer.mjml` (aviso + copyright).
  - [x] Título "¡Tu cuenta está activa!" + "Hola {{nombre}}," + texto de que ya puede iniciar sesión.
  - [x] Sin CTA a links (el frontend no existe) y sin token.
- [x] `bienvenida.html` regenerado con `npm run build:emails`.

## Parte 6 — Routes (wire-up)

### Inyección 🔲

- [x] `src/adapters/in/http/auth/auth.routes.ts`:
  - [x] `new ConfirmarEmailUseCase(tokenVerificacionRepo, credencialesRepo, usuariosRepo, emailService)`.
  - [x] Verificar que el controller no cambia (firma de `IConfirmarEmailUseCase` intacta).

## Parte 7 — Preview local

### Script 🔲

- [x] `scripts/preview-email.mjs`:
  - [x] Agregar `nombre: 'Vicente'` al objeto de render (la bienvenida saluda por nombre).

## Parte 8 — Tests

### ConfirmarEmailUseCase 🔲

- [x] `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts`:
  - [x] Agregar mocks de `usuarioRepository` (`jest.Mocked<IUsuarioRepository>`) y `emailService` (`jest.Mocked<IEmailService>`).
  - [x] Actualizar el constructor de los tests (4 dependencias).
  - [x] Caso: tras un POST exitoso, `enviarBienvenida` se llama con `(credencial.correo, usuario.nombre)`.
  - [x] Caso: si el envío falla, el use case NO lanza (el fallo se loguea) y la verificación ya quedó hecha.
  - [x] Caso: si `buscarPorId` devuelve `null`, no se llama a `enviarBienvenida` y el flujo termina con éxito (defensivo).

### ResendEmailService 🔲

- [x] `tests/unit/adapters/out/email/resendEmail.service.test.ts`:
  - [x] `enviarBienvenida` envía al correo correcto con subject "Tu cuenta está activa — FadeForge" y HTML con "Hola {nombre}".
  - [x] Rechazo de Resend en la bienvenida → lanza `Error` con el mensaje del SDK.
  - [x] Logo 404 → `BadRequestError` (flujo compartido con `enviarVerificacion`).

### TemplateLoader 🔲

- [x] `tests/unit/adapters/out/email/templateLoader.test.ts`:
  - [x] Describe de `bienvenida`: renderiza "¡Tu cuenta está activa!" y "Hola {nombre}".
  - [x] Header con logo (`alt="FadeForge"`, `src` desde `{{logoUrl}}`) y footer con copyright.

### Mocks existentes 🔲

- [x] `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts`: agregar `enviarBienvenida: jest.fn()` al mock de `IEmailService`.
- [x] `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts`: agregar `enviarBienvenida: jest.fn()` al mock de `IEmailService`.

## Validación final 🔲

- [x] Ejecutar `npm test` y verificar que todos los tests pasan.
- [x] Ejecutar `npm run build` y verificar que compila sin errores (incluye `build:emails`).
- [x] Probar manualmente (feature ON): registrar cliente → confirmar con `POST /auth/confirmar` → recibir el correo de bienvenida con "Hola {nombre}" → verificar en logs que un fallo de envío no rompe el `200`.
- [x] Verificar que `GET /auth/confirmar` (read-only) NO dispara la bienvenida.
- [x] Verificar que reutilizar el token tras el POST responde 400 y no reenvía bienvenida.
- [x] `EMAIL_TEMPLATE=bienvenida npm run preview:email` para revisar el template.
- [x] Actualizar `spec/constitution/roadmap.md` (mover 006 a "Siguiente") al completar la implementación.
