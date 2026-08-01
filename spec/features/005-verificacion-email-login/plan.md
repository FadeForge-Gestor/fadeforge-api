# 005 · Verificación de correo — control de acceso al login + link de confirmación — Plan

_Cómo se implementa lo descrito en `spec.md`._

## Enfoque

Tres cambios: dos sobre el flujo de auth existente (feature 002) y uno sobre la creación de usuarios por admin. Se implementan en el orden inside-out del proyecto: entidad de dominio → repositorio → use case → docs → tests. Ninguna interfaz de puerto cambia de firma: `CredencialesAuth` y `CrearUsuarioRepositoryInput` son tipos del dominio, se amplían (aditivo), no se reemplazan.

---

## Parte 1 — Bloquear login sin correo verificado

### 1. Entidad de dominio

`src/core/domain/auth/auth.entity.ts`:

```typescript
export interface LoginOutput {
    token: string;
    usuario: {
        id: number;
        correo: string;
        rol: string;
        emailVerificado: boolean;   // NUEVO
    };
}

export interface CredencialesAuth {
    correo: string;
    hashContrasena: string;
    idUsuario: number;
    claveRol: string;
    emailVerificado: boolean;       // NUEVO
}
```

### 2. Repositorio

`src/adapters/out/db/auth/auth.prisma.repository.ts` — `buscarPorCorreo` agrega `email_verificado` al `select` y lo mapea a `emailVerificado`.

### 3. Use case

`src/core/usecases/auth/login.usecase.ts` — después de validar la contraseña y antes de emitir el JWT:

```typescript
if (env.EMAIL_VERIFICATION_ENABLED && !credenciales.emailVerificado) {
    throw new ForbiddenError('Debes verificar tu correo electrónico antes de iniciar sesión');
}
```

- **`ForbiddenError` (403) y no `UnauthorizedError` (401):** el `401` ya significa "credenciales inválidas" (y dispara el contador de intentos fallidos). El `403` le permite al frontend distinguir las dos pantallas: "correo/contraseña incorrectos" vs "confirmá tu correo".
- **Condicionado a `EMAIL_VERIFICATION_ENABLED`:** si la verificación está apagada no existen tokens ni flujo de confirmación — bloquear sería incoherente. El registro con la feature apagada devuelve JWT directo, así que el check debe respetar el mismo toggle.
- El output incluye `emailVerificado: credenciales.emailVerificado` (valor real de la BD): con la feature ON siempre es `true` (el `403` filtra); con la feature OFF refleja la realidad sin mentirle al frontend.

### 4. Docs

`src/adapters/in/http/auth/auth.docs.ts` — agregar la respuesta `403` al `POST /auth/login`.

---

## Parte 2 — Link de confirmación al backend

### 5. Configuración

`src/config/env.ts` — nueva variable `API_URL`, URL literal del backend (mismo patrón que `LOGO_URL`: se configura, no se adivina):

```typescript
API_URL: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
```

### 6. Servicio de email

`src/adapters/out/email/resendEmail.service.ts` — el link del correo apunta al endpoint real:

```typescript
const link = `${env.API_URL}/api/v1/auth/confirmar?token=${token}`;
```

El endpoint ya existe y está correcto (`GET /api/v1/auth/confirmar`, sin auth, token por query param — verificado). Este cambio solo corrige el destino del link.

---

## Parte 3 — Lado admin: el admin avala la identidad

Con el bloqueo de la Parte 1 activo, el admin del seed y los usuarios creados vía `POST /usuarios` quedarían bloqueados (ambos nacen con `email_verificado=false`). La verificación de correo es para el flujo self-service (probar propiedad del correo); cuando un admin crea la cuenta, el admin ES el ancla de confianza (patrón *trust anchor* de Okta/GitHub/Salesforce) — ya validó la identidad por un canal fuera de banda.

### 7. Entidad de dominio

`src/core/domain/usuario/usuario.entity.ts` — `CrearUsuarioRepositoryInput` suma un campo opcional (aditivo; no cambia interfaces de puerto ni rompe call sites existentes):

```typescript
export interface CrearUsuarioRepositoryInput {
    ...
    emailVerificado?: boolean;   // NUEVO — default false si se omite
}
```

### 8. Repositorio

`src/adapters/out/db/usuarios/usuarios.prisma.repository.ts` — el `credenciales_usuarios.create` de la transacción existente de `crear` persiste `email_verificado: input.emailVerificado ?? false`. Sin métodos nuevos.

### 9. Use cases

