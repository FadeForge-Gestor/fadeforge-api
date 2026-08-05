# 002 · Lookup de tokens de verificación O(1) con SHA-256 — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Refactor de persistencia siguiendo el orden inside-out del proyecto (domain → puerto → schema/migración → repo → use case → tests). El rate limiting por IP (dependiente de `trust proxy`, firewall de origen y con limitaciones estructurales: CGNAT, botnets, rotación de IPs) NO es parte de este refactor: quedó como feature en el roadmap.

---

## Implementación

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

## Orden de implementación

1. Domain: `hashearToken` en `verificationToken.ts`.
2. Puerto: param de `crear` → token en claro.
3. Schema + migración (`npx prisma migrate dev --name lookup-token-sha256`).
4. Repositorio: SHA-256 + `findUnique` + quitar bcrypt.
5. Use cases: `registroCliente` y `reenviarVerificacion` sin hasheo de token.
6. Tests.
7. `npx tsc --noEmit` + `npm test`.
8. Actualizar `constitution/roadmap.md` (002 → Hecho).

## Decisiones

| Decisión | Por qué |
|----------|---------|
| **SHA-256 en vez de bcrypt para el token** | El token es un UUID de 122 bits: alta entropía, no es una contraseña → la resistencia a preimagen de SHA-256 alcanza, y permite lookup por índice único O(1). bcrypt para tokens aleatorios aporta seguridad nula y obliga al escaneo O(N) que es el vector de DoS. |
| **El repositorio es dueño del hashing** | Es un detalle de persistencia; el use case opera con el token del dominio (en claro) y no debe conocer el formato de almacenamiento. `crear` recibe el token, no el hash. |
| **Rate limiting por IP fuera de alcance** | Movido al roadmap como feature: depende de `trust proxy`, firewall de origen y tiene limitaciones estructurales (CGNAT, botnets, rotación de IPs) que merecen spec propia. |

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| **Tokens bcrypt existentes quedan inválidos** | Los usuarios reenvían con `POST /reenviar-verificacion` (flujo ya existente). Migración aditiva sin riesgo de datos. |
| **`crear` cambia de semántica (hash → claro)** | Es un refactor explícito de contrato, no aditivo: se actualizan los 2 use cases y los 3 archivos de test que lo tocan. |
| **El vector de dinero (spray de emails en `/registro`) sigue abierto** | El rate limit por IP que lo cerraba quedó como feature en el roadmap. Este refactor solo cierra la amplificación de CPU del `/confirmar`. |

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
| `tests/unit/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.test.ts` | SHA-256 real + `findUnique` + test de `crear` |
| `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts` | sin mock de bcrypt; `crear` con token en claro |
| `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts` | aserción `crear` con token en claro |
