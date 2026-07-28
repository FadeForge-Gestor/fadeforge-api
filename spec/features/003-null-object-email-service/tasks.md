# 003 · Null Object Pattern para el servicio de email — Tareas

_Checklist accionable derivada del `plan.md`._

## NullEmailService

- [ ] Crear `src/adapters/out/email/nullEmail.service.ts` — implementa `IEmailService` con `enviarVerificacion` no-op.

## auth.routes.ts — Factory

- [ ] Modificar `src/adapters/in/http/auth/auth.routes.ts`:
  - [ ] Cambiar `const emailService = new ResendEmailService()` por factory basado en `EMAIL_VERIFICATION_ENABLED`.
  - [ ] Eliminar ternarios `env.EMAIL_VERIFICATION_ENABLED ? emailService : undefined` en el wiring de `RegistroClienteUseCase`.
  - [ ] Eliminar ternarios `env.EMAIL_VERIFICATION_ENABLED ? confirmarEmailUseCase : undefined` y análogo para `ReenviarVerificacionUseCase` en el wiring de `AuthController`.
  - [ ] Eliminar el bloque `if (env.EMAIL_VERIFICATION_ENABLED)` que rodea las rutas de confirmar/reenviar — las rutas siempre existen (el controller siempre tiene los handlers).

## registroCliente.usecase.ts — IEmailService obligatorio

- [ ] Modificar `src/core/usecases/auth/registroCliente.usecase.ts`:
  - [ ] Cambiar `emailService?: IEmailService` a `emailService: IEmailService`.
  - [ ] Cambiar `tokenVerificacionRepository?: ITokenVerificacionRepository` a `tokenVerificacionRepository: ITokenVerificacionRepository`.
  - [ ] Simplificar condicional de feature toggle: de `!env.EMAIL_VERIFICATION_ENABLED || !this.emailService || !this.tokenVerificacionRepository` a `!env.EMAIL_VERIFICATION_ENABLED`.

## auth.controller.ts — Use cases obligatorios

- [ ] Modificar `src/adapters/in/http/auth/auth.controller.ts`:
  - [ ] Cambiar `confirmarEmailUseCase?: IConfirmarEmailUseCase` a `confirmarEmailUseCase: IConfirmarEmailUseCase`.
  - [ ] Cambiar `reenviarVerificacionUseCase?: IReenviarVerificacionUseCase` a `reenviarVerificacionUseCase: IReenviarVerificacionUseCase`.
  - [ ] Eliminar los guards `if (!this.confirmarEmailUseCase)` y `if (!this.reenviarVerificacionUseCase)`.

## Validación

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Ejecutar `npm run dev` y verificar que arranca sin `RESEND_API_KEY` en `.env`.
- [ ] Verificar que `npm run build` compila sin errores.
