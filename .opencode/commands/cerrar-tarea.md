---
description: Cierra una tarea — tests, diff, OK explícito, commit convencional, push y PR
agent: build
---

Cerrá la tarea actual siguiendo el flujo documentado en `AGENTS.md` (sección "Flujo de trabajo" y "No hagas").

PASOS (uno a la vez, no saltear ninguno):

1. Correr `npm test`. Si falla algo, PARAR y mostrar el fallo — no seguir al siguiente paso hasta que pasen todos los tests.
2. Mostrar `git status` y `git diff` (staged + unstaged) para que se vea exactamente qué cambió.
3. Redactar el mensaje de commit siguiendo la convención del repo:
   - Formato: `tipo(scope): descripción en español`
   - `tipo` en inglés: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`
   - Un commit por responsabilidad lógica (no mezclar features con fixes no relacionados)
4. Verificar la rama actual con `git branch --show-current`:
   - Si es `main`, PARAR y avisar — nunca commitear directo en main. Proponer crear rama `tipo/descripcion-en-kebab-case` primero.
5. Mostrar el mensaje de commit propuesto y ESPERAR el OK explícito del usuario. No continuar sin aprobación.
6. Con el OK, hacer `git add` (solo los archivos relevantes, nunca `-A` a ciegas), `git commit`, y `git push` — esto sí es automático una vez dado el OK, sin volver a preguntar.
7. Si la rama tiene upstream configurado y el repo usa PRs (ver `gh pr create` disponible), ofrecer abrir el PR. Si no, solo confirmar que el push se hizo.

CONTEXTO:
- Rama actual: !`git branch --show-current`
- Estado: !`git status --short`
- Argumento (contexto extra si lo dieron): $ARGUMENTS

Recordá: nunca subir `.env`, nunca exponer credenciales, nunca commitear sin que los tests pasen.
