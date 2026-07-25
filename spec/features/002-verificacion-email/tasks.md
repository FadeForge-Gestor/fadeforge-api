# 002 · Verificación de correo electrónico — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

## Base de datos

- [ ] Crear migración de Prisma para la tabla `tokens_verificacion` en schema `seguridad`.
- [ ] Agregar columna `email_verificado Boolean @default(false)` a `credenciales_usuarios`.
- [ ] Ejecutar `npm run prisma:generate` para regenerar el client.

## Core — Dominio

- [ ] Crear `core/domain/email/verificationToken.ts` — función `generarToken()` y `calcularExpiracion()`.

## Core — Puertos de salida

- [ ] Crear `core/ports/out/email/IEmailService.ts` — interface con `enviarVerificacion(correo, token)`.
- [ ] Crear `core/ports/out/email/ITokenVerificacionRepository.ts` — interface con `crear(idUsuario, tokenHash, expiraEn)`, `buscarPorTokenHash(tokenHash)`, `eliminarPorIdUsuario`, `contarEnviosHoy`.

## Core — Puertos de entrada

- [ ] Crear `core/ports/in/auth/IConfirmarEmailUseCase.ts` — interface con `confirmar(token)`.
- [ ] Crear `core/ports/in/auth/IReenviarVerificacionUseCase.ts` — interface con `reenviar(correo)`.

## Core — Casos de uso

- [ ] Crear `core/usecases/auth/confirmarEmail.usecase.ts` — hashear token recibido con bcrypt, buscar por hash, validar expiración, eliminar, marcar `email_verificado: true`.
- [ ] Crear `core/usecases/auth/reenviarVerificacion.usecase.ts` — rate limit 3/día, eliminar token anterior, generar nuevo, hashear, guardar hash, enviar token plano por email.
- [ ] Modificar `core/usecases/auth/registroCliente.usecase.ts` — inyectar dependencias, generar token + hashear si `EMAIL_VERIFICATION_ENABLED=true`, cambiar output.

## Adapters — Salida

- [ ] Crear `adapters/out/email/resendEmail.service.ts` — implementa `IEmailService` con Resend SDK.
- [ ] Crear `adapters/out/email/tokenVerificacion.prisma.repository.ts` — implementa `ITokenVerificacionRepository`, almacena hashes bcrypt y busca con `bcrypt.compare`.

## Configuración

- [ ] Modificar `config/env.ts` — agregar `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_VERIFICATION_ENABLED`, `EMAIL_VERIFICATION_EXPIRES_IN_HOURS`, `FRONTEND_URL`.

## HTTP layer

- [ ] Crear schema `reenviarVerificacionSchema` en `auth.schema.ts`.
- [ ] Modificar `auth.controller.ts` — nuevos métodos `confirmarEmail` y `reenviarVerificacion`.
- [ ] Modificar `auth.routes.ts` — nuevas rutas `GET /confirmar` y `POST /reenviar-verificacion`, wiring de dependencias. Aplicar middleware `idempotency` en `POST /reenviar-verificacion` (reutilizar `IdempotencyMemoryRepository` e `idempotency.middleware.ts` existentes).
- [ ] Actualizar `auth.docs.ts` — documentación Swagger de los nuevos endpoints (incluir header `Idempotency-Key` en documentación).

## Tests

- [ ] Actualizar `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts` — mock de `IEmailService` + `ITokenVerificacionRepository`, cubrir enabled/disabled.
- [ ] Crear `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts` — token válido, token expirado, token inexistente.
- [ ] Crear `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts` — reenvío exitoso, rate limit alcanzado.

## Validación

- [ ] Ejecutar `npm test` y verificar que todos los tests pasan.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
