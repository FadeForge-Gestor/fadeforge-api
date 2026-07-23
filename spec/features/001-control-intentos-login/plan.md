# 001 · Control de intentos fallidos de login — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Dos mecanismos independientes que se complementan:

1. **Rate limit por usuario** — `express-rate-limit` con `keyGenerator` que usa el correo del body como key. Ya resuelve la librería, no toca core.
2. **Lockout por intentos fallidos** — Repository dedicado con interface en `core/ports/out` (hexagonal). El `LoginUseCase` conoce la interface, no la implementación. La implementación usa PostgreSQL con Prisma: tabla `intentos_login` en el schema `seguridad`. Los registros expirados se limpian con lazy deletion.

Responsabilidades separadas (SRP): rate limit cuenta requests, lockout cuenta intentos fallidos y bloquea.

## Modelo de datos

Nueva tabla `intentos_login` en el schema `seguridad`:

```prisma
model intentos_login {
  id                 Int       @id @default(autoincrement())
  correo             String    @unique @db.VarChar(100)
  intentos_fallidos  Int       @default(0)
  bloqueado_hasta    DateTime? @db.Timestamptz(6)
  fecha_creacion     DateTime  @default(now()) @db.Timestamp(6)
  fecha_modificacion DateTime  @default(now()) @db.Timestamptz(6)

  @@schema("seguridad")
}
```

## Implementación

1. **Migración** — Crear migración de Prisma para la tabla `intentos_login`.
2. **Dominio** — Crear `core/domain/login-security/loginSecurity.entity.ts` con las interfaces `IntentosFallidos` y `EstadoBloqueo`.
3. **Puerto out** — Crear `core/ports/out/login-security/ILoginSecurityRepository.ts` con los métodos: `registrarIntentoFallido(correo)`, `resetIntentos(correo)`, `estaBloqueado(correo)`, `obtenerEstado(correo)`.
4. **Adapter out (Prisma)** — Crear `adapters/out/db/login-security/loginSecurity.prisma.repository.ts` que implementa `ILoginSecurityRepository` consultando la tabla `intentos_login`. Lógica: incrementar contador en cada fallo, bloquear a los 5 intentos por 15 minutos, resetear en éxito. Lazy deletion de registros expirados en `obtenerEstado`.
5. **Use case** — Modificar `core/usecases/auth/login.usecase.ts`:
   - Inyectar `ILoginSecurityRepository` como dependencia adicional.
   - Antes de comparar contraseñas: normalizar correo a lowercase, verificar `estaBloqueado(correo)`. Si está bloqueado, lanzar `429 TooManyRequests` con tiempo restante.
   - Si las credenciales fallan: llamar `registrarIntentoFallido(correo)` y lanzar `401 Unauthorized`.
   - Si el login es exitoso: llamar `resetIntentos(correo)`.
6. **Puerto in** — No se crea puerto nuevo. El `IAuthUseCase` existente ya expone `login()`. El comportamiento de bloqueo es interno del use case.
7. **Controller** — No se modifica. El controller ya delega al use case y maneja errores con `next(error)`. El error `429` se propagará por el error middleware.
8. **Middleware rate limit por usuario** — Crear `userLoginRateLimit` en `middlewares/rate-limit.middleware.ts` usando `express-rate-limit` con `keyGenerator: (req) => req.body.correo?.toLowerCase()`. Se aplica a `POST /auth/login` **además** del rate limit global existente.
9. **Routes** — Modificar `auth.routes.ts` para inyectar `ILoginSecurityRepository` en el `LoginUseCase` y aplicar `userLoginRateLimit`.
10. **Tests use case** — Crear `tests/unit/core/usecases/auth/login.usecase.test.ts` cubriendo: login exitoso, credenciales incorrectas, cuenta bloqueada, reseteo after éxito. Mock de `ILoginSecurityRepository`.
11. **Tests repository** — Crear `tests/unit/adapters/out/db/login-security/loginSecurity.prisma.repository.test.ts` cubriendo la implementación Prisma (mock de PrismaClient).

## Decisiones

- **Rate limit por usuario con express-rate-limit** — Verificado con Context7: `keyGenerator` permite usar `req.body.correo` como key. No hace falta crear un middleware custom ni un repository para esto. La librería ya maneja el store in-memory, el conteo y la expiración de ventanas.
- **Lockout como repository hexagonal** — El lockout NO es rate limiting: es lógica de negocio (¿este usuario puede intentar login?). Por eso vive en `core/ports/out`, no en un middleware. El use case decide cuándo bloquear, no el HTTP layer.
- **Persistencia en PostgreSQL** — Tabla `intentos_login` en schema `seguridad`. Sobrevive reinicios del servidor. Lazy deletion de registros expirados en `obtenerEstado` (sin background jobs).
- **Lockout de 15 minutos, 5 intentos** — Estándar de la industria. Alternativas descartadas: lockout permanente (too aggressive para una barbería), lockout con CAPTCHA (overkill para una API REST).
- **Tabla nueva vs campos en credenciales_usuarios** — Tabla nueva (SRP). Cada concepto tiene su tabla: `credenciales_usuarios` es para hash + correo, `intentos_login` es para lockout. Alternativa descartada: agregar campos a `credenciales_usuarios` porque mezclar responsabilidades.
- **No se crea puerto de entrada nuevo** — El login ya tiene su endpoint. El comportamiento de bloqueo es transparente para el cliente: recibe un 429 con un mensaje claro.
- **Correos normalizados a lowercase** — Para evitar que "Test@Gmail.com" y "test@gmail.com" cuenten como distintos.

## Riesgos

- **Race condition entre intentos de lockout** — Si dos requests llegan exactamente al mismo tiempo, podrían pasar ambas el check de bloqueo. Mitigación: para el volumen de una barbería es despreciable. En producción se usaría atomicidad (DB con SELECT FOR UPDATE o UPsert atómico).
- **Acumulación de registros expirados** — Mitigación: lazy deletion en `obtenerEstado` — cada consulta borra registros cuyo `bloqueado_hasta` ya pasó. No necesita background job.
- **Performance de la query** — El índice `@@unique` en `correo` garantiza búsquedas O(1). Para el volumen de una barbería no es un problema.
