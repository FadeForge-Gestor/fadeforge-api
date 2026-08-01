# Fadeforge API

REST API para un sistema de gestión de citas de barbería. Construida con arquitectura hexagonal, principios SOLID y lógica de negocio explícita en el dominio.

## ¿Qué hace esta API?

Gestiona el ciclo completo de citas de un negocio de barbería:

- Registro y autenticación de clientes y empleados (JWT)
- Verificación de email al registrarse, con reenvío de correos vía Resend y plantillas MJML/Handlebars
- Creación de citas con validación de disponibilidad por empleado (anti-solapamiento)
- Cálculo automático de subtotal, IVA y total según los servicios seleccionados
- Máquina de estados para el ciclo de vida de una cita (`nueva → pendiente → en_proceso → finalizada / cancelada / reprogramada / no_asistio`)
- Historial de precios por servicio
- Control de acceso por rol (admin, empleado, cliente)
- Endpoints POST idempotentes mediante la cabecera `Idempotency-Key` (evita duplicados por reintentos de red o dobles envíos)
- Subida de imágenes de servicios a Cloudinary
- Seguridad en login con rate limiting por IP y por usuario
- Cambio de contraseña y correo por parte del propio usuario
- Documentación interactiva con Swagger UI

> El sistema es **monoinstancia (single-tenant)**: pensado para una sola barbería por instancia. No es una plataforma multi-negocio.

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Lenguaje | TypeScript |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL (multi-schema: citas, seguridad, servicios) |
| Autenticación | JWT + bcrypt |
| Validación | Zod |
| Correos | Resend + MJML + Handlebars |
| Imágenes | Cloudinary + Multer |
| Seguridad | express-rate-limit |
| Testing | Jest + ts-jest |
| Documentación | Swagger UI |

---

## Arquitectura Hexagonal (Ports & Adapters)

El proyecto sigue arquitectura hexagonal estricta. El dominio no depende de ninguna tecnología externa.

```
src/
├── app.ts                       ← Punto de entrada
├── core/                        ← Dominio puro (sin Express, sin Prisma)
│   ├── domain/                  ← Entidades y tipos de dominio
│   ├── ports/
│   │   ├── in/                  ← Interfaces de casos de uso (lo que entra)
│   │   └── out/                 ← Interfaces de repositorios y servicios (lo que sale)
│   └── usecases/                ← Lógica de negocio
│
├── adapters/
│   ├── in/http/                 ← Controllers, routes, validadores Zod, docs Swagger y middlewares por dominio
│   └── out/                     ← Adaptadores de salida
│       ├── db/                  ← Implementaciones Prisma de los repositorios
│       ├── clock/               ← Reloj del sistema (tiempo real)
│       ├── cloudinary/          ← Almacenamiento de imágenes
│       ├── email/               ← Envío de correos (Resend, plantillas MJML)
│       └── memory/              ← Repositorios en memoria (idempotencia)
│
├── config/                      ← env.ts, server.ts, swagger.ts
└── shared/                      ← Errores HTTP, constantes, tipos comunes
```

Los middlewares HTTP viven en `adapters/in/http/middlewares/` (alias `@middlewares`). Los tests unitarios espejan la estructura en `tests/unit/`, y el schema con sus migraciones está en `prisma/`.

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
pendiente → en_proceso, cancelada, reprogramada, no_asistio
en_proceso → finalizada, cancelada
reprogramada → pendiente
no_asistio → cancelada
finalizada / cancelada → (estados terminales, sin transición)
```

Reglas adicionales:
- Marcar como `no_asistio` solo es posible 15 minutos después de la hora de inicio de la cita.
- Cancelar una cita siempre exige un motivo.

### Control de acceso por rol
- `ADMIN`: acceso total a usuarios, empleados, roles (módulo de solo lectura), servicios, categorías, historial de precios y citas.
- `EMPLEADO`: puede listar citas por rango de fechas y cambiarles el estado.
- `CLIENTE`: solo puede ver y crear sus propias citas; no puede ver las de otros.

---

## Endpoints principales

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Login, devuelve JWT |
| POST | `/api/v1/auth/registro` | Registro de cliente (envía verificación por email) |
| GET | `/api/v1/auth/confirmar` | Confirma el email del usuario |
| POST | `/api/v1/auth/reenviar-verificacion` | Reenvía el correo de verificación |

### Administración (solo ADMIN)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/roles` | Listar roles (solo lectura) |
| GET | `/api/v1/admin/usuarios` | Listar usuarios |
| POST | `/api/v1/admin/usuarios` | Crear usuario |
| GET | `/api/v1/admin/empleados` | Listar empleados |
| POST | `/api/v1/admin/empleados` | Promover un usuario a empleado |

