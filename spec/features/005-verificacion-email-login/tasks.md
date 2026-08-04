# 005 · Verificación de correo — control de acceso al login + link de confirmación — Tareas

_Checklist accionable derivada del `plan.md`._

## Parte 1 — Bloquear login sin correo verificado

### Entidad de dominio ✅

- [x] `src/core/domain/auth/auth.entity.ts`:
  - [x] Agregar `emailVerificado: boolean` a `CredencialesAuth`.
  - [x] Agregar `emailVerificado: boolean` a `usuario` en `LoginOutput`.

### Repositorio ✅

- [x] `src/adapters/out/db/auth/auth.prisma.repository.ts`:
  - [x] Incluir `email_verificado: true` en el `select` del `findUnique` de `buscarPorCorreo`.
  - [x] Mapearlo a `emailVerificado` en el retorno.

### Use case ✅

- [x] `src/core/usecases/auth/login.usecase.ts`:
  - [x] Después de validar la contraseña y antes de emitir el JWT: si `env.EMAIL_VERIFICATION_ENABLED && !credenciales.emailVerificado` → `ForbiddenError('Debes verificar tu correo electrónico antes de iniciar sesión')`.
  - [x] Incluir `emailVerificado: credenciales.emailVerificado` en el output del login exitoso (valor real de la BD).
  - [x] Verificar que el flujo con la feature apagada no bloquea.

### Docs ✅

- [x] `src/adapters/in/http/auth/auth.docs.ts`:
  - [x] Agregar la respuesta `403` al `POST /auth/login` (correo no verificado).

## Parte 2 — Link de confirmación al backend

### Configuración ✅

- [x] `src/config/env.ts`:
  - [x] Agregar `API_URL: process.env.API_URL ?? \`http://localhost:${process.env.PORT ?? 3000}\``.
- [x] `.env.template`:
  - [x] Documentar `API_URL` como opcional (default dev local).

### Servicio de email ✅

- [x] `src/adapters/out/email/resendEmail.service.ts`:
  - [x] Cambiar `const link = \`${env.FRONTEND_URL}/confirmar?token=${token}\`` por `\`${env.API_URL}/api/v1/auth/confirmar?token=${token}\``.

## Parte 3 — Lado admin: el admin avala la identidad

### Entidad de dominio ✅

- [x] `src/core/domain/usuario/usuario.entity.ts`:
  - [x] Agregar `emailVerificado?: boolean` a `CrearUsuarioRepositoryInput` (opcional, default `false`).

### Repositorio ✅

- [x] `src/adapters/out/db/usuarios/usuarios.prisma.repository.ts`:
  - [x] Persistir `email_verificado: input.emailVerificado ?? false` en el `credenciales_usuarios.create` de la transacción de `crear`.

### Use cases ✅

- [x] `src/core/usecases/usuarios/usuarios.usecase.ts`:
  - [x] `crear` pasa `emailVerificado: true` (el admin avala la identidad).
- [x] `src/core/usecases/auth/registroCliente.usecase.ts`:
  - [x] Pasar `emailVerificado: false` explícito en la creación (self-service empieza sin verificar).

### Seed ✅

- [x] `prisma/seed.ts`:
  - [x] El admin inicial crea su credencial con `email_verificado: true`.

## Parte 4 — Corregir la validación del token (doble hash de bcrypt)

### Contrato del repositorio ✅

- [x] `src/core/ports/out/email/ITokenVerificacionRepository.ts`:
  - [x] Renombrar `buscarPorTokenHash(tokenHash)` → `buscarPorToken(token: string)` (recibe el token en claro).

### Repositorio ✅

- [x] `src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts`:
  - [x] Comparar el token raw contra `token.token_hash` con `bcrypt.compare` (sin re-hashear).

### Use case ✅

- [x] `src/core/usecases/auth/confirmarEmail.usecase.ts`:
  - [x] Eliminar `const tokenHash = await bcrypt.hash(token, 10);` (línea 15).
  - [x] Llamar `buscarPorToken(token)` con el token en claro.

### Tests ✅

- [x] Renombrar el mock `buscarPorTokenHash` → `buscarPorToken` en:
  - [x] `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts`.
  - [x] `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts`.
  - [x] `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts`.
