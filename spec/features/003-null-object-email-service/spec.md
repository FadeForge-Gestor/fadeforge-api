# 003 · Null Object Pattern para el servicio de email

**Estado:** propuesta

## Qué hace

Refactoriza el wiring del servicio de email para que la aplicación no explote al arrancar si falta `RESEND_API_KEY`. Implementa el patrón **Null Object**: cuando el email está deshabilitado, se inyecta un `NullEmailService` (no-op) en lugar de pasar `undefined` o construir el servicio real con una key vacía.

## Por qué

Hoy el proyecto tiene dos problemas:

1. **Eager instantiation**: `auth.routes.ts` hace `new ResendEmailService()` al cargar el módulo, incluso cuando `EMAIL_VERIFICATION_ENABLED=false`. Como `env.RESEND_API_KEY` se resuelve a `''` si no está en `.env`, el constructor de `Resend` explota con `"Missing API key"`.

2. **Contrato inseguro**: los casos de uso y el controller reciben `IEmailService? | undefined` y tienen que checkear undefined internamente. Esto viola que la interfaz debería bastar como contrato — el receptor no debería saber si el servicio es real o no.

El Null Object elimina ambos problemas de raíz:

- El **NullEmailService** implementa `IEmailService` con métodos vacíos, nunca falla.
- Se decide qué implementación usar **en un solo lugar** (`auth.routes.ts`), en el momento de construir el grafo de dependencias.
- Los casos de uso y el controller reciben `IEmailService` siempre — no más ternarios, no más `undefined`, no más crashes.

## Criterios de aceptación

- [ ] La aplicación arranca sin `RESEND_API_KEY` en `.env` — no debe lanzar `Error: Missing API key`.
- [ ] Existe un `NullEmailService` que implementa `IEmailService` con métodos no-op.
- [ ] `auth.routes.ts` decide qué servicio inyectar basado en `EMAIL_VERIFICATION_ENABLED`: `ResendEmailService` si está habilitado, `NullEmailService` si no.
- [ ] El caso de uso `RegistroClienteUseCase` recibe `IEmailService` (obligatorio, no opcional).
- [ ] El controller `AuthController` recibe `IConfirmarEmailUseCase` e `IReenviarVerificacionUseCase` (obligatorios, no opcionales).
- [ ] Ningún archivo existente usa `? servicio : undefined` para servicios de email.
- [ ] Todos los tests existentes siguen pasando (`npm test`).
- [ ] No se modifican interfaces, no se agregan dependencias nuevas.

## Fuera de alcance

- Migrar a un DI container (tsyringe, awilix, etc.).
- Validación temprana de env vars al startup (ej. con `envalid` o `zod`).
- Test del NullEmailService (es no-op, no tiene lógica que probar).
- Refactor de otros servicios que también hagan eager instantiation (si los hay).
