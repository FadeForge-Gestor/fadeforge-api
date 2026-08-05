# 002 · Protección anti-DoS en el flujo de verificación de correo

**Estado:** propuesta

## Qué hace

Refactor de dos niveles sobre los endpoints públicos de auth para cerrar los vectores de abuso (DDoS) que hoy permiten gastar dinero y CPU sin control:

1. **Rate limiting por IP** en `POST /registro`, `GET+POST /confirmar` y `POST /reenviar-verificacion` (hoy solo el login tiene límites).
2. **Lookup de tokens O(1) con SHA-256** en vez del escaneo O(N) con bcrypt que hace hoy `buscarPorToken`/`buscarTokenValido`.

## Por qué

El flujo de negocio está correcto (registro con correo duplicado → 409; la verificación solo se envía a cuentas nuevas; reenvío limitado a 3/día por usuario; el token expira a las 24h y se regenera). El problema no es la lógica sino la **superficie de abuso**:

| Vector | Evidencia | Riesgo |
|--------|-----------|--------|
| `POST /registro` sin rate limit | `auth.routes.ts:66` (solo `validate`) | Un bot crea cuentas con emails falsos en bucle → un email de Resend por cada una (**plata por email**) + `bcrypt.hash` cost-10 por request (CPU) |
| `GET+POST /confirmar` sin rate limit + lookup O(N) de bcrypt | `tokenVerificacion.prisma.repository.ts:22-36` y `38-49`: `findMany()` de TODOS los tokens + `bcrypt.compare` a cada uno | Un request barato dispara N compares cost-10 → **amplificación de CPU** que crece con la base de usuarios |
| `POST /reenviar-verificacion` sin cap por IP | `auth.routes.ts:70` (solo middleware de idempotencia, que requiere header `Idempotency-Key` que un bot no manda) | El tope 3/día es **por usuario**; con N cuentas reales el atacante dispara N×3 emails |

El login ya está cubierto: `authRateLimit` (IP) + `userLoginRateLimit` (por correo) + lockout en PostgreSQL (feature 001).

## Nivel 1 — Rate limiting por IP

- `POST /registro`: limiter estricto (5 req / 15 min por IP) — corta el grifo de creación de cuentas y de envíos de Resend.
- `GET+POST /confirmar`: limiter (30 req / 15 min por IP, contador compartido entre GET y POST) — con el lookup O(1) del Nivel 2 el request es barato; el límite evita el spray masivo.
- `POST /reenviar-verificacion`: limiter (5 req / 15 min por IP) — complementa el 3/día por usuario.

Reutiliza `express-rate-limit` (ya instalado) con el mismo patrón de `authRateLimit`/`userLoginRateLimit`.

## Nivel 2 — Lookup de tokens O(1) con SHA-256

Hoy el token se persiste como **hash bcrypt** y se busca **comparando contra todos los tokens** (`findMany` + `bcrypt.compare` en loop): O(N) de bcrypt cost-10 por request. Inaceptable como superficie de DoS y empeora a medida que crece la base.

El token es un `randomUUID()` (122 bits de entropía, no es una contraseña). Para un valor de alta entropía un digest **SHA-256** tiene la misma resistencia a preimagen que bcrypt, pero permite buscar por **índice único** en O(1). El hashing pasa a ser **responsabilidad del repositorio** (persistencia), no de los use cases.

- `tokens_verificacion.token_hash`: `VarChar(60)` → `VarChar(64)` con **índice único**.
- `buscarPorToken`/`buscarTokenValido`: `findUnique({ where: { token_hash: sha256(token) } })`.
- `crear` recibe el token **en claro** y hashea internamente (el use case no conoce el formato de persistencia).

## Criterios de aceptación

- [ ] `POST /registro` responde 429 con más de 5 requests en 15 min desde la misma IP.
- [ ] `GET` y `POST /confirmar` comparten un contador y responden 429 superando 30 requests/15 min por IP.
- [ ] `POST /reenviar-verificacion` responde 429 superando 5 requests/15 min por IP (sin romper el 3/día por usuario existente).
- [ ] `buscarPorToken` y `buscarTokenValido` hacen un único `findUnique` por digest (sin `findMany` ni loop de `bcrypt.compare`).
- [ ] `tokens_verificacion.token_hash` es `VarChar(64)` con índice único en la migración.
- [ ] El repositorio hashea con SHA-256; ningún use case hashea tokens (se elimina `bcrypt.hash` del token en `registroCliente` y `reenviarVerificacion`).
- [ ] La limpieza lazy de tokens expirados se conserva en `buscarPorToken` (POST) y no existe en `buscarTokenValido` (GET read-only).
- [ ] Swagger documenta la respuesta `429` en los tres endpoints.
- [ ] `npm test` pasa (mocks de `crear` reciben el token en claro; tests del repo con SHA-256 real en vez de bcrypt).
- [ ] `npx tsc --noEmit` compila sin errores.

## Fuera de alcance

- **Nivel 3 — Anti-enumeración en `POST /reenviar-verificacion`** (el 404 actual filtra correos registrados → oráculo de emails). Queda documentado en `constitution/roadmap.md` como refactor futuro.
- Idempotencia del `POST /confirmar` ante reintentos (replay → 200 en vez de 400): defecto cosmético de UX, sin impacto en seguridad ni costos. Fuera de este refactor.
- Persistencia de los contadores de rate limit en PostgreSQL/Redis (los limiters quedan en memoria, como los de login).
- Aplicar rate limiting a otros dominios fuera de auth.

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
| `src/adapters/in/http/middlewares/rate-limit.middleware.ts` | 3 limiters nuevos (registro, confirmar, reenviar) |
| `src/adapters/in/http/auth/auth.routes.ts` | aplicar los 3 limiters |
| `src/adapters/in/http/auth/auth.docs.ts` | respuesta `429` en los 3 endpoints |
| tests | repo test (SHA-256 + `findUnique`), use cases (token en claro), rate-limit (3 limiters) |
