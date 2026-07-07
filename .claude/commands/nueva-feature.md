---
description: Scaffold de un caso de uso nuevo siguiendo el orden inside-out de arquitectura hexagonal de FadeForge API
argument-hint: <nombre-del-caso-de-uso>
---

Implementá el caso de uso "$ARGUMENTS" siguiendo ESTRICTAMENTE el orden inside-out definido en `AGENTS.md`. No saltear pasos ni adelantarte (por ejemplo, no escribas el controller antes que el caso de uso).

ORDEN OBLIGATORIO:

1. **Puerto de entrada** (`core/ports/in/`) — el contrato del caso de uso.
2. **Caso de uso** (`core/usecases/`) — la lógica de negocio pura. Sin dependencias de Express ni Prisma directamente (DIP: depende de interfaces `ports/out/`).
3. **Schema Zod** (`adapters/in/http/<dominio>/`) — validación de entrada HTTP.
4. **Controller** — solo delega al caso de uso y traduce la respuesta a HTTP. Cero lógica de negocio acá.
5. **Routes** — wire-up de dependencias (inyección del repositorio real).
6. **Swagger** — documentar el endpoint en el archivo de docs del dominio.
7. **Tests** — cubrir el caso de uso en `tests/unit/`, espejando la ruta de `src/`.

Antes de empezar, si no existe todavía, verificá si hace falta un puerto de salida nuevo (`ports/out/`) o una entidad de dominio nueva — solo agregalo si REALMENTE hace falta algo que no existe.

REGLAS DEL REPO (de `AGENTS.md`):
- No pongas lógica de negocio en controllers ni repositorios.
- No crees un método de repositorio nuevo si ya existe uno que sirva.
- No modifiques interfaces existentes para agregar comportamiento — creá un caso de uso nuevo (OCP).
- Si el caso de uso toca autorización por rol, revisá `auth.middleware.ts` primero — no hardcodees reglas ahí.
- Antes de tocar código, proponé el plan (qué archivos vas a crear/tocar en cada paso) y esperá el OK. Es una tarea no trivial.

CONTEXTO:
- Rama actual: !`git branch --show-current`
- Caso de uso a implementar: $ARGUMENTS

Al terminar cada paso del orden inside-out, indicá brevemente qué se agregó antes de pasar al siguiente. Al final, no commitees — para eso está `/cerrar-tarea`.
