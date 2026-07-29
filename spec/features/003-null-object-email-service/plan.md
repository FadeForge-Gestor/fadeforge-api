# 003 · Null Object Pattern para el servicio de email — Plan

_Cómo se implementa lo descrito en `spec.md`._

## Enfoque

Aplicar **Null Object Pattern**: una implementación no-op de `IEmailService` que se inyecta cuando `EMAIL_VERIFICATION_ENABLED=false`. Esto elimina el crash al startup y normaliza el contrato — los consumidores siempre reciben un `IEmailService` real, nunca `undefined`.

El cambio es mínimo y localizado:

1. Crear `NullEmailService` → 1 archivo nuevo (~10 líneas)
2. Modificar `auth.routes.ts` → cambiar la instanciación y wiring (~5 líneas)
3. Modificar `registroCliente.usecase.ts` → `IEmailService` deja de ser opcional (~3 líneas)
4. Modificar `auth.controller.ts` → `IConfirmarEmailUseCase` e `IReenviarVerificacionUseCase` dejan de ser opcionales (~5 líneas)

No se tocan interfaces, no se agregan librerías, no se cambian tests de lógica de negocio.

## Implementación

### 1. NullEmailService

```
src/adapters/out/email/nullEmail.service.ts
```

```typescript
import { IEmailService } from '@core/ports/out/email/IEmailService';

export class NullEmailService implements IEmailService {
    async enviarVerificacion(_correo: string, _token: string): Promise<void> {
        // No-op: email verification is disabled
    }
}
```

Misma carpeta que `resendEmail.service.ts`, mismo path de importación.

### 2. auth.routes.ts — factory del servicio

Reemplazar:

```typescript
const emailService = new ResendEmailService();
```

Por:

```typescript
const emailService = env.EMAIL_VERIFICATION_ENABLED
    ? new ResendEmailService()
    : new NullEmailService();
```

Y eliminar los ternarios en el wiring de `RegistroClienteUseCase`, `AuthController` y `ReenviarVerificacionUseCase` — ahora `emailService`, `confirmarEmailUseCase` y `reenviarVerificacionUseCase` siempre existen.

### 3. registroCliente.usecase.ts — IEmailService obligatorio

Cambiar el constructor de:

```typescript
private readonly emailService?: IEmailService,
private readonly tokenVerificacionRepository?: ITokenVerificacionRepository,
```

A:

```typescript
private readonly emailService: IEmailService,
private readonly tokenVerificacionRepository: ITokenVerificacionRepository,
```

Y simplificar el condicional de la línea 53:

```typescript
if (!env.EMAIL_VERIFICATION_ENABLED) {
```

Ya no necesita checkear `!this.emailService || !this.tokenVerificacionRepository`.

### 4. auth.controller.ts — use cases obligatorios

El constructor:

```typescript
private readonly confirmarEmailUseCase?: IConfirmarEmailUseCase,
private readonly reenviarVerificacionUseCase?: IReenviarVerificacionUseCase,
```

Pasa a:

```typescript
private readonly confirmarEmailUseCase: IConfirmarEmailUseCase,
private readonly reenviarVerificacionUseCase: IReenviarVerificacionUseCase,
```

Y eliminar los `if (!this.confirmarEmailUseCase)` y `if (!this.reenviarVerificacionUseCase)` — el controller siempre recibe una implementación real o Null Object.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/adapters/out/email/nullEmail.service.ts` | **Nuevo** — NullEmailService |
| `src/adapters/in/http/auth/auth.routes.ts` | Factory del servicio + eliminar ternarios |
| `src/core/usecases/auth/registroCliente.usecase.ts` | `IEmailService` deja de ser opcional |
| `src/adapters/in/http/auth/auth.controller.ts` | Use cases dejan de ser opcionales |

## Decisiones

- **Null Object vs Factory vs DI container**: Null Object es el patrón más simple que soluciona el problema. No agrega dependencias ni cambia la estructura del proyecto. Una Factory sería overengineering para un solo servicio. DI container está fuera de alcance (no tenemos ni justificación para agregarlo aún).
- **NullEmailService en `adapters/out/email/`**: misma carpeta que `ResendEmailService`. Es un adapter de salida como cualquier otro. Cohesión: todos los servicios de email en el mismo lugar.
- **El flag `EMAIL_VERIFICATION_ENABLED` decide en la capa de routing, no en los casos de uso**: la lógica de negocio no sabe si el email es real o fake. El toggle de feature se resuelve al construir el grafo de dependencias, que es su lugar natural.
- **No se agregan tests para NullEmailService**: es un no-op sin condición ni estado. Testearlo sería testear que TypeScript compila. Si en el futuro se agrega logging, ahí sí valdría la pena.

## Riesgos

- **Ninguno significativo**. Los cambios son puramente estructurales. Todos los paths existentes se mantienen, solo se normalizan parámetros opcionales a obligatorios. Los tests existentes siguen pasando porque las dependencias se inyectan igual.
