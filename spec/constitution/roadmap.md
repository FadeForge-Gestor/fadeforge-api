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

## Siguiente 🔜

- **Integration tests con PostgreSQL** — service container en CI para tests de integración contra DB real. Requiere carpeta `tests/integration/` y test de los adapters Prisma.

## Backlog / ideas 💡

- **CD (Continuous Deployment)** — deploy automático al mergear a `main`. Pendiente definir plataforma de deploy (Railway, Render, Fly.io, VPS, etc.).

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.