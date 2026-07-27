# 001 · Mover tipos de puertos a la capa de dominio — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

## Domain — Archivos nuevos

- [x] Crear `core/domain/auth/auth.entity.ts` con `LoginInput`, `LoginOutput`, `RegistroClienteInput`, `RegistroClienteOutput`, `CredencialesAuth`.
- [x] Crear `core/domain/storage/storage.entity.ts` con `ArchivoInput`, `ImagenSubida`.
- [x] Crear `core/domain/idempotency/idempotency.entity.ts` con `StoredResponse`.

## Domain — Archivos existentes

- [x] Agregar `CredencialRaw` a `core/domain/credencial/credencial.entity.ts`.
- [x] Agregar `VerificationTokenData` a `core/domain/email/verificationToken.ts`.

## Puertos de entrada

- [x] `ports/in/auth/IAuthUseCase.ts` — importar `LoginInput`, `LoginOutput` desde domain, eliminar definiciones inline.
- [x] `ports/in/auth/IRegistroClienteUseCase.ts` — importar `RegistroClienteInput`, `RegistroClienteOutput` desde domain, eliminar definiciones inline.
- [x] `ports/in/servicios/IServicioUseCase.ts` — importar `ArchivoInput` desde `@core/domain/storage/storage.entity` en vez de `@core/ports/out/storage/IStoragePort`.

## Puertos de salida

- [x] `ports/out/credenciales/ICredencialRepository.ts` — importar `CredencialRaw` desde domain, eliminar definición inline.
- [x] `ports/out/auth/IAuthRepository.ts` — importar `CredencialesAuth` desde domain, eliminar definición inline.
- [x] `ports/out/storage/IStoragePort.ts` — importar `ArchivoInput`, `ImagenSubida` desde domain, eliminar definiciones inline.
- [x] `ports/out/idempotency/IIdempotencyRepository.ts` — importar `StoredResponse` desde domain, eliminar definición inline.
- [x] `ports/out/email/ITokenVerificacionRepository.ts` — importar `VerificationTokenData` desde domain, reemplazar tipo anónimo.

## Adapters

- [x] `adapters/out/db/credenciales/credenciales.prisma.repository.ts` — importar `CredencialRaw` desde `@core/domain/credencial/credencial.entity`.
- [x] `adapters/out/db/auth/auth.prisma.repository.ts` — importar `CredencialesAuth` desde `@core/domain/auth/auth.entity`.

## Validación

- [x] Ejecutar `npx tsc --noEmit` y verificar que compila sin errores.
- [x] Ejecutar `npm test` y verificar que todos los tests pasan (270/270).
- [x] No hay cambios de comportamiento — es refactor puro.