- [x] `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts`:
  - [x] Aserción de que el repo recibe el token SIN hashear (`toHaveBeenCalledWith('token-plano-123')`).
  - [x] Quitar `jest.mock('bcrypt')` (el use case deja de usar bcrypt).
- [x] NUEVO `tests/unit/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.test.ts`:
  - [x] Con bcrypt REAL (solo mockear `prisma`): `buscarPorToken` encuentra el registro con el token correcto.
  - [x] Con un token incorrecto devuelve `null`.

### Plantilla del correo ✅ (commit `000abe7`)

- [x] `src/adapters/out/email/templates/verificacion.mjml`:
  - [x] Link de confirmación visible como texto bajo el botón (fallback para probar el endpoint sin frontend).
  - [x] `verificacion.html` regenerado con MJML (`npm run build:emails`).
- [x] `tests/unit/adapters/out/email/templateLoader.test.ts`:
  - [x] Test de que el link se renderiza como texto visible.

## Parte 5 — Semántica HTTP: POST consume, GET valida ✅ (commit `1a96dee`)

### Schema Zod ✅

- [x] `src/adapters/in/http/auth/auth.schema.ts`:
  - [x] Nuevo `confirmarEmailSchema = z.object({ token: z.string().min(1, 'El token es requerido') })`.
  - [x] SOLO token, sin contraseña — la contraseña la valida el login, no la confirmación (decisión en `plan.md`).

### Puerto de entrada ✅

- [x] NUEVO `src/core/ports/in/auth/IValidarTokenVerificacionUseCase.ts`:
  - [x] `validar(token: string): Promise<{ valido: boolean }>`.

### Use case ✅

- [x] NUEVO `src/core/usecases/auth/validarTokenVerificacion.usecase.ts`:
  - [x] `ValidarTokenVerificacionUseCase`: busca con `buscarTokenValido`, chequea expiración, devuelve `{ valido }`.
  - [x] CERO efectos: no elimina, no actualiza (read-only).

### Repositorio ✅

- [x] `src/core/ports/out/email/ITokenVerificacionRepository.ts`:
  - [x] Método read-only `buscarTokenValido(token)`.
- [x] `src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts`:
  - [x] `buscarTokenValido`: mismo `bcrypt.compare`, sin `deleteMany` ni consumo.

### Controller ✅

- [x] `src/adapters/in/http/auth/auth.controller.ts`:
  - [x] `confirmarEmail` (GET) → `validar` → 200 `{ valido: true }` o 400. Sin token en la respuesta.
  - [x] `confirmarEmailPost` (POST) → `confirmar(req.body.token)` → 200 `{ mensaje }`. Sin token en la respuesta.

### Routes ✅

- [x] `src/adapters/in/http/auth/auth.routes.ts`:
  - [x] `POST /confirmar` con `validate(confirmarEmailSchema)`.
  - [x] El GET se mantiene (magic link), ahora read-only.

### Docs ✅

- [x] `src/adapters/in/http/auth/auth.docs.ts`:
  - [x] Swagger `POST /auth/confirmar` (requestBody `{ token }`, respuestas 200/400).
  - [x] GET documentado como validación read-only (200 con `{ valido }`).

### Tests ✅

- [x] `tests/unit/adapters/in/http/auth/auth.schema.test.ts`:
  - [x] `confirmarEmailSchema`: token válido pasa; vacío/faltante falla.
- [x] NUEVO `tests/unit/core/usecases/auth/validarTokenVerificacion.usecase.test.ts`:
  - [x] Token válido → `{ valido: true }`.
  - [x] Token expirado → `{ valido: false }`.
  - [x] Token inexistente → `{ valido: false }`.
  - [x] NUNCA llama a `eliminarPorIdUsuario` ni `actualizarEmailVerificado` (read-only).
- [x] `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts`:
  - [x] Caso: tras un POST exitoso el token se eliminó (reuso → 400).

## Parte 6 — Rechazos de Resend visibles (Opción C) ✅ (commit `f2ee0a5`)

- [x] `src/adapters/out/email/resendEmail.service.ts`:
  - [x] Si `respuesta.error` viene poblado → `throw new Error('Resend rechazó el envío a ...: ...')`.
- [x] `src/core/usecases/auth/registroCliente.usecase.ts`:
  - [x] `catch {}` → `console.error('Error al enviar el correo de verificación a ...:', error)` (el registro sigue teniendo éxito).
