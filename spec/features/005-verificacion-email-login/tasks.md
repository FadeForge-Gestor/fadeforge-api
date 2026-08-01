# 005 · Verificación de correo — control de acceso al login + link de confirmación — Tareas

_Checklist accionable derivada del `plan.md`._

## Parte 1 — Bloquear login sin correo verificado

### Entidad de dominio 🔲

- [ ] `src/core/domain/auth/auth.entity.ts`:
  - [ ] Agregar `emailVerificado: boolean` a `CredencialesAuth`.
  - [ ] Agregar `emailVerificado: boolean` a `usuario` en `LoginOutput`.

### Repositorio 🔲

- [ ] `src/adapters/out/db/auth/auth.prisma.repository.ts`:
  - [ ] Incluir `email_verificado: true` en el `select` del `findUnique` de `buscarPorCorreo`.
  - [ ] Mapearlo a `emailVerificado` en el retorno.

### Use case 🔲

- [ ] `src/core/usecases/auth/login.usecase.ts`:
  - [ ] Después de validar la contraseña y antes de emitir el JWT: si `env.EMAIL_VERIFICATION_ENABLED && !credenciales.emailVerificado` → `ForbiddenError('Debes verificar tu correo electrónico antes de iniciar sesión')`.
  - [ ] Incluir `emailVerificado: credenciales.emailVerificado` en el output del login exitoso (valor real de la BD).
  - [ ] Verificar que el flujo con la feature apagada no bloquea.

### Docs 🔲

- [ ] `src/adapters/in/http/auth/auth.docs.ts`:
  - [ ] Agregar la respuesta `403` al `POST /auth/login` (correo no verificado).

## Parte 2 — Link de confirmación al backend

### Configuración 🔲

- [ ] `src/config/env.ts`:
  - [ ] Agregar `API_URL: process.env.API_URL ?? \`http://localhost:${process.env.PORT ?? 3000}\``.
- [ ] `.env.template`:
  - [ ] Documentar `API_URL` como opcional (default dev local).

### Servicio de email 🔲

- [ ] `src/adapters/out/email/resendEmail.service.ts`:
  - [ ] Cambiar `const link = \`${env.FRONTEND_URL}/confirmar?token=${token}\`` por `\`${env.API_URL}/api/v1/auth/confirmar?token=${token}\``.

## Parte 3 — Lado admin: el admin avala la identidad

### Entidad de dominio 🔲

- [ ] `src/core/domain/usuario/usuario.entity.ts`:
  - [ ] Agregar `emailVerificado?: boolean` a `CrearUsuarioRepositoryInput` (opcional, default `false`).

### Repositorio 🔲

- [ ] `src/adapters/out/db/usuarios/usuarios.prisma.repository.ts`:
  - [ ] Persistir `email_verificado: input.emailVerificado ?? false` en el `credenciales_usuarios.create` de la transacción de `crear`.

### Use cases 🔲

- [ ] `src/core/usecases/usuarios/usuarios.usecase.ts`:
  - [ ] `crear` pasa `emailVerificado: true` (el admin avala la identidad).
- [ ] `src/core/usecases/auth/registroCliente.usecase.ts`:
  - [ ] Pasar `emailVerificado: false` explícito en la creación (self-service empieza sin verificar).

### Seed 🔲

- [ ] `prisma/seed.ts`:
  - [ ] El admin inicial crea su credencial con `email_verificado: true`.

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

## Tests 🔲

- [ ] `tests/unit/core/usecases/auth/login.usecase.test.ts`:
  - [ ] Agregar `emailVerificado: true` al `credencialesFake` existente (mantiene verdes los tests actuales).
  - [ ] Mockear `@config/env` (patrón de `resendEmail.service.test.ts`) para determinismo.
  - [ ] Caso nuevo: con `EMAIL_VERIFICATION_ENABLED=true` y `emailVerificado=false` → `ForbiddenError` y NO se emite token.
  - [ ] Caso nuevo: con `EMAIL_VERIFICATION_ENABLED=false` y `emailVerificado=false` → login exitoso (sin bloqueo).
  - [ ] Caso nuevo: login exitoso devuelve `usuario.emailVerificado === true`.
  - [ ] Caso nuevo: con `EMAIL_VERIFICATION_ENABLED=false` y `email_verificado=false` → login exitoso devuelve `usuario.emailVerificado === false` (valor real).
- [ ] `tests/unit/adapters/out/email/resendEmail.service.test.ts`:
  - [ ] Agregar `API_URL` al mock de `@config/env`.
  - [ ] Verificar que el link del correo apunta a `${API_URL}/api/v1/auth/confirmar?token=...`.
- [ ] `tests/unit/core/usecases/usuarios/usuarios.usecase.test.ts`:
  - [ ] Caso nuevo: `crear` llama al repo con `emailVerificado: true` (el admin avala).

## Validación final 🔲

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Ejecutar `npm run build` y verificar que compila sin errores.
- [ ] Probar manualmente (feature ON): registrar cliente → intentar login → 403 con mensaje → confirmar con el link del correo (visible como texto en el email) → login exitoso con `emailVerificado: true`. Crear usuario por admin (`POST /usuarios`) → login directo sin confirmar; admin del seed → login directo.
- [ ] Verificar que un token incorrecto responde 400 y no marca `email_verificado` (regresión del doble hash).
- [ ] Actualizar `spec/constitution/roadmap.md` (mover 005 a "Hecho") al completar la implementación.
