# FadeForge API

API REST para sistemas de gestión de citas de negocios tipo barbería (agenda, empleados, servicios y clientes).

## Stack

- Lenguaje: TypeScript estricto (`strict: true`)
- Framework / runtime: Node.js + Express 5
- Base de datos: PostgreSQL con Prisma ORM (`@prisma/adapter-pg`)
- Validación: Zod
- Tests: Jest + ts-jest

## Comandos

- `npm run dev`             — arranca el servidor en local (nodemon + ts-node)
- `npm test`                 — ejecuta los tests con Jest (deben pasar antes de cada commit)
- `npm run build`           — compila con `tsc` para producción
- `npm run prisma:migrate`  — corre migraciones de Prisma
- `npm run prisma:generate` — regenera el client de Prisma

No hay linter configurado en el proyecto todavía.

## Estructura del proyecto

```
src/
├── core/
│   ├── domain/        ← Entidades y errores de dominio
│   ├── ports/in/      ← Contratos de casos de uso (interfaces, entrada)
│   ├── ports/out/     ← Contratos de repositorios (interfaces, salida)
│   └── usecases/      ← Lógica de negocio pura
├── adapters/
│   ├── in/http/       ← Controllers, routes, schemas Zod, docs Swagger (por dominio: auth, roles, empleados, citas, etc.)
│   └── out/db/        ← Implementaciones Prisma de los repositorios
├── config/            ← env.ts, server.ts
├── middlewares/       ← auth, error, validate
├── shared/            ← errors, types, utils
└── app.ts

tests/unit/            ← Espeja la estructura de src/ (core, adapters, shared)
prisma/                ← schema.prisma y migraciones
```

## Arquitectura

**Seguridad:** usuarios, roles, credenciales_usuarios, empleados
**Servicios:** categorias_servicios, servicios, historial_precios
**Citas:** citas, detalle_cita

Reglas de negocio clave:
- Un usuario tiene un solo rol; empleados y clientes son usuarios.
- Una cita puede tener múltiples servicios (`detalle_cita`).
- El precio se toma de `historial_precios` (precio vigente) y se guarda en `precio_aplicado`.
- `subtotal = suma(precio_aplicado)`, `iva = subtotal * 0.16`, `total = subtotal + iva`.
- Todo el flujo de creación de cita va en una sola transacción Prisma.
- No permitir citas traslapadas para el mismo empleado.
- No permitir modificar citas finalizadas o canceladas.
- `fecha_fin` siempre debe ser mayor a `fecha_inicio`.

## Convenciones

- Arquitectura hexagonal: las dependencias siempre apuntan hacia adentro. La lógica va en `usecases/`, nunca en controllers ni repositorios. Los controllers solo delegan al use case y responden HTTP. Los repositorios solo hacen queries, sin lógica de negocio.
- Nomenclatura de ramas: `type/descripcion-en-kebab-case`

  | Tipo | Ejemplo |
  |------|---------|
  | `feat/` | `feat/registro-cliente` |
  | `fix/` | `fix/privilege-escalation` |
  | `test/` | `test/registro-usecase` |
  | `refactor/` | `refactor/auth-controller` |

- Commits convencionales obligatorios (mensaje en español, prefijo en inglés):

  ```
  feat(auth): agregar endpoint de registro de cliente
  fix(usuarios): proteger POST /usuarios para solo admins
  test(auth): agregar tests para caso de uso de registro
  ```

- Tests al lado del dominio que cubren, dentro de `tests/unit/`, espejando la ruta de `src/`.
- SOLID aplicado:

  | Principio | Aplicación concreta |
  |-----------|-------------------|
  | **SRP** | Un use case = una responsabilidad. Un endpoint = un comportamiento |
  | **OCP** | Nuevos casos de uso en archivos nuevos, no modificar los existentes |
  | **LSP** | Las implementaciones deben cumplir el contrato de la interfaz al 100% |
  | **ISP** | Interfaces pequeñas por dominio (`IUsuarioRepository`, `IRolRepository`) |
  | **DIP** | Use cases dependen de interfaces, nunca de implementaciones concretas |

## No hagas

- Nunca subas .env al repositorio.
- No exponer credenciales, Apis o Keys.
- **NUNCA commits directo en `main`** — siempre crear rama desde `main` antes de implementar.
- No pongas lógica de negocio en controllers ni repositorios.
- ** No instales una liberia sin antes decirmelo ** - Antes de instalar algo hay que auditarlo.
- No crees un método nuevo de repositorio si ya existe uno que sirve.
- No modifiques interfaces existentes para agregar comportamiento (OCP) — creá un caso de uso nuevo.
- No hardcodees reglas de autorización por rol dentro de un `authorize()` genérico sin revisar `auth.middleware.ts` — ya causó una brecha de seguridad en el módulo de roles.
- No reintroduzcas mutación (`create`/`update`/`activo`) en el módulo de roles: es de solo lectura a propósito desde el refactor `refactor/roles-solo-lectura`.

## Flujo de trabajo

- Trabajamos con **Spec Driven Development**: La spect va antes que el código.

Orden de implementación (inside-out) para todo caso de uso nuevo:

1. Puerto de entrada (`core/ports/in/`) — el contrato
2. Caso de uso (`core/usecases/`) — la lógica
3. Schema Zod (`adapters/in/http/`) — validación HTTP
4. Controller — delega al use case
5. Routes — wire-up de dependencias
6. Docs — Swagger
7. Tests — cubrir el use case

Solo agregar puerto de salida o entidad de dominio si realmente hace falta algo nuevo.

Antes de una tarea no trivial, proponé un plan y esperá el OK. Una tarea a la vez; al terminar, indicá qué cambiaste para revisión.

Toda implementación se avisa antes de comitear: mostrá qué cambió y esperá aprobación explícita. Recién con el OK del usuario hacé `commit` y `push` de forma automática (sin volver a preguntar).

## Documentación

- `README.md` en la raíz — visión general del proyecto.
- Swagger embebido por dominio en `adapters/in/http/<dominio>/`.
