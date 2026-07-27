# 001 · Mover tipos de puertos a la capa de dominio

**Estado:** propuesta

## Qué hace

Refactor de arquitectura hexagonal para mover todos los tipos (interfaces, DTOs, read models) que están definidos inline en los puertos hacia la capa de dominio (`core/domain/`). Los puertos solo deben IMPORTAR tipos desde domain, nunca definirlos.

## Por qué

El patrón establecido en el proyecto es:
- `IUsuarioRepository` importa `Usuario` desde `@core/domain/usuario/usuario.entity`
- `IRolRepository` importa `Rol` desde `@core/domain/rol/rol.entity`

Pero 7 puertos rompen este patrón definiendo tipos inline. Esto viola SRP (el puerto tiene dos responsabilidades: contrato + definición de tipo) y dificulta el reuso de los tipos entre capas.

## Violaciones encontradas

| # | Puerto | Tipo(s) inline | Domain destino |
|---|--------|---------------|----------------|
| 1 | `ports/in/auth/IAuthUseCase.ts` | `LoginInput`, `LoginOutput` | `domain/auth/auth.entity.ts` |
| 2 | `ports/in/auth/IRegistroClienteUseCase.ts` | `RegistroClienteInput`, `RegistroClienteOutput` | `domain/auth/auth.entity.ts` |
| 3 | `ports/out/credenciales/ICredencialRepository.ts` | `CredencialRaw` | `domain/credencial/credencial.entity.ts` |
| 4 | `ports/out/auth/IAuthRepository.ts` | `CredencialesAuth` | `domain/auth/auth.entity.ts` |
| 5 | `ports/out/storage/IStoragePort.ts` | `ArchivoInput`, `ImagenSubida` | `domain/storage/storage.entity.ts` |
| 6 | `ports/out/idempotency/IIdempotencyRepository.ts` | `StoredResponse` | `domain/idempotency/idempotency.entity.ts` |
| 7 | `ports/out/email/ITokenVerificacionRepository.ts` | `{ idUsuario, expiraEn }` (anónimo) | `domain/email/verificationToken.ts` |

Adicionalmente:
| 8 | `ports/in/servicios/IServicioUseCase.ts` | Cross-port import (`IStoragePort`) | `ArchivoInput` debe vivir en domain |

## Criterios de aceptación

- [ ] Todos los tipos definidos inline en puertos se mueven a archivos en `core/domain/`.
- [ ] Los puertos importan los tipos desde `core/domain/`, nunca los definen.
- [ ] Los adapters actualizan sus imports para apuntar a `core/domain/` en vez de al puerto.
- [ ] El tipo anónimo `{ idUsuario: number; expiraEn: Date }` en `ITokenVerificacionRepository` se reemplaza por un tipo con nombre exportado desde domain.
- [ ] `IServicioUseCase` importa `ArchivoInput` desde domain, no desde `IStoragePort`.
- [ ] Ningún cambio de comportamiento — es refactor puro (mismos tests, mismo output).
- [ ] `npm test` pasa (270/270).
- [ ] `npx tsc --noEmit` compila sin errores.

## Fuera de alcance

- Crear un aggregate `Auth` en domain (los tipos de auth se agrupan en `domain/auth/` como solución simple, no como aggregate completo).
- Separar `CredencialRaw` en read model vs write model (se mantiene como está, solo cambia de ubicación).
- Modificar la lógica de negocio de cualquier use case.
