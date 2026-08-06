# 007 · Rate limiting por IP en toda la API — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

> Es infraestructura HTTP: no toca dominio, puertos ni repositorios. `express-rate-limit` ya está instalada (8.5.2) — no se instala nada.

## Config

- [ ] `src/config/env.ts`: agregar `RATE_LIMIT_WINDOW_MINUTES` (default `'15'`) y `RATE_LIMIT_MAX_REQUESTS` (default `'100'`), parseados con `parseInt` igual que los existentes.

## Middleware

- [ ] `rate-limit.middleware.ts`: exportar `apiRateLimit` (global) usando los env nuevos, `standardHeaders: 'draft-8'`, `legacyHeaders: false`, mensaje `{ status: 'error', message: 'Demasiadas solicitudes desde esta IP. Intentá de nuevo en N minutos.' }`.
- [ ] Exportar `authRegisterRateLimit` (5 / 15 min por IP).
- [ ] Exportar `authConfirmRateLimit` (30 / 15 min por IP).
- [ ] Exportar `authResendRateLimit` (5 / 15 min por IP).
- [ ] NO tocar el orden ni la config de `authRateLimit` y `userLoginRateLimit` (los tests usan `capturedConfigs[0]` y `[1]`).

## Server

- [ ] `src/config/server.ts`: `app.set('trust proxy', 1)` con comentario de por qué nunca `true`.
- [ ] Montar `app.use('/api/v1', apiRateLimit)` después de Swagger y antes de las rutas (docs fuera del límite).

## Routes

- [ ] `auth.routes.ts`: `authRegisterRateLimit` en `POST /registro`.
- [ ] `authConfirmRateLimit` (el mismo objeto) en `GET /confirmar` y `POST /confirmar` → contador compartido.
- [ ] `authResendRateLimit` en `POST /reenviar-verificacion`.

## Tests

- [ ] Ampliar `rate-limit.middleware.test.ts` con describe de `apiRateLimit`: `windowMs` default 15 min, `limit` default 100, mensaje contiene `'esta IP'`, `standardHeaders: 'draft-8'`, `legacyHeaders: false`.
- [ ] Describe de `authRegisterRateLimit`: `limit` 5, `windowMs` 15 min, mensaje contiene `'esta IP'`.
- [ ] Describe de `authConfirmRateLimit`: `limit` 30, `windowMs` 15 min.
- [ ] Describe de `authResendRateLimit`: `limit` 5, `windowMs` 15 min.

## Validación

- [ ] `npx tsc --noEmit` compila sin errores.
- [ ] `npm test` pasa (28 suites + nuevas, sin romper las existentes).
- [ ] `spec/constitution/roadmap.md`: mover rate limiting por IP de "Siguiente" a "Hecho" (item 16), reescrito con el alcance global + auth.
