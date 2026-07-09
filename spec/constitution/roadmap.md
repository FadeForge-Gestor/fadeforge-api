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

## Siguiente 🔜

Todavía no se definió cuál es la próxima feature a implementar.

- **<Nombre>** — <una línea de qué resuelve>.

## Backlog / ideas 💡

Todavía no hay ideas registradas en el backlog.

- **<Nombre>** — <qué aportaría>.
- **<Nombre>** — <qué aportaría>.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.