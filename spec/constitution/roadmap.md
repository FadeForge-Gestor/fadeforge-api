# Roadmap

_Orden y estado de las features. Es la vista de "qué hay hecho, qué toca ahora y qué viene". Cada entrada apunta a su carpeta en `features/`._

## Hecho ✅

_Construidas antes de adoptar este flujo SDD, por eso no tienen carpeta en `features/` — quedan documentadas acá como punto de partida._

1. **Autenticación y roles** — login con JWT, control de acceso por rol (admin, empleado, cliente).
2. **Gestión de usuarios y empleados (admin)** — alta de usuarios y empleados, roles de solo lectura.
3. **Servicios y categorías** — CRUD de servicios con historial de precios vigente.
4. **Gestión de citas** — creación con validación de disponibilidad, cálculo de subtotal/IVA/total, máquina de estados (`nueva → pendiente → en_proceso → finalizada / cancelada / reprogramada`), anti-solapamiento por empleado.
5. **Idempotencia en endpoints POST** — evita duplicados en `/citas`, `/usuarios`, `/empleados`, `/servicios`, `/categorias-servicios` ante reintentos de red.
6. **Documentación interactiva** — Swagger UI por dominio.

## Siguiente 🔜

_Lo próximo a abordar. Idealmente una sola feature "en curso" a la vez._

- **<Nombre>** — <una línea de qué resuelve>.

## Backlog / ideas 💡

_Sin comprometer ni ordenar del todo. Ideas que respetan la constitución._

- **<Nombre>** — <qué aportaría>.
- **<Nombre>** — <qué aportaría>.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.