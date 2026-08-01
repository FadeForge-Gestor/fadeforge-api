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

El endpoint ya existe (`GET /api/v1/auth/confirmar`, sin auth, token por query param), pero su validación de token tiene un bug (doble hash de bcrypt): ver **Parte 4**. Este cambio solo corrige el destino del link.

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

## Parte 4 — Corregir la validación del token (doble hash de bcrypt)

En el registro se persiste `token_hash = bcrypt.hash(token)` (raw hasheado una vez). En la confirmación, `confirmarEmail.usecase.ts` re-hasheaba el token (`bcrypt.hash(token, 10)` → hash con salt nuevo) y `buscarPorTokenHash` hacía `bcrypt.compare(hash2, hash_almacenado)`: como `bcrypt.compare` espera el token EN CLARO como primer argumento, comparaba `hash(hash2)` contra `hash1` → nunca coinciden. Resultado: `/auth/confirmar` siempre respondía 400 "El token de verificación es inválido o expiró".

### 11. Contrato del repositorio

`src/core/ports/out/email/ITokenVerificacionRepository.ts` — renombrar `buscarPorTokenHash(tokenHash)` → `buscarPorToken(token: string)`: el contrato recibe el token en claro. El nombre anterior mentía sobre lo que el repositorio realmente esperaba (la implementación ya hacía `bcrypt.compare` con el primer argumento como plaintext).

### 12. Repositorio

`src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts` — implementación: `bcrypt.compare(token, token.token_hash)` contra el raw recibido. Sin cambios de query; solo nombres de variables para que el contrato sea honesto.

### 13. Use case

`src/core/usecases/auth/confirmarEmail.usecase.ts` — eliminar `const tokenHash = await bcrypt.hash(token, 10);` (línea 15) y pasar el token raw: `buscarPorToken(token)`. El hashing de bcrypt queda solo en la persistencia (`registroCliente.usecase.ts` al crear el token) y en la comparación del repositorio.

### 14. Tests

- Renombrar el mock `buscarPorTokenHash` → `buscarPorToken` en: `confirmarEmail.usecase.test.ts`, `registroCliente.usecase.test.ts`, `reenviarVerificacion.usecase.test.ts`.
- `confirmarEmail.usecase.test.ts`: aserción de que el repo recibe el token SIN hashear (`toHaveBeenCalledWith('token-plano-123')`) y quitar `jest.mock('bcrypt')` (el use case deja de usarlo).
- NUEVO `tests/unit/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.test.ts`: regresión con bcrypt REAL (solo se mockea `prisma`): crear el hash con `bcrypt.hash`, `buscarPorToken` lo encuentra con el raw correcto y devuelve `null` con uno incorrecto. Es el test que faltaba y dejó pasar el bug.

---

## Parte 5 — Semántica HTTP: POST consume, GET valida

La confirmación pasa a tener la nomenclatura correcta: consumir un token de un solo uso es una mutación (marca `email_verificado=true` y borra el token) y debe vivir en un POST. El GET del link del correo queda read-only: valida sin escribir. Un GET que muta es una trampa para el siguiente desarrollador (el contrato HTTP dice read-only, aunque Express no lo imponga).

### 15. Schema Zod

`src/adapters/in/http/auth/auth.schema.ts` — nuevo `confirmarEmailSchema`:

```typescript
export const confirmarEmailSchema = z.object({
    token: z.string().min(1, 'El token es requerido'),
});
```

### 16. Puerto de entrada

NUEVO `src/core/ports/in/auth/IValidarTokenVerificacionUseCase.ts` — contrato read-only para el GET:

```typescript
export interface IValidarTokenVerificacionUseCase {
    validar(token: string): Promise<{ valido: boolean }>;
}
```

### 17. Use case

NUEVO `src/core/usecases/auth/validarTokenVerificacion.usecase.ts` — `ValidarTokenVerificacionUseCase`: busca el token con `buscarTokenValido`, chequea expiración y devuelve `{ valido: boolean }`. **CERO efectos**: no elimina, no actualiza, no hashea. OCP: archivo nuevo, no se toca `ConfirmarEmailUseCase`.

### 18. Repositorio

`src/core/ports/out/email/ITokenVerificacionRepository.ts` — método read-only nuevo:

```typescript
buscarTokenValido(token: string): Promise<VerificationTokenData | null>;
```

`src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts` — implementación: mismo `bcrypt.compare` que `buscarPorToken` pero **sin** `deleteMany` de expirados y sin consumo. `buscarPorToken` queda intacto para el POST (ahí sí limpia y consume).

### 19. Controller

`src/adapters/in/http/auth/auth.controller.ts`:

- `confirmarEmail` (GET) → `validar(req.query.token)` → `200 ok({ valido: true, mensaje: 'El token es válido' })` o 400. **Sin token en la respuesta** (sin frontend, el JSON es la única salida visible; reflejar el token lo deja en logs/caché).
- `confirmarEmailPost` (POST) → `confirmar(req.body.token)` → `200 ok({ mensaje: 'Correo electrónico verificado. Ya podés iniciar sesión.' })`. **Sin token en la respuesta**.

### 20. Routes

`src/adapters/in/http/auth/auth.routes.ts` — nueva ruta:

```typescript
router.post('/confirmar', validate(confirmarEmailSchema), (req, res, next) => controller.confirmarEmailPost(req, res, next));
```

El GET se mantiene (magic link del correo), ahora read-only.

### 21. Docs

