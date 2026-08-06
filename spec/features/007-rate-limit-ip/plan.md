# 007 · Rate limiting por IP en toda la API — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

El rate limiting por IP es infraestructura HTTP, NO lógica de negocio: no toca dominio, puertos ni repositorios. Se implementa como middlewares de Express en el adapter de entrada (`adapters/in/http/middlewares/`), aplicados en `server.ts` (global) y `auth.routes.ts` (por endpoint). `express-rate-limit@8.5.2` ya está instalada y en uso (feature 001) — no se instala nada nuevo.

---

## Implementación

### 1. `trust proxy` (prerrequisito)

`src/config/server.ts` — antes de montar rutas:

```typescript
// Detrás de un solo salto de confianza (CDN / reverse proxy).
// NUNCA `true`: permitiría spoofear X-Forwarded-For y saltarse el rate limit por IP.
app.set('trust proxy', 1);
```

Sin esto, detrás de un CDN todos los clientes comparten la IP del proxy y el limiter global bloquearía a todos juntos. `express-rate-limit` v8 valida esta config: solo lanza error con `true`/`'*'` cuando el limiter usa `keyGenerator` por IP, así que `1` pasa sin config adicional.

### 2. Config por env

`src/config/env.ts`:

```typescript
RATE_LIMIT_WINDOW_MINUTES: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES ?? '15'),
RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100'),
```

Permite calibrar el límite global en producción sin deploy (CGNAT, picos legítimos) y no rompe tests: `.env.test` no los define → usa defaults.

### 3. Middlewares

`src/adapters/in/http/middlewares/rate-limit.middleware.ts` — se agregan al final (los tests existentes usan `capturedConfigs[0]` y `[1]`; no tocar el orden de `authRateLimit` ni `userLoginRateLimit`):

```typescript
// Global: toda la API bajo /api/v1
export const apiRateLimit = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: 'error',
        message: `Demasiadas solicitudes desde esta IP. Intentá de nuevo en ${env.RATE_LIMIT_WINDOW_MINUTES} minutos.`,
    },
});

// Estrictos por endpoint público de auth
export const authRegisterRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { status: 'error', message: 'Demasiadas solicitudes desde esta IP. Intentá de nuevo en 15 minutos.' } });

export const authConfirmRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, /* idem */ });

export const authResendRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, /* idem */ });
```

`keyGenerator` por defecto de `express-rate-limit` usa `req.ip` (ya resuelto por `trust proxy`) — no hace falta pasarlo explícitamente. El mensaje object se serializa como JSON con el formato `{ status, message }` que el resto de la app usa.

### 4. Montaje global

`src/config/server.ts` — después de Swagger, antes de las rutas:

```typescript
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', apiRateLimit);   // docs queda fuera del límite global
```

Los docs quedan fuera a propósito: Swagger sirve muchos assets estáticos y gastaría el cupo del desarrollador. Toda la API de negocio queda cubierta.

### 5. Limiters por endpoint

`src/adapters/in/http/auth/auth.routes.ts`:

```typescript
import { authRateLimit, userLoginRateLimit, authRegisterRateLimit, authConfirmRateLimit, authResendRateLimit } from '@middlewares/rate-limit.middleware';

router.post('/registro', authRegisterRateLimit, validate(registroClienteSchema), ...);
router.get('/confirmar', authConfirmRateLimit, ...);
router.post('/confirmar', authConfirmRateLimit, validate(confirmarEmailSchema), ...);  // mismo limiter → contador compartido
router.post('/reenviar-verificacion', authResendRateLimit, idempotency(idempotencyRepo), ...);
```

El mismo objeto limiter en `GET` y `POST /confirmar` comparte el contador (requisito de la spec).

### 6. Tests

`tests/unit/adapters/in/http/middlewares/rate-limit.middleware.test.ts` — se amplía con el patrón existente: el mock captura las configs al importar el módulo. Los 4 nuevos limiters se crean después de los 2 existentes en el módulo, así `capturedConfigs[2..5]` son estables:

