# 002 · Lookup de tokens de verificación O(1) con SHA-256

**Estado:** propuesta

## Qué hace

Refactor del lookup de tokens de verificación de correo (`buscarPorToken`/`buscarTokenValido`) para pasar del escaneo O(N) con bcrypt a un `findUnique` O(1) por digest SHA-256 con índice único. Cierra la amplificación de CPU que convierte a `GET+POST /confirmar` en un vector de DoS barato de disparar.

## Por qué

Hoy el token se persiste como **hash bcrypt** y se busca **comparando contra todos los tokens**: `tokenVerificacion.prisma.repository.ts:22-36` y `38-49` hacen `findMany()` + `bcrypt.compare` cost-10 en loop. Un request barato a `/confirmar` (endpoint público, sin auth) dispara N compares cost-10 → **amplificación de CPU que crece con la base de usuarios**.

El token es un `randomUUID()` (122 bits de entropía, no es una contraseña). Para un valor de alta entropía un digest **SHA-256** tiene la misma resistencia a preimagen que bcrypt, pero permite buscar por **índice único** en O(1). El hashing pasa a ser **responsabilidad del repositorio** (persistencia), no de los use cases.

## Cambios

- `tokens_verificacion.token_hash`: `VarChar(60)` → `VarChar(64)` con **índice único**.
- `buscarPorToken`/`buscarTokenValido`: `findUnique({ where: { token_hash: sha256(token) } })` — un request = un lookup, no N.
- `crear` recibe el token **en claro** y hashea internamente (el use case no conoce el formato de persistencia).
- Se elimina `bcrypt` del repositorio y de los use cases que hasheaban tokens.

## Criterios de aceptación

- [ ] `buscarPorToken` y `buscarTokenValido` hacen un único `findUnique` por digest (sin `findMany` ni loop de `bcrypt.compare`).
- [ ] `tokens_verificacion.token_hash` es `VarChar(64)` con índice único en la migración.
- [ ] El repositorio hashea con SHA-256; ningún use case hashea tokens (se elimina `bcrypt.hash` del token en `registroCliente` y `reenviarVerificacion`).
- [ ] La limpieza lazy de tokens expirados se conserva en `buscarPorToken` (POST) y no existe en `buscarTokenValido` (GET read-only).
- [ ] `npm test` pasa (mocks de `crear` reciben el token en claro; tests del repo con SHA-256 real en vez de bcrypt).
- [ ] `npx tsc --noEmit` compila sin errores.

## Fuera de alcance

- **Rate limiting por IP** en `POST /registro`, `GET+POST /confirmar` y `POST /reenviar-verificacion` — movido al roadmap como feature futura (requiere `trust proxy`, firewall de origen y tiene limitaciones estructurales: CGNAT, botnets, rotación de IPs).
- **Anti-enumeración en `POST /reenviar-verificacion`** (el 404 actual filtra correos registrados → oráculo de emails). Documentado en `constitution/roadmap.md` como refactor futuro.
- Idempotencia del `POST /confirmar` ante reintentos (replay → 200 en vez de 400): defecto cosmético de UX, sin impacto en seguridad ni costos. Fuera de este refactor.
- Persistencia de contadores de rate limit en PostgreSQL/Redis.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | `token_hash` `VarChar(60)` → `VarChar(64)` + `@unique` |
| migración nueva | `ALTER COLUMN token_hash` + índice único |
| `src/core/domain/email/verificationToken.ts` | helper `hashearToken(token): string` (SHA-256 hex) |
| `src/core/ports/out/email/ITokenVerificacionRepository.ts` | `crear` recibe el token en claro (`tokenHash` → `token`) |
| `src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts` | hashear con SHA-256; `findUnique` O(1); quitar `bcrypt` |
| `src/core/usecases/auth/registroCliente.usecase.ts` | token en claro a `crear`; quitar `bcrypt.hash` del token |
| `src/core/usecases/auth/reenviarVerificacion.usecase.ts` | idem; quitar `bcrypt` por completo |
| tests | repo test (SHA-256 + `findUnique`), use cases (token en claro) |