- `src/core/usecases/usuarios/usuarios.usecase.ts` — `crear` (ruta admin-only) pasa `emailVerificado: true`: la regla "el admin avala" vive en el use case, no en el controller ni el repositorio.
- `src/core/usecases/auth/registroCliente.usecase.ts` — pasa `emailVerificado: false` explícito: documenta el invariante "self-service empieza sin verificar" en la capa de dominio.

### 10. Seed

`prisma/seed.ts` — el admin inicial crea su credencial con `email_verificado: true`; sin esto no podría iniciar sesión con la feature ON.

---

## Decisiones

| Decisión | Por qué |
|----------|---------|
| **403 para correo no verificado** | Distinguible del 401 (credenciales inválidas) por status; el frontend muestra pantallas distintas. |
| **Check condicionado a `EMAIL_VERIFICATION_ENABLED`** | Con la feature apagada no hay verificación posible; bloquear rompería el flujo (el registro devuelve JWT directo). |
| **`emailVerificado` en `LoginOutput` = valor real** | El frontend sabe el estado de la cuenta sin otro request; devuelve `credenciales.emailVerificado`, siempre `true` con la feature ON (el `403` filtra) y el valor real de la BD con la feature OFF — sin mentirle al frontend. |
| **`API_URL` configurable con default dev** | Mismo principio que `LOGO_URL`: URL literal, independiente de dónde corra el backend. Default sensato para dev local. |
| **No se toca el JWT** | El payload actual (`id`, `rol`, `correo`) no cambia; si entrás es porque estás verificado, agregar el flag al token es ruido. |
| **Admin avala la identidad (trust anchor)** | La verificación de correo es para el self-service (probar propiedad). El admin ya validó la identidad fuera de banda → la cuenta nace verificada (`UsuariosUseCase.crear` pasa `true`; el seed también). Patrón estándar de Okta/GitHub/Salesforce. |

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| **Tests de login dependientes del `.env` real** | El check lee `env.EMAIL_VERIFICATION_ENABLED`. Los tests nuevos mockean `@config/env` (patrón ya usado en `resendEmail.service.test.ts`); el fake `credencialesFake` existente agrega `emailVerificado: true` para que los tests actuales sigan verdes sin importar el `.env` local. |
| **`API_URL` olvidada en `.env` en prod** | Default dev (`localhost:3000`) — en prod debe configurarse explícitamente. Se documenta en `.env.template` como opcional. |
| **Mock de `@config/env` sin `API_URL`** | El mock de `resendEmail.service.test.ts` se actualiza con `API_URL` de prueba (igual que se hizo con `LOGO_URL`). |

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/core/domain/auth/auth.entity.ts` | `emailVerificado` en `CredencialesAuth` y `LoginOutput` |
| `src/adapters/out/db/auth/auth.prisma.repository.ts` | Traer `email_verificado` en `buscarPorCorreo` |
| `src/core/usecases/auth/login.usecase.ts` | Check de verificación + `ForbiddenError` + output |
| `src/config/env.ts` | Nueva variable `API_URL` |
| `src/adapters/out/email/resendEmail.service.ts` | Link con `API_URL` en vez de `FRONTEND_URL` |
| `src/adapters/in/http/auth/auth.docs.ts` | Respuesta 403 en `/auth/login` |
| `tests/unit/core/usecases/auth/login.usecase.test.ts` | Fake con `emailVerificado` + casos nuevos |
| `tests/unit/adapters/out/email/resendEmail.service.test.ts` | Mock de `@config/env` con `API_URL` |
| `src/core/domain/usuario/usuario.entity.ts` | `emailVerificado?: boolean` en `CrearUsuarioRepositoryInput` |
| `src/adapters/out/db/usuarios/usuarios.prisma.repository.ts` | Persistir `email_verificado` en la transacción de `crear` |
| `src/core/usecases/usuarios/usuarios.usecase.ts` | `crear` pasa `emailVerificado: true` (el admin avala) |
| `src/core/usecases/auth/registroCliente.usecase.ts` | Pasa `emailVerificado: false` explícito |
| `prisma/seed.ts` | Admin inicial con `email_verificado: true` |
| `tests/unit/core/usecases/usuarios/usuarios.usecase.test.ts` | Caso nuevo: `crear` pasa `emailVerificado: true` |
| `.env.template` | Documentar `API_URL` (opcional, default dev) |

Sin cambios: `IAuthRepository`, `IEmailService`, `auth.routes.ts`, `auth.controller.ts`, `templateLoader.ts`, templates.
