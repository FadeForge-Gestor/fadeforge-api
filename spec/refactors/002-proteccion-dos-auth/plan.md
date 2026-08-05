# 002 · Protección anti-DoS en el flujo de verificación de correo — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Dos niveles independientes pero complementarios: rate limiting por IP (capa HTTP, sin tocar dominio) y lookup O(1) de tokens (infraestructura de persistencia). Ambos siguen el orden inside-out del proyecto (domain → puerto → repo → use case → schema/controller/routes → docs → tests).

---

## Parte 1 — Lookup de tokens O(1) con SHA-256

### 1. Entidad de dominio

`src/core/domain/email/verificationToken.ts` — nuevo helper:

```typescript
import { createHash } from 'crypto';

export function hashearToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
```

### 2. Puerto de salida

`src/core/ports/out/email/ITokenVerificacionRepository.ts` — `crear` pasa a recibir el token en claro (cambia el nombre del param, no la firma del método):

```typescript
crear(idUsuario: number, token: string, expiraEn: Date): Promise<void>;
```

Los use cases ya no hashean: `buscarPorToken(token)` y `buscarTokenValido(token)` siguen recibiendo el token en claro (sin cambios de firma).

### 3. Schema + migración

`prisma/schema.prisma` — `tokens_verificacion`:

```prisma
token_hash String   @unique @db.VarChar(64)
```

Migración (aditiva, no toca datos): `ALTER COLUMN token_hash SET DATA TYPE VARCHAR(64)` + `CREATE UNIQUE INDEX tokens_verificacion_token_hash_key`.

> Los hashes bcrypt existentes (60 chars) caben en `VARCHAR(64)` pero dejarán de resolver contra el nuevo lookup sha256 → los tokens en vuelo quedan inválidos; los usuarios afectados reenvían (flujo ya cubierto por `POST /reenviar-verificacion`).

### 4. Repositorio

`src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts`:

- `crear(idUsuario, token, expiraEn)` → `const tokenHash = hashearToken(token)` + upsert (igual).
- `buscarPorToken(token)` → `deleteMany` lazy de expirados (se conserva) + `findUnique({ where: { token_hash: hashearToken(token) } })`.
- `buscarTokenValido(token)` → `findUnique` directo, SIN `deleteMany` (read-only, igual que hoy).
- Se elimina `import bcrypt`.

### 5. Use cases

- `registroCliente.usecase.ts`: quitar `const tokenHash = await bcrypt.hash(token, 10);` → `crear(usuario.id, token, expiraEn)`. Se mantiene `bcrypt.hash` de la CONTRASEÑA.
- `reenviarVerificacion.usecase.ts`: quitar `bcrypt` por completo → `crear(usuario.id, token, expiraEn)`.

### 6. Tests

- `tokenVerificacion.prisma.repository.test.ts`: reemplazar bcrypt real por `hashearToken`; mockear `findUnique` en vez de `findMany`; asertar que `buscarPorToken` llama `findUnique({ where: { token_hash: <digest> } })`; test nuevo de `crear` (persiste el digest sha256); se conservan los tests de lazy deletion y read-only.
- `reenviarVerificacion.usecase.test.ts`: quitar `jest.mock('bcrypt')`; aserción de `crear` pasa a `(1, expect.any(String), expect.any(Date))` y el token enviado por email es el mismo que se persiste.
- `registroCliente.usecase.test.ts`: aserción de `crear` con token en claro (bcrypt sigue mockeado para la contraseña).

---

## Parte 2 — Rate limiting por IP

### 7. Middleware

`src/adapters/in/http/middlewares/rate-limit.middleware.ts` — tres limiters nuevos con el patrón de `authRateLimit` (misma estructura `standardHeaders: 'draft-8'`, `legacyHeaders: false`, mensaje `{ status, message }`):

| Limiter | windowMs | limit | key | Endpoint |
|---------|----------|-------|-----|----------|
| `registroRateLimit` | 15 min | 5 | IP | `POST /registro` |
| `confirmarEmailRateLimit` | 15 min | 30 | IP | `GET+POST /confirmar` (contador compartido) |
| `reenviarRateLimit` | 15 min | 5 | IP | `POST /reenviar-verificacion` |

### 8. Routes

`src/adapters/in/http/auth/auth.routes.ts` — aplicar los limiters ANTES de `validate`:

```typescript
router.post('/registro', registroRateLimit, validate(registroClienteSchema), ...);
router.get('/confirmar', confirmarEmailRateLimit, ...);
router.post('/confirmar', confirmarEmailRateLimit, validate(confirmarEmailSchema), ...);
router.post('/reenviar-verificacion', reenviarRateLimit, idempotency(idempotencyRepo), ...);
```

### 9. Docs

