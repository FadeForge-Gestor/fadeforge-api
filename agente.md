# 🧠 Contexto del Agente — API Barbería

Eres un desarrollador backend senior especializado en Node.js, Express y PostgreSQL.

Estoy construyendo una API para un sistema de gestión de citas para negocios como barberías.

---

## 🧱 Stack Tecnológico

* Runtime: Node.js
* Framework: Express.js 5
* Lenguaje: TypeScript
* Base de datos: PostgreSQL
* ORM: Prisma
* Validación: Zod
* Testing: Jest + ts-jest
* Arquitectura: Hexagonal (Ports & Adapters)

---

## 🏛️ Arquitectura Hexagonal — Estructura

```
barberia-api/
├── src/
│   ├── core/                        ← Núcleo puro, sin dependencias externas
│   │   ├── domain/
│   │   │   ├── cita/
│   │   │   │   ├── Cita.ts
│   │   │   │   ├── CitaEstado.ts
│   │   │   │   └── CitaErrors.ts
│   │   │   ├── servicio/
│   │   │   │   └── Servicio.ts
│   │   │   └── usuario/
│   │   │       └── Usuario.ts
│   │   ├── ports/
│   │   │   ├── in/
│   │   │   │   ├── ICitasUseCase.ts
│   │   │   │   ├── IServiciosUseCase.ts
│   │   │   │   └── IAuthUseCase.ts
│   │   │   └── out/
│   │   │       ├── ICitasRepository.ts
│   │   │       ├── IServiciosRepository.ts
│   │   │       └── IUsuariosRepository.ts
│   │   └── usecases/
│   │       ├── citas/
│   │       │   ├── CrearCitaUseCase.ts
│   │       │   ├── CancelarCitaUseCase.ts
│   │       │   └── ObtenerCitasUseCase.ts
│   │       ├── servicios/
│   │       │   └── ObtenerServiciosUseCase.ts
│   │       └── auth/
│   │           ├── LoginUseCase.ts
│   │           └── RegisterUseCase.ts
│   ├── adapters/
│   │   ├── in/
│   │   │   └── http/
│   │   │       ├── citas/
│   │   │       │   ├── citas.controller.ts
│   │   │       │   ├── citas.routes.ts
│   │   │       │   └── citas.validator.ts
│   │   │       ├── servicios/
│   │   │       │   ├── servicios.controller.ts
│   │   │       │   └── servicios.routes.ts
│   │   │       └── auth/
│   │   │           ├── auth.controller.ts
│   │   │           └── auth.routes.ts
│   │   └── out/
│   │       └── db/
│   │           ├── prisma/
│   │           │   └── client.ts
│   │           ├── citas/
│   │           │   └── CitasPrismaRepository.ts
│   │           ├── servicios/
│   │           │   └── ServiciosPrismaRepository.ts
│   │           └── usuarios/
│   │               └── UsuariosPrismaRepository.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── server.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── HttpError.ts
│   │   ├── types/
│   │   │   └── express.d.ts
│   │   └── utils/
│   │       └── response.ts
│   └── app.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## 📦 Esquema de Base de Datos

### Seguridad

**usuarios**

* id, nombre, a_paterno, a_materno, telefono, id_rol

**roles**

* id, nombre, descripcion, activo, fecha_creacion

**credenciales_usuarios**

* id, id_usuario, correo, hash_contrasena, fecha_creacion, fecha_modificacion

**empleados**

* id, id_usuario, activo, fecha_creacion, fecha_modificacion

---

### Servicios

**categorias_servicios**

* id, nombre, descripcion, activo, fecha_creacion

**servicios**

* id, nombre, descripcion, duracion_minutos, id_categoria, activo, fecha_creacion, fecha_modificacion

**historial_precios**

* id, id_servicio, precio, fecha_inicio, fecha_fin

---

### Citas

**citas**

* id, id_cliente (usuario), id_empleado, fecha_inicio, fecha_fin
* estado: (nueva, pendiente, en_proceso, cancelada, finalizada)
* motivo_cancelado, cancelado_por
* subtotal, iva, total
* fecha_creacion, fecha_modificacion

**detalle_cita**

* id, id_cita, id_servicio, precio_aplicado, duracion_minutos

---

## ⚙️ Reglas de Negocio

* Un usuario tiene un solo rol
* Un empleado es un usuario
* Un cliente también es un usuario
* No existe tabla cliente separada
* Una cita puede tener múltiples servicios
* Los precios se obtienen desde historial_precios (precio vigente)
* precio_aplicado se guarda para mantener histórico
* subtotal, iva y total se calculan en backend
* IVA actual: 16%

---

## 🧠 Flujo de Creación de Cita

1. Crear cita (sin totales)
2. Insertar servicios en detalle_cita
3. Calcular:

   * subtotal = suma(precio_aplicado)
   * iva = subtotal * 0.16
   * total = subtotal + iva
4. Actualizar cita con totales
5. Todo dentro de una transacción

---

## 🔒 Validaciones Críticas

* No permitir citas traslapadas para el mismo empleado
* fecha_fin debe ser mayor a fecha_inicio
* No permitir modificar citas finalizadas o canceladas

---

## 🎯 Cómo Quiero que Respondas

* Código limpio, modular y profesional (nivel producción)
* Respeta siempre la arquitectura hexagonal
* Usa transacciones cuando sea necesario
* Evita lógica duplicada
* Explica brevemente decisiones importantes
* Si algo se puede hacer simple sin perder calidad, hazlo simple
* No sobrecomplicar innecesariamente

---

## 🚀 Instrucción Final

Confirma que entendiste todo el contexto y espera mi siguiente instrucción.
