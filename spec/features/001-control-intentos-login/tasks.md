# 001 · Control de intentos fallidos de login — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

## Base de datos

- [ ] Crear migración de Prisma para la tabla `intentos_login` en schema `seguridad`.

## Core (inside-out)

- [ ] Crear `core/domain/login-security/loginSecurity.entity.ts` — interfaces `IntentosFallidos` y `EstadoBloqueo`.
- [ ] Crear `core/ports/out/login-security/ILoginSecurityRepository.ts` — interface con `registrarIntentoFallido`, `resetIntentos`, `estaBloqueado`, `obtenerEstado`.
- [ ] Crear `adapters/out/db/login-security/loginSecurity.prisma.repository.ts` — implementación Prisma con lazy deletion de registros expirados.
- [ ] Modificar `core/usecases/auth/login.usecase.ts` — inyectar `ILoginSecurityRepository`, agregar lógica de bloqueo y reseteo, normalizar correo a lowercase.

## HTTP layer

- [ ] Crear `userLoginRateLimit` en `middlewares/rate-limit.middleware.ts` — `express-rate-limit` con `keyGenerator: (req) => req.body.correo?.toLowerCase()`.
- [ ] Modificar `auth.routes.ts` — inyectar `ILoginSecurityRepository` en `LoginUseCase`, aplicar `userLoginRateLimit`.

## Tests

- [ ] Crear `tests/unit/core/usecases/auth/login.usecase.test.ts` — cubrir: login exitoso, credenciales incorrectas, cuenta bloqueada, reseteo after éxito. Mock de `ILoginSecurityRepository`.
- [ ] Crear `tests/unit/adapters/out/db/login-security/loginSecurity.prisma.repository.test.ts` — cubrir la implementación Prisma (mock de PrismaClient).

## Validación

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
