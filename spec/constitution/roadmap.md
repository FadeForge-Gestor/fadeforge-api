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
15. **Refactor: lookup de tokens de verificación O(1) con SHA-256** — reemplaza el escaneo O(N) de bcrypt (`findMany` + `bcrypt.compare` cost-10 por request en `/confirmar`) por digest SHA-256 con índice único y `findUnique` O(1). El hashing pasa al repositorio (detalle de persistencia); `crear` recibe el token en claro. Los tokens en vuelo quedan inválidos y los usuarios reenvían por `POST /reenviar-verificacion` (flujo existente). Cierra la amplificación de CPU del endpoint. [Spec](refactors/002-proteccion-dos-auth/spec.md)
16. **Rate limiting por IP en toda la API** — límite global por IP sobre `/api/v1` (100 req/15min por defecto, configurable por env) con mensaje 429 de "Demasiadas solicitudes desde esta IP", más límites estrictos por endpoint en los endpoints públicos de auth: `POST /registro` (5/15min), `GET+POST /confirmar` (30/15min, contador compartido) y `POST /reenviar-verificacion` (5/15min), con `express-rate-limit`. Requirió `app.set('trust proxy', 1)` en `server.ts` (NUNCA `true`: permite spoofear `X-Forwarded-For`). No detiene botnets (eso es del edge: Cloudflare DDoS/bot management) ni sustituye el firewall de origen. El dinero de Resend se protege de verdad con los límites por usuario en DB (ya existentes); la IP solo corta el volumen bruto. [Spec](features/007-rate-limit-ip/spec.md)

## Siguiente 🔜

- **Integration tests con PostgreSQL** — service container en CI para tests de integración contra DB real. Requiere carpeta `tests/integration/` y test de los adapters Prisma.

## Backlog / ideas 💡

- **Refactor: anti-enumeración en `POST /reenviar-verificacion`** — el 404 actual para correos inexistentes filtra cuentas registradas (oráculo de emails para el atacante); respuesta uniforme (200 con el mismo mensaje) para correo inexistente vs no verificado. Nivel 3 de la [spec 002](refactors/002-proteccion-dos-auth/spec.md), fuera de alcance del refactor actual.
- **Outbox pattern para correos (garantía de entrega)** — sistema de colas sin infraestructura nueva: tabla `correos_pendientes` en PostgreSQL + worker con reintentos y backoff para envíos de email fallidos. Hoy los correos (verificación y bienvenida) son best-effort: si el envío falla, se loguea y se pierde (decisión de la feature 005/006). Un outbox lo convierte en at-least-once, sobrevive reinicios y sirve para los correos transaccionales futuros (recordatorio de turno, factura, etc.). Requiere: tabla nueva, worker, política de reintentos/dead-letter y tests.
- **Deuda técnica: renombrar `IEmailService` → `IEmailPort`** — los puertos de salida que representan servicios externos (no persistencia) conviven con dos nomenclaturas: `IStoragePort`/`IClockPort` usan sufijo `Port`, `IEmailService` usa `Service`. Unificar a `IEmailPort` para consistencia. Refactor cosmético: toca puerto, `ResendEmailService`, `NullEmailService`, use cases y tests. NO es un `Repository` (no persiste datos) — la excepción al sufijo `Repository` es correcta.
- **CD (Continuous Deployment)** — deploy automático al mergear a `main`. Pendiente definir plataforma de deploy (Railway, Render, Fly.io, VPS, etc.).
- **Feature en evaluación: puestos o rangos de empleados** — agregar un puesto/rango a los empleados (ej. barbero junior/senior, estilista, manitas). Requiere decidir el modelo: campo `puesto` en `empleados` vs tabla `puestos_empleados`; si el precio de un servicio depende del puesto que lo ejecuta; y cómo afecta la asignación de citas. Aún sin decisión de diseño → spec pendiente.

### Mejoras por módulo — revisión de endpoints (06/08/2026)

_Revisión de los módulos fuera de auth (categorias-servicios, citas, credenciales, detalle-cita, empleados, historial-precios, roles, servicios, usuarios). El módulo de auth está más maduro; estos items acercan el resto a ese nivel. Orden sugerido: seguridad primero, integridad después, limpieza al final._

**Seguridad / control de acceso**

- **detalle-cita: IDOR** — `GET /detalle-cita/cita/:idCita` solo exige `authenticate`; cualquier cliente autenticado ve servicios y precio aplicado de cualquier cita. Validar propiedad (cliente dueño) o rol interno, igual que `citas.usecase.ts` con `validarAcceso`.
- **empleados: `promover` no cambia el rol** — `POST /admin/empleados` crea la fila en `empleados` pero no toca `usuarios.id_rol`; sin embargo los endpoints de empleado autorizan por rol (`authorize(ROLES.EMPLEADO)`). Decidir: transacción que cambie el rol, o `authorize` que consulte la tabla `empleados`.
- **credenciales: `cambiarCorreo` no re-verifica** — con verificación de email activa, el correo nuevo queda con `email_verificado` como estaba. Debe setear `false` y disparar el reenvío de verificación. Edge: cambiar al mismo correo da 409 porque encuentra la propia credencial.
- **citas: `canceladoPor` desde el actor** — viene del body sin validar; un empleado puede atribuir la cancelación a otro id. Tomarlo de `req.user.id`.

**Integridad de datos**

- **citas: `actualizar` sin validar `fechaFin`** — el schema permite `fechaFin` libre sin `fecha_fin > fecha_inicio` (regla del AGENTS) ni recálculo desde la duración de los servicios. El cliente puede romper la regla.
- **citas: race condition TOCTOU en solapamiento** — el check de solapamiento y el create son queries separadas; dos POST simultáneos pueden doble-agendar al mismo empleado. Evaluar transacción con aislamiento serializable o lock por empleado.

**Robustez / consistencia**

- **validateParams en `:id`** — citas, usuarios, empleados, servicios, categorías, historial y `credenciales/:id` usan `Number(req.params.id)` crudo (NaN → 500). Solo roles y detalle-cita validan params con Zod.
- **Exposición pública inconsistente** — `GET /categorias-servicios/` lista TODAS (incl. desactivadas) sin auth, mientras `GET /servicios/` exige admin. El historial completo de precios es público. Revisar qué debería ser público.
- **Doble authz** — `adminRouter` en `server.ts` aplica `authenticate, authorize(ADMIN)` y cada route de roles/usuarios/empleados lo repite → JWT verificado 2 veces por request.
- **Semántica HTTP de acciones** — `PUT /:id/desactivar` y `/:id/reactivar` (usuarios, empleados, servicios, categorías) vs `PATCH /:id/estado` en citas. Unificar criterio.
- **Paginación en listados** — ninguno de los `GET` de colección pagina (usuarios, citas, servicios, empleados).
- **Idempotency en memoria** — `IdempotencyMemoryRepository` no sobrevive reinicios ni sirve multi-instancia; evaluar persistencia en PostgreSQL o Redis.

### Seguridad CI/CD 🔒

- **npm audit** — detectar dependencias con vulnerabilidades conocidas (CVEs). Paso rápido, bajo esfuerzo, alto impacto.
- **Dependabot** — actualización automática de PRs cuando hay nuevas versiones de dependencias con fixes de seguridad.
- **CodeQL / Semgrep** — análisis estático de código para detectar patrones inseguros (inyección, XSS, etc.).
- **Socket.dev** — detección de paquetes npm maliciosos (supply chain attacks).
- **Prevención de inyección en workflows** — nunca usar `${{ github.event.* }}` directo en `run:`, siempre passarlo como env var.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.