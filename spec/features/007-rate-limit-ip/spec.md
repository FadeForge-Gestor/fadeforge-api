# 007 · Rate limiting por IP en toda la API

**Estado:** propuesta

## Qué hace

Agrega límites de peticiones por IP a toda la API: un **limiter global** aplicado a `/api/v1` (toda la API de negocio) con un mensaje `429` que indica que se hicieron demasiadas solicitudes desde esa IP, más **límites estrictos por endpoint** en los endpoints públicos de auth (`/registro`, `GET+POST /confirmar`, `/reenviar-verificacion`). Requiere configurar `trust proxy` para que `req.ip` sea la IP real del cliente detrás del CDN.

## Por qué

Hoy solo `/auth/login` tiene rate limit (`authRateLimit` 10/15min y `userLoginRateLimit` 5/15min por correo, feature 001). Los endpoints públicos de auth restantes no tienen límite por IP:

- `POST /registro` — spray de emails: cada request dispara un email de verificación vía Resend (vector de dinero, señalado en la [spec 002](refactors/002-proteccion-dos-auth/spec.md) como pendiente).
- `GET+POST /confirmar` — lookup O(1) desde el refactor 002, pero sigue siendo un endpoint público barato de bombardear.
- `POST /reenviar-verificacion` — idem, dispara emails.

Y el resto de la API (citas, usuarios, servicios, etc.) tampoco tiene límite de volumen por IP: un cliente o bot puede saturar el servidor sin restricción.

Sin `trust proxy`, detrás de un CDN todos los clientes comparten la IP del proxy y el limiter global bloquearía a todos juntos (o peor, con `true` cualquiera podría spoofear `X-Forwarded-For`). Configurar `trust proxy` a un salto de confianza es el prerrequisito de este refactor.

## Criterios de aceptación

- [ ] Toda la API bajo `/api/v1` tiene un rate limit global por IP (`apiRateLimit`), con ventana y límite configurables por env (`RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX_REQUESTS`).
- [ ] El `429` del limiter global devuelve `{ status: 'error', message: 'Demasiadas solicitudes desde esta IP. Intentá de nuevo en N minutos.' }` (mensaje que indica que se hicieron varias solicitudes desde esa IP).
- [ ] `server.ts` configura `app.set('trust proxy', 1)` (NUNCA `true`) y monta `apiRateLimit` sobre `/api/v1`, después de Swagger (los docs quedan fuera del límite global).
- [ ] `POST /registro` tiene límite estricto de **5 peticiones / 15 min** por IP.
- [ ] `GET` y `POST /confirmar` comparten un límite de **30 peticiones / 15 min** por IP (contador compartido).
- [ ] `POST /reenviar-verificacion` tiene límite estricto de **5 peticiones / 15 min** por IP.
- [ ] Los limiters existentes de `/login` (`authRateLimit`, `userLoginRateLimit`) se conservan sin cambios.
- [ ] Los nuevos limiters usan `standardHeaders: 'draft-8'`, `legacyHeaders: false` y `keyGenerator` basado en `req.ip`, consistente con los existentes.
- [ ] `npm test` pasa: tests del middleware ampliados con el patrón de mock existente (`capturedConfigs`), sin romper los índices de los tests actuales.
- [ ] `npx tsc --noEmit` compila sin errores.
- [ ] `spec/constitution/roadmap.md` actualizado (007 → Hecho al terminar la implementación).

## Fuera de alcance

- **Persistencia de contadores** en PostgreSQL/Redis — el store in-memory de `express-rate-limit` se pierde al reiniciar; suficiente para el límite por IP actual.
- **Anti-botnet** — un ataque distribuido desde muchas IPs no se detiene con rate limiting por IP; eso es del edge (Cloudflare DDoS / bot management).
- **Anti-enumeración en `POST /reenviar-verificacion`** (el 404 actual filtra cuentas registradas) — sigue en el backlog del roadmap.
- **Firewall de origen** (security group que solo acepte tráfico del CDN) — tarea operativa de despliegue, no código.
- **Ajuste fino de límites por CGNAT** — las IPs compartidas en móviles requieren límites generosos; se calibra en despliegue con métricas reales.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/config/env.ts` | `RATE_LIMIT_WINDOW_MINUTES` (default 15) y `RATE_LIMIT_MAX_REQUESTS` (default 100) |
| `src/config/server.ts` | `app.set('trust proxy', 1)` + `app.use('/api/v1', apiRateLimit)` |
| `src/adapters/in/http/middlewares/rate-limit.middleware.ts` | `apiRateLimit` (global) + `authRegisterRateLimit`, `authConfirmRateLimit`, `authResendRateLimit` |
| `src/adapters/in/http/auth/auth.routes.ts` | aplicar los 3 limiters por endpoint |
| `tests/unit/adapters/in/http/middlewares/rate-limit.middleware.test.ts` | tests de los 4 limiters nuevos |
| `spec/constitution/roadmap.md` | mover rate limiting a Hecho (item 16) |
