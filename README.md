# Fadeforge API

REST API para un sistema de gestión de citas de barbería. Construida con arquitectura hexagonal, principios SOLID y lógica de negocio explícita en el dominio.

## ¿Qué hace esta API?

Gestiona el ciclo completo de citas de un negocio de barbería:

- Registro y autenticación de clientes y empleados (JWT)
- Creación de citas con validación de disponibilidad por empleado
- Cálculo automático de subtotal, IVA y total según los servicios seleccionados
- Máquina de estados para el ciclo de vida de una cita (`nueva → pendiente → en_proceso → finalizada / cancelada / reprogramada`)
- Historial de precios por servicio
- Control de acceso por rol (admin, empleado, cliente)
- Documentación interactiva con Swagger UI

> El sistema es **single-tenant**: pensado para una sola barbería por instancia. No es una plataforma multi-negocio.

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Lenguaje | TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL (multi-schema) |
| Autenticación | JWT + bcrypt |
| Validación | Zod |
| Testing | Jest + ts-jest |
| Documentación | Swagger UI |

---

## Arquitectura Hexagonal (Ports & Adapters)

El proyecto sigue arquitectura hexagonal estricta. El dominio no depende de ninguna tecnología externa.

```
src/
├── core/                        ← Dominio puro (sin Express, sin Prisma)
│   ├── domain/                  ← Entidades y tipos de dominio
│   ├── ports/
│   │   ├── in/                  ← Interfaces de casos de uso (lo que entra)
│   │   └── out/                 ← Interfaces de repositorios (lo que sale)
│   └── usecases/                ← Lógica de negocio
│
├── adapters/
│   ├── in/http/                 ← Controllers, routes, validadores Zod
│   └── out/db/                  ← Implementaciones Prisma de los repositorios
│
├── config/                      ← Servidor Express, variables de entorno
└── shared/                      ← Errores HTTP, constantes, tipos comunes
```

**Regla central:** los use cases solo conocen interfaces (`IXxxRepository`), nunca implementaciones concretas. Esto hace que la lógica de negocio sea testeable sin base de datos y reemplazable por cualquier otro adaptador.

---

## Principios SOLID aplicados

**Single Responsibility** — cada clase tiene una única razón para cambiar. Los controllers solo reciben la request y delegan; los use cases solo ejecutan lógica de negocio; los repositorios solo hablan con la base de datos.

**Open/Closed** — agregar un nuevo adaptador de salida (ej: MongoDB) no requiere tocar ningún use case; solo implementar la interfaz del puerto correspondiente.

**Liskov Substitution** — los repositorios Prisma son intercambiables con cualquier otra implementación que respete el contrato del puerto.

**Interface Segregation** — cada recurso tiene su propia interfaz de repositorio (`ICitaRepository`, `IServicioRepository`, etc.), sin métodos que los clientes no usen.

**Dependency Inversion** — los use cases reciben sus dependencias por constructor (inyección manual), sin acoplarse a ninguna implementación concreta.

---

## Lógica de negocio destacada

### Creación de cita
Al crear una cita, el sistema:
1. Valida que cliente y empleado existan y estén activos
2. Valida que todos los servicios solicitados existan y tengan precio registrado
3. Calcula `fechaFin` sumando la duración de cada servicio
4. Verifica que el empleado no tenga otra cita en ese rango horario (anti-solapamiento)
5. Calcula subtotal, IVA (16%) y total
6. Genera el folio único de la cita

### Máquina de estados
Las transiciones de estado son explícitas y validadas. No se puede pasar de cualquier estado a cualquier otro:

```
nueva → pendiente, cancelada
pendiente → en_proceso, cancelada, reprogramada
en_proceso → finalizada, cancelada
finalizada / cancelada / no_asistio → (estados terminales, sin transición)
```

### Control de acceso por rol
- `ADMIN`: acceso total a usuarios, empleados y roles
- `EMPLEADO`: puede ver y gestionar sus propias citas
- `CLIENTE`: solo puede ver y crear sus propias citas; no puede ver las de otros

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Login, devuelve JWT |
| GET | `/api/v1/admin/usuarios` | Listar usuarios (admin) |
| POST | `/api/v1/admin/usuarios` | Crear usuario (admin) |
| GET | `/api/v1/servicios` | Listar servicios públicos |
| POST | `/api/v1/citas` | Crear cita |
| GET | `/api/v1/citas/:id` | Obtener cita por ID |
| PATCH | `/api/v1/citas/:id/estado` | Cambiar estado de cita |
| GET | `/api/v1/historial-precios/:id` | Historial de precios de un servicio |

Documentación completa disponible en `/api/v1/docs` con Swagger UI.

---

## Technical decisions

### Idempotency on POST endpoints
All POST endpoints (`/citas`, `/usuarios`, `/empleados`, `/servicios`, `/categorias-servicios`) support idempotent requests via an `Idempotency-Key` header. If the same key is sent twice, the second request returns the cached response without re-executing the operation. This prevents duplicate records caused by network retries or accidental double-submits.

The implementation follows the hexagonal pattern: an `IIdempotencyRepository` port with an in-memory adapter using a `Map` with 24h TTL. Swapping to Redis requires only a new adapter.

### ACID transactions
Operations that involve multiple writes are wrapped in Prisma `$transaction` to guarantee atomicity:

- **User creation**: `usuarios` + `credenciales_usuarios` are created together — if the credential insert fails, the user is rolled back.
- **Price replacement**: closing the current price (`fecha_fin`) and inserting the new one happen in a single transaction. Before this fix, a failure on the second query would leave the service with no active price, blocking all future appointments that include it.

### N+1 elimination in appointment creation
The original `crear` method in `CitasUseCase` ran 2 queries per service inside a `for...of` loop — `buscarPorId` + `buscarPrecioActual` — resulting in `2×N` sequential queries.

Replaced with two bulk queries in parallel via `Promise.all` (`buscarPorIds` + `buscarPreciosActuales`), followed by in-memory `Map` lookups. Result: always **2 flat queries** regardless of how many services an appointment includes.

### Domain validation
Password validation lives in the domain layer (`core/domain/usuario/contrasena.ts`), not in the HTTP adapter. Business rules belong to the domain — the controller is only responsible for receiving and responding to HTTP requests.

---

## Testing

Los tests unitarios cubren la capa de use cases con mocks de repositorios. Esto garantiza que la lógica de negocio se prueba en aislamiento total, sin base de datos ni HTTP.

```bash
npm test                # correr todos los tests
npm run test:coverage   # con reporte de cobertura
npm run test:watch      # modo watch
```

---

## Correr el proyecto

### Requisitos
- Node.js 18+
- PostgreSQL 14+

### Instalación

```bash
npm install
```

### Variables de entorno

Crear un archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/fadeforge"
JWT_SECRET="tu_secreto_aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

### Base de datos

```bash
npm run prisma:migrate   # ejecutar migraciones
npx prisma db seed       # cargar datos iniciales
```

### Desarrollo

```bash
npm run dev
```

La API queda disponible en `http://localhost:3000/api/v1`.