`src/adapters/in/http/auth/auth.docs.ts` — Swagger del `POST /auth/confirmar` (requestBody `{ token }`, respuestas 200/400) y actualizar el GET a "validación read-only" (200 con `{ valido }`).

### 22. Tests

- `tests/unit/adapters/in/http/auth/auth.schema.test.ts`: `confirmarEmailSchema` — token válido pasa, vacío/faltante falla.
- NUEVO `tests/unit/core/usecases/auth/validarTokenVerificacion.usecase.test.ts`: token válido → `{ valido: true }`; expirado → `{ valido: false }`; inexistente → `{ valido: false }`; y NUNCA llama a `eliminarPorIdUsuario` ni `actualizarEmailVerificado` (read-only).
- `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts`: caso nuevo — tras un POST exitoso el token se eliminó (reuso → 400).

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
| **GET valida, POST consume** | El consumo del token es una mutación (marca verificado y borra el token) → POST, el verbo honesto. Un GET que muta es una trampa para el siguiente dev (el contrato HTTP dice read-only). El GET del link queda read-only: valida y devuelve `{ valido }` — el pre-fetch de clientes de correo ya no puede quemar el token. |
| **Token de un solo uso** | El POST elimina el token al consumirlo (`eliminarPorIdUsuario`); reutilizarlo responde 400. `crear` es upsert por `id_usuario`: un reenvío invalida el anterior (un token vivo por usuario). |
| **GET/POST no exponen el token en la respuesta** | Sin frontend el JSON es la única salida visible; reflejar el token lo deja en logs/caché/screenshots. Solo el correo lo contiene (texto visible + link). |
| **El use case no hashea el token al validar** | `bcrypt.compare` espera el token en claro como primer argumento; hashear antes rompe la comparación (salt aleatorio). El hash solo se genera una vez, al persistir el token. |

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| **Tests de login dependientes del `.env` real** | El check lee `env.EMAIL_VERIFICATION_ENABLED`. Los tests nuevos mockean `@config/env` (patrón ya usado en `resendEmail.service.test.ts`); el fake `credencialesFake` existente agrega `emailVerificado: true` para que los tests actuales sigan verdes sin importar el `.env` local. |
| **`API_URL` olvidada en `.env` en prod** | Default dev (`localhost:3000`) — en prod debe configurarse explícitamente. Se documenta en `.env.template` como opcional. |
| **Mock de `@config/env` sin `API_URL`** | El mock de `resendEmail.service.test.ts` se actualiza con `API_URL` de prueba (igual que se hizo con `LOGO_URL`). |
| **El bug del doble hash era invisible para los tests** | `buscarPorTokenHash` estaba mockeado en los 3 tests que lo tocaban → el roundtrip real de bcrypt nunca se ejercitaba. Se agrega un test de regresión en el repositorio con bcrypt real (solo se mockea `prisma`). |
| **GET que muta confunde devs** | Mitigado por diseño: el GET es read-only (`buscarTokenValido` sin `deleteMany` ni consumo); el POST es el único consumidor. |

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
| `src/core/ports/out/email/ITokenVerificacionRepository.ts` | Renombrar `buscarPorTokenHash` → `buscarPorToken(token)` (recibe el token en claro) |
| `src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts` | Comparar el token raw contra el hash almacenado (sin doble hash) |
| `src/core/usecases/auth/confirmarEmail.usecase.ts` | Quitar el `bcrypt.hash` previo; pasar el token raw al repo |
| `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts` | Mock renombrado + aserción de token sin hashear + quitar mock de bcrypt |
| `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts` | Mock renombrado (`buscarPorToken`) |
| `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts` | Mock renombrado (`buscarPorToken`) |
| NUEVO `tests/unit/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.test.ts` | Regresión con bcrypt real: token correcto se encuentra, incorrecto devuelve `null` |
| `src/adapters/out/email/templates/verificacion.mjml` + `.html` | Link de confirmación visible como texto bajo el botón (fallback sin frontend) — hecho en `000abe7` |
| `tests/unit/adapters/out/email/templateLoader.test.ts` | Test del link visible — hecho en `000abe7` |
| `src/adapters/in/http/auth/auth.schema.ts` | `confirmarEmailSchema` (token requerido) |
| NUEVO `src/core/ports/in/auth/IValidarTokenVerificacionUseCase.ts` | Contrato read-only: `validar(token): Promise<{ valido: boolean }>` |
| NUEVO `src/core/usecases/auth/validarTokenVerificacion.usecase.ts` | Valida sin efectos (no elimina, no actualiza) |
| `src/core/ports/out/email/ITokenVerificacionRepository.ts` | Método read-only `buscarTokenValido` (sin `deleteMany` ni consumo) |
| `src/adapters/out/db/token-verificacion/tokenVerificacion.prisma.repository.ts` | Implementación `buscarTokenValido` read-only |
| `src/adapters/in/http/auth/auth.controller.ts` | GET read-only + `confirmarEmailPost` |
| `src/adapters/in/http/auth/auth.routes.ts` | `POST /confirmar` con `validate` |
| `src/adapters/in/http/auth/auth.docs.ts` | Swagger POST + GET read-only |
| `tests/unit/adapters/in/http/auth/auth.schema.test.ts` | Casos de `confirmarEmailSchema` |
| NUEVO `tests/unit/core/usecases/auth/validarTokenVerificacion.usecase.test.ts` | Read-only: valida sin efectos |

Sin cambios: `IAuthRepository`, `IEmailService`, `templateLoader.ts`, `.env.template` (solo documentado), `src/config/env.ts` (solo Parte 2).
