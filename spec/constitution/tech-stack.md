# Tech stack y convenciones

FadeForge API es una REST API construida con arquitectura hexagonal, principios SOLID y lógica de negocio explícita en el dominio, sobre Node.js + TypeScript estricto. Ningún plan de feature debería contradecir lo que está definido acá: si una tarea pide romper una de estas reglas, se replantea la tarea, no este documento.

## Tecnologías

- **Lenguaje:** TypeScript estricto (`strict: true`)
- **Framework / runtime:** Node.js + Express 5
- **Base de datos:** PostgreSQL (multi-schema) con Prisma ORM (`@prisma/adapter-pg`)
- **Validación:** Zod
- **Autenticación:** JWT + bcrypt
- **Tests:** Jest + ts-jest — deben pasar antes de cada commit
- **Documentación API:** Swagger UI, embebida por dominio en `adapters/in/http/<dominio>/`
- **Despliegue:** no definido todavía en el proyecto.

## Archivos / módulos clave

- `src/core/domain/` — entidades y errores de dominio, sin dependencias externas.
- `src/core/ports/in/` — contratos de casos de uso (interfaces de entrada).
- `src/core/ports/out/` — contratos de repositorios (interfaces de salida).
- `src/core/usecases/` — lógica de negocio pura; nunca conoce implementaciones concretas.
- `src/adapters/in/http/` — controllers, routes, schemas Zod y docs Swagger, organizados por dominio (auth, roles, empleados, citas, etc.).
- `src/adapters/out/db/` — implementaciones Prisma de los repositorios.
- `src/config/` — `env.ts`, `server.ts`.
- `src/middlewares/` — auth, error, validate.
- `src/shared/` — errores HTTP, tipos y utils comunes.
- `tests/unit/` — espeja la estructura de `src/` (core, adapters, shared).
- `prisma/` — `schema.prisma` y migraciones.

## Comandos

- `npm run dev` — arranca el servidor en local (nodemon + ts-node).
- `npm test` — corre los tests con Jest.
- `npm run test:coverage` — tests con reporte de cobertura.
- `npm run test:watch` — tests en modo watch.
- `npm run build` — compila con `tsc` para producción.
- `npm run prisma:migrate` — corre migraciones de Prisma.
- `npm run prisma:generate` — regenera el client de Prisma.
- No hay linter configurado en el proyecto todavía.

## Modelo de datos / dominio

- **Seguridad:** `usuarios`, `roles`, `credenciales_usuarios`, `empleados` — un usuario tiene un solo rol; empleados y clientes son usuarios.
- **Servicios:** `categorias_servicios`, `servicios`, `historial_precios` — el precio vigente se toma de `historial_precios` y se congela en `precio_aplicado` al momento de la cita.
- **Citas:** `citas`, `detalle_cita` — una cita puede tener múltiples servicios.
- `subtotal = suma(precio_aplicado)`, `iva = subtotal * 0.16`, `total = subtotal + iva`.
- Todo el flujo de creación de cita corre en una sola transacción Prisma.
- No se permiten citas traslapadas para el mismo empleado.
- No se pueden modificar citas finalizadas o canceladas.
- `fecha_fin` siempre debe ser mayor a `fecha_inicio`.
- Máquina de estados de una cita: `nueva → pendiente/cancelada`, `pendiente → en_proceso/cancelada/reprogramada`, `en_proceso → finalizada/cancelada`; `finalizada`, `cancelada` y `no_asistio` son terminales sin transición.

## Convenciones

- Arquitectura hexagonal estricta: las dependencias siempre apuntan hacia adentro. La lógica de negocio va solo en `usecases/`, nunca en controllers ni repositorios.
- Orden inside-out para todo caso de uso nuevo: puerto de entrada → caso de uso → schema Zod → controller → routes → docs Swagger → tests.
- Nomenclatura de ramas: `type/descripcion-en-kebab-case` (`feat/`, `fix/`, `test/`, `refactor/`).
- Commits convencionales obligatorios, mensaje en español con prefijo en inglés (ej. `feat(auth): agregar endpoint de registro de cliente`).
- Tests unitarios en `tests/unit/`, espejando la ruta de `src/`; cubren use cases con mocks de repositorios, sin base de datos ni HTTP.
- SOLID aplicado en todo el dominio: SRP (un use case = una responsabilidad), OCP (casos de uso nuevos en archivos nuevos), LSP (implementaciones cumplen el contrato al 100%), ISP (interfaces pequeñas por dominio), DIP (use cases dependen de interfaces, nunca de implementaciones).

## Límites duros

- Nunca subir `.env` al repositorio; no exponer credenciales, APIs ni keys.
- **Nunca commits directos en `main`** — siempre crear rama desde `main` antes de implementar.
- No poner lógica de negocio en controllers ni repositorios.
- No instalar una librería sin avisar antes — se audita primero.
- No crear un método nuevo de repositorio si ya existe uno que sirve.
- No modificar interfaces existentes para agregar comportamiento (rompe OCP) — crear un caso de uso nuevo.
- No hardcodear reglas de autorización por rol dentro de un `authorize()` genérico sin revisar `auth.middleware.ts` — ya causó una brecha de seguridad en el módulo de roles.
- No reintroducir mutación (`create`/`update`/`activo`) en el módulo de roles: es de solo lectura a propósito desde `refactor/roles-solo-lectura`.