### Categorías y servicios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/categorias-servicios` | Listar categorías (público) |
| GET | `/api/v1/servicios/activos` | Listar servicios activos (público) |
| GET | `/api/v1/servicios/:id` | Obtener servicio por ID |
| POST | `/api/v1/servicios` | Crear servicio (admin) |
| POST | `/api/v1/servicios/:id/imagen` | Subir imagen de servicio (admin) |

### Citas

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/citas` | Crear cita (autenticado) |
| GET | `/api/v1/citas` | Listar citas por rango de fechas (admin/empleado) |
| GET | `/api/v1/citas/:id` | Obtener cita por ID |
| GET | `/api/v1/citas/folio/:folio` | Obtener cita por folio |
| PUT | `/api/v1/citas/:id` | Actualizar cita |
| PATCH | `/api/v1/citas/:id/estado` | Cambiar estado de cita (admin/empleado) |

### Historial de precios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/historial-precios/:idServicio/actual` | Precio vigente del servicio |
| GET | `/api/v1/historial-precios/:idServicio` | Historial completo de precios del servicio |
| POST | `/api/v1/historial-precios` | Registrar un nuevo precio (admin) |

### Credenciales

| Método | Ruta | Descripción |
|---|---|---|
| PUT | `/api/v1/credenciales/contrasena` | Cambiar la propia contraseña |
| PUT | `/api/v1/credenciales/correo` | Cambiar el propio correo |
| PUT | `/api/v1/credenciales/:id/reset` | Resetear la contraseña de un usuario (admin) |

Documentación completa disponible en `/api/v1/docs` con Swagger UI.

---

## Decisiones técnicas

### Idempotencia en endpoints POST
Todos los endpoints POST (`/citas`, `/usuarios`, `/empleados`, `/servicios`, `/categorias-servicios`, `/auth/reenviar-verificacion`) soportan peticiones idempotentes mediante la cabecera `Idempotency-Key`. Si se envía la misma clave dos veces, la segunda petición devuelve la respuesta cacheada sin volver a ejecutar la operación. Esto evita registros duplicados causados por reintentos de red o dobles envíos accidentales.

La implementación sigue el patrón hexagonal: un puerto `IIdempotencyRepository` con un adaptador en memoria basado en un `Map` con TTL de 24 horas. Migrar a Redis solo requiere un adaptador nuevo.

### Transacciones ACID
Las operaciones que involucran múltiples escrituras se envuelven en `$transaction` de Prisma para garantizar atomicidad:

- **Creación de usuario**: `usuarios` + `credenciales_usuarios` se crean juntos; si falla la inserción de la credencial, el usuario se revierte.
- **Reemplazo de precio**: cerrar el precio vigente (`fecha_fin`) e insertar el nuevo ocurren en una sola transacción. Antes de esta corrección, una falla en la segunda consulta dejaba al servicio sin precio activo, bloqueando todas las citas futuras que lo incluyeran.

### Eliminación del problema N+1 en la creación de citas
El método `crear` original de `CitasUseCase` ejecutaba 2 consultas por servicio dentro de un bucle `for...of` — `buscarPorId` + `buscarPrecioActual` — resultando en `2×N` consultas secuenciales.

Se reemplazó por dos consultas por lotes en paralelo con `Promise.all` (`buscarPorIds` + `buscarPreciosActuales`), seguidas de búsquedas en memoria con `Map`. Resultado: siempre **2 consultas planas** sin importar cuántos servicios incluya una cita.

### Validación en el dominio
La validación de la contraseña vive en la capa de dominio (`core/domain/usuario/contrasena.ts`), no en el adaptador HTTP. Las reglas de negocio pertenecen al dominio; el controller solo se encarga de recibir y responder peticiones HTTP.

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
- Node.js 24 (ver `.nvmrc`)
- PostgreSQL 14+

### Instalación

```bash
npm install
```

### Variables de entorno

Copia el archivo `.env.template` a `.env` y completá los valores correspondientes. Las variables requeridas se validan al arrancar el servidor en `src/config/env.ts`.

> `.env` está en `.gitignore` y nunca debe subirse al repositorio.

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

### Producción

```bash
npm run build            # compila TypeScript y las plantillas de email
npm start                # arranca el servidor compilado
```