- `apiRateLimit`: `windowMs` = env o default 15 min, `limit` = default 100, mensaje contiene `'esta IP'`, `standardHeaders: 'draft-8'`, `legacyHeaders: false`.
- `authRegisterRateLimit`: `limit` 5, mensaje contiene `'esta IP'`.
- `authConfirmRateLimit`: `limit` 30, `windowMs` 15 min.
- `authResendRateLimit`: `limit` 5, `windowMs` 15 min.

> El test importa el middleware real, que ahora importa `@config/env` — los required de `env.ts` ya están en `.env.test`, así que no truena.

### 7. Roadmap

`spec/constitution/roadmap.md` — mover la entrada de "Siguiente" a "Hecho" (item 16), reescrita con el alcance global + endpoints de auth, linkeando a la spec 007.

---

## Orden de implementación

1. `env.ts`: `RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX_REQUESTS`.
2. Middleware: `apiRateLimit` + 3 limiters de auth (al final del archivo, sin tocar los 2 existentes).
3. `server.ts`: `trust proxy: 1` + `app.use('/api/v1', apiRateLimit)`.
4. `auth.routes.ts`: aplicar los 3 limiters por endpoint.
5. Tests del middleware.
6. `npx tsc --noEmit` + `npm test`.
7. Roadmap → Hecho.

## Decisiones

| Decisión | Por qué |
|----------|---------|
| **`trust proxy: 1` (un salto)** | Requisito para que `req.ip` sea la IP real del cliente detrás del CDN. `true` permite spoofear `X-Forwarded-For` y rompe el rate limit. `1` es el mínimo que pasa la validación de express-rate-limit v8. |
| **Límite global configurable por env** | El default (100/15min) se calibra en despliegue según CGNAT y picos legítimos sin redeploy. En tests los defaults no rompen nada. |
| **Docs fuera del limiter global** | Swagger sirve muchos assets; incluirlo gastaría el cupo del desarrollador y de herramientas. La API de negocio es la que se protege. |
| **Mismo limiter en GET+POST /confirmar** | El requisito del roadmap es contador compartido: un atacante que alterne métodos no duplica su cupo. |
| **In-memory, sin persistencia** | El store default de express-rate-limit es en memoria: suficiente para cortar volumen bruto; la persistencia distribuida (Redis) es otro nivel, fuera de alcance. |
| **No se toca el dominio** | El rate limiting es infraestructura del adapter HTTP, no lógica de negocio: no hay use case, puerto ni repositorio nuevo. |

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| **Spoofing de IP si no hay proxy real** | `trust proxy: 1` asume un solo salto de confianza (CDN). Si se despliega sin proxy, `req.ip` es la IP del socket y el límite sigue funcionando (sin spoofing posible). El riesgo de spoofing existe solo si hay un proxy y `trust proxy` está mal configurado. |
| **CGNAT / IPs compartidas** | Límites generosos (100/15min global) + calibración por env en producción. Los límites estrictos de auth (5-30/15min) protegen endpoints baratos de abusar; una red móvil compartida puede pisarse, aceptable vs. el vector de dinero. |
| **Botnets** | El rate limiting por IP NO detiene ataques distribuidos: eso es del edge (Cloudflare). Documentado en fuera de alcance. |
| **Tests con índices frágiles** | Los nuevos limiters se agregan al final del módulo para preservar `capturedConfigs[0]` y `[1]`; documentado en el plan. |

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/config/env.ts` | `RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX_REQUESTS` |
| `src/config/server.ts` | `trust proxy: 1` + `app.use('/api/v1', apiRateLimit)` |
| `src/adapters/in/http/middlewares/rate-limit.middleware.ts` | `apiRateLimit` + `authRegisterRateLimit` + `authConfirmRateLimit` + `authResendRateLimit` |
| `src/adapters/in/http/auth/auth.routes.ts` | aplicar los 3 limiters por endpoint |
| `tests/unit/adapters/in/http/middlewares/rate-limit.middleware.test.ts` | describe blocks de los 4 limiters nuevos |
| `spec/constitution/roadmap.md` | 007 → Hecho (item 16) |
