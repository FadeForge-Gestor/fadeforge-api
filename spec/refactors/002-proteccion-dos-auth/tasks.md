# 002 · Lookup de tokens de verificación O(1) con SHA-256 — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

> El rate limiting por IP quedó fuera de este refactor: es una feature en el roadmap (spec propia).

## Domain

- [ ] Agregar `hashearToken(token): string` (sha256 hex) a `src/core/domain/email/verificationToken.ts`.

## Puerto

- [ ] `ITokenVerificacionRepository.crear` recibe el token en claro (param `tokenHash` → `token`).

## Schema y migración

- [ ] `prisma/schema.prisma`: `token_hash` `VarChar(60)` → `VarChar(64)` + `@unique`.
- [ ] Migración `lookup-token-sha256` (alter column + índice único).

## Repositorio

- [ ] `crear`: hashear con `hashearToken` y upsert.
- [ ] `buscarPorToken`: lazy deletion + `findUnique` por digest.
- [ ] `buscarTokenValido`: `findUnique` read-only (sin `deleteMany`).
- [ ] Quitar `import bcrypt` del repositorio.

## Use cases

- [ ] `registroCliente.usecase.ts`: pasar token en claro a `crear`; quitar `bcrypt.hash` del token (mantener el de la contraseña).
- [ ] `reenviarVerificacion.usecase.ts`: pasar token en claro a `crear`; quitar `bcrypt` por completo.

## Tests

- [ ] `tokenVerificacion.prisma.repository.test.ts`: sha256 real + `findUnique`; test de `crear` persistiendo digest; conservar lazy deletion y read-only.
- [ ] `reenviarVerificacion.usecase.test.ts`: quitar mock de bcrypt; `crear` con `expect.any(String)` y mismo token que el email.
- [ ] `registroCliente.usecase.test.ts`: aserción de `crear` con token en claro.

## Validación

- [ ] `npx tsc --noEmit` compila sin errores.
- [ ] `npm test` pasa.
- [ ] `spec/constitution/roadmap.md`: mover 002 a Hecho.
