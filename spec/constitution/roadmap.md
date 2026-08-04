# Roadmap

Este roadmap ordena el desarrollo de FadeForge API: qué está construido, qué se está por abordar y qué ideas hay en el radar. Cada feature nueva se planifica acá antes de tocar código, siguiendo el flujo definido en `constitution/`.

## Hecho ✅

_Construidas antes de adoptar este flujo SDD, por eso no tienen carpeta en `features/` — quedan documentadas acá como punto de partida._

1. **Autenticación y roles** — login con JWT, control de acceso por rol (admin, empleado, cliente).
2. **Gestión de usuarios y empleados (admin)** — alta de usuarios y empleados, roles de solo lectura.
3. **Servicios y categorías** — CRUD de servicios con historial de precios vigente.
4. **Gestión de citas** — creación con validación de disponibilidad, cálculo de subtotal/IVA/total, máquina de estados (`nueva → pendiente → en_proceso → finalizada / cancelada / reprogramada`), anti-solapamiento por empleado.
5. **Idempotencia en endpoints POST** — evita duplicados en `/citas`, `/usuarios`, `/empleados`, `/servicios`, `/categorias-servicios` ante reintentos de red.
6. **Documentación interactiva** — Swagger UI por dominio.
7. **CI pipeline** — workflow de GitHub Actions con typecheck, test (coverage) y build, cache de 3 capas (npm, node_modules, Prisma client).

_Con features documentadas con spec:_

8. **Control de intentos fallidos de login** — lockout después de 5 intentos fallidos (15 min), rate limit por usuario con `express-rate-limit`, persistencia en PostgreSQL. [Spec](features/001-control-intentos-login/spec.md)
9. **Verificación de correo electrónico** — email de confirmación con Resend al registrarse, tokens bcrypt, rate limit de reenvío, feature toggle. [Spec](features/002-verificacion-email/spec.md)
10. **Null Object para el servicio de email** — la app arranca sin `RESEND_API_KEY`: `NullEmailService` no-op inyectado cuando `EMAIL_VERIFICATION_ENABLED=false`; los casos de uso y el controller reciben `IEmailService` siempre, sin `undefined`. [Spec](features/003-null-object-email-service/spec.md)
11. **Templates HTML para correos (MJML)** — templates Handlebars extraídos a `src/adapters/out/email/templates/`, rediseño Fase 2 con MJML compilado en build-time (`npm run build:emails`), logo desde Cloudinary (`LOGO_URL`) con validación 400 + TTL. [Spec](features/004-email-templates/spec.md)
12. **Refactor: tipos de puertos a domain** — los 8 puertos con tipos inline migrados a `core/domain/`; los puertos solo importan tipos del dominio, sin cambios de comportamiento. [Spec](refactors/001-hexagonal-tipos-en-dominio/spec.md)
13. **Verificación de correo — control de acceso** — bloqueo del login sin correo verificado (403 distinguible del 401, condicionado a `EMAIL_VERIFICATION_ENABLED`), link del correo apuntando al backend (`API_URL`), y el admin avala la identidad al crear usuarios (`email_verificado=true`). Semántica HTTP correcta: `POST /auth/confirmar` consume el token (de un solo uso, sin contraseña) y `GET /auth/confirmar` valida sin mutar. Los rechazos de Resend ya no son silenciosos (el SDK devuelve `{ data, error }` sin lanzar) y los fallos de envío se loguean sin romper el flujo. Template del correo con logo (`LOGO_URL` recortado on-the-fly en Cloudinary) y sin el link directo del token en texto visible. [Spec](features/005-verificacion-email-login/spec.md)
14. **Correo de bienvenida tras la verificación** — al consumir el token en `POST /auth/confirmar`, se envía por primera vez un correo de bienvenida personalizado ("Hola {nombre}, tu cuenta está activa"). El envío es un side-effect: un fallo no revierte la verificación ni cambia el 200 (se loguea). `IEmailService` gana `enviarBienvenida(correo, nombre)`; `ConfirmarEmailUseCase` depende de `IEmailService` e `IUsuarioRepository` (puertos, DIP); template MJML nuevo reusando header/footer. [Spec](features/006-correo-bienvenida/spec.md)

## Siguiente 🔜

- **Integration tests con PostgreSQL** — service container en CI para tests de integración contra DB real. Requiere carpeta `tests/integration/` y test de los adapters Prisma.

## Backlog / ideas 💡

- **Outbox pattern para correos (garantía de entrega)** — sistema de colas sin infraestructura nueva: tabla `correos_pendientes` en PostgreSQL + worker con reintentos y backoff para envíos de email fallidos. Hoy los correos (verificación y bienvenida) son best-effort: si el envío falla, se loguea y se pierde (decisión de la feature 005/006). Un outbox lo convierte en at-least-once, sobrevive reinicios y sirve para los correos transaccionales futuros (recordatorio de turno, factura, etc.). Requiere: tabla nueva, worker, política de reintentos/dead-letter y tests.
- **Deuda técnica: renombrar `IEmailService` → `IEmailPort`** — los puertos de salida que representan servicios externos (no persistencia) conviven con dos nomenclaturas: `IStoragePort`/`IClockPort` usan sufijo `Port`, `IEmailService` usa `Service`. Unificar a `IEmailPort` para consistencia. Refactor cosmético: toca puerto, `ResendEmailService`, `NullEmailService`, use cases y tests. NO es un `Repository` (no persiste datos) — la excepción al sufijo `Repository` es correcta.
- **CD (Continuous Deployment)** — deploy automático al mergear a `main`. Pendiente definir plataforma de deploy (Railway, Render, Fly.io, VPS, etc.).

### Seguridad CI/CD 🔒

- **npm audit** — detectar dependencias con vulnerabilidades conocidas (CVEs). Paso rápido, bajo esfuerzo, alto impacto.
- **Dependabot** — actualización automática de PRs cuando hay nuevas versiones de dependencias con fixes de seguridad.
- **CodeQL / Semgrep** — análisis estático de código para detectar patrones inseguros (inyección, XSS, etc.).
- **Socket.dev** — detección de paquetes npm maliciosos (supply chain attacks).
- **Prevención de inyección en workflows** — nunca usar `${{ github.event.* }}` directo en `run:`, siempre passarlo como env var.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.