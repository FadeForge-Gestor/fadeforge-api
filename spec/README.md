# spec/ — Spec Driven Development de FadeForge API

Acá vive la documentación de especificación de FadeForge API: primero se escribe la spec, luego el plan, luego las tareas, y solo entonces se toca el código. La `constitution/` ya está rellenada con la misión, el stack y el roadmap del proyecto; cada feature nueva se documenta en su propia carpeta dentro de `features/`.

## Estructura

```
spec/
├── constitution/            ← reglas estables del proyecto (cambian poco)
│   ├── mission.md           ← qué construimos y para quién
│   ├── tech-stack.md        ← tecnologías, convenciones y límites
│   └── roadmap.md           ← orden de las features
└── features/                ← una carpeta por feature
    └── NNN-nombre-feature/
        ├── spec.md          ← qué hace + criterios de aceptación
        ├── plan.md          ← cómo se implementa
        └── tasks.md         ← checklist de tareas
```

## Flujo para una feature nueva

1. Crear `features/NNN-nombre-feature/` con el siguiente número libre (`001`, `002`, …).
2. Escribir `spec.md`: qué hace, por qué y criterios de aceptación medibles.
3. Escribir `plan.md`: enfoque técnico y decisiones, respetando `constitution/tech-stack.md`.
4. Desglosar en `tasks.md` y marcar el progreso.
5. Implementar siguiendo el orden inside-out definido en `AGENTS.md` (puerto → caso de uso → schema Zod → controller → routes → docs → tests), y validar con `npm test`.
6. Actualizar `constitution/roadmap.md` (mover la feature de "Siguiente" a "Hecho").

> La constitución manda: si una feature choca con `mission.md` o `tech-stack.md`, se replantea la feature, no la constitución.
