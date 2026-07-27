# 001 · Mover tipos de puertos a la capa de dominio — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Refactor mecánico: mover tipos de archivos de puertos hacia archivos de domain, actualizar imports. Sin cambios de comportamiento.

## Archivos a crear

### 1. `core/domain/auth/auth.entity.ts`

Agrupa los tipos de autenticación que hoy están dispersos en puertos:

```typescript
// Desde IAuthUseCase.ts
export interface LoginInput {
    correo: string;
    contrasena: string;
}

export interface LoginOutput {
    token: string;
    usuario: {
        id: number;
        correo: string;
        rol: string;
    };
}

// Desde IRegistroClienteUseCase.ts
export interface RegistroClienteInput {
    nombre: string;
    aPaterno: string;
    aMaterno?: string;
    telefono: string;
    correo: string;
    contrasena: string;
}

export interface RegistroClienteOutput {
    token?: string;
    mensaje?: string;
    usuario: {
        id: number;
        correo: string;
        rol: string;
    };
}

// Desde IAuthRepository.ts
export interface CredencialesAuth {
    correo: string;
    hashContrasena: string;
    idUsuario: number;
    claveRol: string;
}
```

### 2. `core/domain/storage/storage.entity.ts`

```typescript
export interface ArchivoInput {
    buffer: Buffer;
    nombreOriginal: string;
}

export interface ImagenSubida {
    url: string;
    publicId: string;
    nombre: string;
}
```

### 3. `core/domain/idempotency/idempotency.entity.ts`

```typescript
export interface StoredResponse {
    status: number;
    body: unknown;
}
```

## Archivos a modificar

### 4. `core/domain/credencial/credencial.entity.ts`

Agregar `CredencialRaw` (que hoy vive en `ICredencialRepository.ts`):

```typescript
export interface CredencialRaw {
    idUsuario: number;
    correo: string;
    hashContrasena: string;
    emailVerificado: boolean;
}
```

### 5. `core/domain/email/verificationToken.ts`

Agregar tipo con nombre para el resultado de búsqueda de token:

```typescript
export interface VerificationTokenData {
    idUsuario: number;
    expiraEn: Date;
}
```

### 6. Puertos de entrada — actualizar imports

| Puerto | Cambio |
|--------|--------|
| `ports/in/auth/IAuthUseCase.ts` | Importar `LoginInput`, `LoginOutput` desde `@core/domain/auth/auth.entity` |
| `ports/in/auth/IRegistroClienteUseCase.ts` | Importar `RegistroClienteInput`, `RegistroClienteOutput` desde `@core/domain/auth/auth.entity` |
| `ports/in/servicios/IServicioUseCase.ts` | Importar `ArchivoInput` desde `@core/domain/storage/storage.entity` en vez de `@core/ports/out/storage/IStoragePort` |

### 7. Puertos de salida — actualizar imports

| Puerto | Cambio |
|--------|--------|
| `ports/out/credenciales/ICredencialRepository.ts` | Importar `CredencialRaw` desde `@core/domain/credencial/credencial.entity` |
| `ports/out/auth/IAuthRepository.ts` | Importar `CredencialesAuth` desde `@core/domain/auth/auth.entity` |
| `ports/out/storage/IStoragePort.ts` | Importar `ArchivoInput`, `ImagenSubida` desde `@core/domain/storage/storage.entity` |
| `ports/out/idempotency/IIdempotencyRepository.ts` | Importar `StoredResponse` desde `@core/domain/idempotency/idempotency.entity` |
| `ports/out/email/ITokenVerificacionRepository.ts` | Importar `VerificationTokenData` desde `@core/domain/email/verificationToken` |

### 8. Adapters — actualizar imports

| Adapter | Cambio |
|---------|--------|
| `adapters/out/db/credenciales/credenciales.prisma.repository.ts` | Importar `CredencialRaw` desde `@core/domain/credencial/credencial.entity` |
| `adapters/out/db/auth/auth.prisma.repository.ts` | Importar `CredencialesAuth` desde `@core/domain/auth/auth.entity` |

## Orden de implementación

1. Crear archivos nuevos en `core/domain/` (auth, storage, idempotency)
2. Modificar archivos existentes en `core/domain/` (credencial, email)
3. Actualizar imports en puertos de entrada
4. Actualizar imports en puertos de salida
5. Actualizar imports en adapters
6. Ejecutar `npx tsc --noEmit` para verificar que compila
7. Ejecutar `npm test` para verificar que no se rompió nada

## Decisiones

- **`domain/auth/` como directorio nuevo** — los tipos de auth (login, registro, credencialesAuth) no tienen un dominio existente al que pertenezcan naturalmente. `credencial` es cercano pero `LoginInput`/`LoginOutput` no son propios de credenciales. Crear `domain/auth/` es más limpio que saturar `domain/credencial/`.
- **Tipo con nombre en vez de anónimo** — `{ idUsuario, expiraEn }` se convierte en `VerificationTokenData` para mejorar legibilidad y reuso.
- **Sin cambios de comportamiento** — este es un refactor mecánico. Si algún test falla, es un error del refactor, no un cambio intencional.