`src/adapters/in/http/auth/auth.docs.ts` — respuesta `429` (Too Many Requests, ref `ErrorResponse`) en `POST /registro`, `GET+POST /confirmar` y `POST /reenviar-verificacion`.

### 10. Tests

`rate-limit.middleware.test.ts` — tres `describe` nuevos espejando el de `authRateLimit` (índices `capturedConfigs[2..4]`): window 15 min, límite esperado, mensaje en español con mención del tiempo, `legacyHeaders: false`.

---

## Orden de implementación

1. Domain: `hashearToken` en `verificationToken.ts`.
2. Puerto: param de `crear` → token en claro.
3. Schema + migración (`npx prisma migrate dev --name lookup-token-sha256`).
4. Repositorio: SHA-256 + `findUnique` + quitar bcrypt.
5. Use cases: `registroCliente` y `reenviarVerificacion` sin hasheo de token.
6. Tests de dominio/repo/use cases (Parte 1).
7. Middleware de rate limit (3 limiters).
8. Routes + docs.
9. Tests de rate limit.
10. `npx tsc --noEmit` + `npm test`.
11. Actualizar `constitution/roadmap.md` (002 → Hecho; nivel 3 → Backlog).

## Decisiones

| Decisión | Por qué |
|----------|---------|
| **SHA-256 en vez de bcrypt para el token** | El token es un UUID de 122 bits: alta entropía, no es una contraseña → la resistencia a preimagen de SHA-256 alcanza, y permite lookup por índice único O(1). bcrypt para tokens aleatorios aporta seguridad nula y obliga al escaneo O(N) que es el vector de DoS. |
| **El repositorio es dueño del hashing** | Es un detalle de persistencia; el use case opera con el token del dominio (en claro) y no debe conocer el formato de almacenamiento. `crear` recibe el token, no el hash. |
| **Límites 5/30/5 por IP** | Valores conservadores alineados con el login (10/5): registro y reenvío protegen dinero (Resend), confirmar es barato tras el Nivel 2. Ajustables vía constantes del middleware. |
| **Contador compartido GET+POST /confirmar** | Ambas rutas gastan el mismo recurso (lookup de token); un solo contador por IP evita el bypass alternando verbos. |
| **Limiters en memoria (como login)** | Sin Redis ni tabla nueva: suficiente para una instancia. Los contadores se resetan al reiniciar — tradeoff documentado, igual que en feature 001. |
| **`trust proxy` fuera de alcance** | El keyGenerator por IP asume conexión directa; detrás de un reverse proxy habría que configurar `app.set('trust proxy', ...)`. Se deja anotado como riesgo, no se implementa. |

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| **Tokens bcrypt existentes quedan inválidos** | Los usuarios reenvían con `POST /reenviar-verificacion` (flujo ya existente). Migración aditiva sin riesgo de datos. |
| **Rate limit rompe flujos legítimos** | Límites conservadores (registro 5, confirmar 30) + mensajes 429 descriptivos. |
| **`crear` cambia de semántica (hash → claro)** | Es un refactor explícito de contrato, no aditivo: se actualizan los 2 use cases y los 3 archivos de test que lo tocan. |
| **IP falsificada / proxy** | Sin `trust proxy` el keyGenerator usa `req.ip` directo; detrás de nginx/load balancer hay que configurarlo (anotado, fuera de alcance). |
| **Nivel 3 (enumeración) queda pendiente** | Documentado en roadmap; no bloquea los niveles 1-2. |

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | `token_hash` `VarChar(60)` → `VarChar(64)` + `@unique` |
| migración nueva (`lookup-token-sha256`) | Alter column + índice único |
| `src/core/domain/email/verificationToken.ts` | `hashearToken` (sha256 hex) |
| `src/core/ports/out/email/ITokenVerificacionRepository.ts` | `crear` recibe token en claro |
| `src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts` | SHA-256 + `findUnique` O(1); sin bcrypt |
| `src/core/usecases/auth/registroCliente.usecase.ts` | token en claro a `crear`; sin `bcrypt.hash` de token |
| `src/core/usecases/auth/reenviarVerificacion.usecase.ts` | token en claro a `crear`; sin bcrypt |
| `src/adapters/in/http/middlewares/rate-limit.middleware.ts` | `registroRateLimit`, `confirmarEmailRateLimit`, `reenviarRateLimit` |
| `src/adapters/in/http/auth/auth.routes.ts` | aplicar los 3 limiters |
| `src/adapters/in/http/auth/auth.docs.ts` | respuesta `429` en 3 endpoints |
| `tests/unit/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.test.ts` | SHA-256 real + `findUnique` + test de `crear` |
| `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts` | sin mock de bcrypt; `crear` con token en claro |
| `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts` | aserción `crear` con token en claro |
| `tests/unit/adapters/in/http/middlewares/rate-limit.middleware.test.ts` | 3 describes nuevos |
