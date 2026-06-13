---
name: back-gestorweb-conventions
description: >
  Convenciones de trabajo del proyecto back_gestorweb: flujo de ramas, arquitectura hexagonal y principios SOLID.
  Trigger: Antes de implementar cualquier cambio, crear commits o estructurar código nuevo.
license: Apache-2.0
metadata:
  author: VicenteCode
  version: "1.0"
---

## Reglas críticas

### Flujo de trabajo con Git

- **NUNCA commits directo en `main`**
- Siempre crear una rama antes de implementar:

```bash
git checkout -b feat/nombre-feature main
git checkout -b fix/nombre-fix main
```

- Nomenclatura de ramas: `type/descripcion-en-kebab-case`

| Tipo | Ejemplo |
|------|---------|
| `feat/` | `feat/registro-cliente` |
| `fix/` | `fix/privilege-escalation` |
| `test/` | `test/registro-usecase` |
| `refactor/` | `refactor/auth-controller` |

- Commits convencionales obligatorios:

```
feat(auth): agregar endpoint de registro de cliente
fix(usuarios): proteger POST /usuarios para solo admins
test(auth): agregar tests para caso de uso de registro
```

---

### Arquitectura Hexagonal

Estructura de capas — las dependencias siempre apuntan hacia adentro:

```
core/ports/in/        ← Contratos de casos de uso (interfaces)
core/ports/out/       ← Contratos de repositorios (interfaces)
core/usecases/        ← Lógica de negocio pura
adapters/in/http/     ← Controllers, routes, schemas, docs
adapters/out/db/      ← Implementaciones Prisma
```

**Reglas:**
- La lógica va en `usecases/`, nunca en controllers ni repositorios
- Los controllers solo delegan al use case y responden HTTP
- Los repositorios solo hacen queries, sin lógica de negocio
- Si un método ya existe en un repositorio, úsalo — no crear nuevos sin necesidad

---

### Principios SOLID aplicados

| Principio | Aplicación concreta |
|-----------|-------------------|
| **SRP** | Un use case = una responsabilidad. Un endpoint = un comportamiento |
| **OCP** | Nuevos casos de uso en archivos nuevos, no modificar los existentes |
| **LSP** | Las implementaciones deben cumplir el contrato de la interfaz al 100% |
| **ISP** | Interfaces pequeñas por dominio (IUsuarioRepository, IRolRepository) |
| **DIP** | Use cases dependen de interfaces, nunca de implementaciones concretas |

---

### Orden de implementación (inside-out)

1. Puerto de entrada (`core/ports/in/`) — el contrato
2. Caso de uso (`core/usecases/`) — la lógica
3. Schema Zod (`adapters/in/http/`) — validación HTTP
4. Controller — delega al use case
5. Routes — wire-up de dependencias
6. Docs — Swagger
7. Tests — cubrir el use case

Solo agregar puerto de salida o entidad de dominio si realmente hace falta algo nuevo.