- [x] `src/core/usecases/auth/reenviarVerificacion.usecase.ts`:
  - [x] `catch {}` → `console.error(...)` (el reenvío sigue teniendo éxito).
- [x] Tests (3):
  - [x] `resendEmail.service.test.ts`: el servicio lanza cuando `respuesta.error` viene poblado.
  - [x] `registroCliente.usecase.test.ts` y `reenviarVerificacion.usecase.test.ts`: el fallo de envío se loguea y no revienta el use case.

## Parte 7 — Template con logo y sin token expuesto ✅ (commit `3ce59e3`)

- [x] `partials/header.mjml`:
  - [x] Reemplazar el texto "FadeForge" por `{{logoUrl}}` (logo dorado sobre la barra negra, 140px, recortado on-the-fly).
- [x] `verificacion.mjml`:
  - [x] Eliminar el fallback de la Parte 4 ("Copia y pega este enlace" con el link/token en claro). El token viaja SOLO en el `href` del botón.
  - [x] Nota bajo el botón: "El Token es de un solo uso y expira en {{horasExpiracion}} horas." (movida del footer al card, junto al CTA).
- [x] `partials/footer.mjml`:
  - [x] Sacar la línea de expiración (ahora en el card); queda el aviso de ignorar + copyright.
- [x] `scripts/preview-email.mjs`:
  - [x] Override `EMAIL_LOGO_URL` (no toca el `.env`) y link de muestra para que el botón se vea real en el preview.
- [x] `.env` (no se commitea):
  - [x] `LOGO_URL` apunta a la versión recortada de Cloudinary (`c_crop,x_202,y_54,w_273,h_262`) — el asset original (677x369) tiene el logo (273x262) centrado con mucho margen transparente.

## Tests ✅

- [x] `tests/unit/core/usecases/auth/login.usecase.test.ts`:
  - [x] Agregar `emailVerificado: true` al `credencialesFake` existente (mantiene verdes los tests actuales).
  - [x] Mockear `@config/env` (patrón de `resendEmail.service.test.ts`) para determinismo.
  - [x] Caso nuevo: con `EMAIL_VERIFICATION_ENABLED=true` y `emailVerificado=false` → `ForbiddenError` y NO se emite token.
  - [x] Caso nuevo: con `EMAIL_VERIFICATION_ENABLED=false` y `emailVerificado=false` → login exitoso (sin bloqueo).
  - [x] Caso nuevo: login exitoso devuelve `usuario.emailVerificado === true`.
  - [x] Caso nuevo: con `EMAIL_VERIFICATION_ENABLED=false` y `email_verificado=false` → login exitoso devuelve `usuario.emailVerificado === false` (valor real).
- [x] `tests/unit/adapters/out/email/resendEmail.service.test.ts`:
  - [x] Agregar `API_URL` al mock de `@config/env`.
  - [x] Verificar que el link del correo apunta a `${API_URL}/api/v1/auth/confirmar?token=...`.
- [x] `tests/unit/core/usecases/usuarios/usuarios.usecase.test.ts`:
  - [x] Caso nuevo: `crear` llama al repo con `emailVerificado: true` (el admin avala).

## Validación final ✅

- [x] Ejecutar `npm test` y verificar que todos los tests pasan.
- [x] Ejecutar `npm run build` y verificar que compila sin errores.
- [x] Probar manualmente (feature ON): registrar cliente → intentar login → 403 con mensaje → `POST /auth/confirmar` con `{ token }` del correo → login exitoso con `emailVerificado: true`. Crear usuario por admin (`POST /usuarios`) → login directo sin confirmar; admin del seed → login directo.
- [x] Verificar que `POST /auth/confirmar` solo pide token: enviar el body con una `contrasena` extra no cambia el comportamiento y la confirmación no depende de ella (la contraseña es responsabilidad exclusiva del login).
- [x] Verificar que `GET /auth/confirmar?token=...` valida SIN mutar: responde `{ valido: true }` y `email_verificado` sigue `false` en BD (read-only).
- [x] Verificar que reutilizar el mismo token tras un POST exitoso responde 400 (un solo uso).
- [x] Verificar que un token incorrecto responde 400 y no marca `email_verificado` (regresión del doble hash).
- [x] Actualizar `spec/constitution/roadmap.md` (mover 005 a "Hecho") al completar la implementación.
