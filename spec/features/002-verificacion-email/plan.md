# 002 · Verificación de correo electrónico — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Flujo de verificación vía email usando Resend, siguiendo arquitectura hexagonal y el orden inside-out:

1. **Puerto de salida `IEmailService`** — abstracción para enviar emails. El use case no conoce Resend.
2. **Puerto de salida `ITokenVerificacionRepository`** — persistencia de tokens de verificación.
3. **Adapter `ResendEmailService`** — implementación con Resend (SDK oficial, gratis 100 emails/día).
4. **Adapter `TokenVerificacionPrismaRepository`** — CRUD sobre tabla `tokens_verificacion`.
5. **Casos de uso nuevos** — `ConfirmarEmailUseCase` y `ReenviarVerificacionUseCase` en archivos nuevos (OCP).
6. **Modificar `RegistroClienteUseCase`** — inyectar `IEmailService` + `ITokenVerificacionRepository`, generar token y enviar email después de crear el usuario.
7. **Nuevas rutas** — `GET /auth/confirmar` y `POST /auth/reenviar-verificacion`.
8. **Feature toggle** — `EMAIL_VERIFICATION_ENABLED` en `env.ts` controla si se aplica el flujo completo o se retorna JWT inmediato.
9. **Idempotency** — aplicar middleware `idempotency` existente en `POST /auth/reenviar-verificacion` para prevenir emails duplicados. Reutiliza `IdempotencyMemoryRepository` e `idempotency.middleware.ts` ya implementados.

## Modelo de datos

Nueva tabla `tokens_verificacion` en el schema `seguridad`:

```prisma
model tokens_verificacion {
  id          Int      @id @default(autoincrement())
  id_usuario  Int      @unique
  token_hash  String   @db.VarChar(60)   // bcrypt hash, NO el token en plano
  expira_en   DateTime @db.Timestamptz(6)
  creado_en   DateTime @default(now()) @db.Timestamptz(6)
  usuarios    usuarios @relation(fields: [id_usuario], references: [id], onDelete: Cascade)
  @@schema("seguridad")
}
```

**Seguridad del token:** El token en sí (UUID v4) se envía por email en texto plano. En la DB se almacena solo el **hash bcrypt** del token. Cuando el usuario envía el token de vuelta, se hashea y se compara con el almacenado. Si alguien roba la DB, no puede usar los tokens directamente.

Nueva columna `email_verificado` en la tabla `credenciales_usuarios`:

```prisma
// En model credenciales_usuarios, agregar:
email_verificado Boolean @default(false)
```

## Implementación

### Dominio
1. `core/domain/email/verificationToken.ts` — función `generarToken(): string` (UUID v4) y función `calcularExpiracion(hours: number): Date`.

### Puertos de salida
2. `core/ports/out/email/IEmailService.ts` — interface con `enviarVerificacion(correo: string, token: string): Promise<void>`.
3. `core/ports/out/email/ITokenVerificacionRepository.ts` — interface con `crear(idUsuario, tokenHash, expiraEn)`, `buscarPorTokenHash(tokenHash)`, `eliminarPorIdUsuario(idUsuario)`, `contarEnviosHoy(idUsuario)`.

### Adapters de salida
4. `adapters/out/email/resendEmail.service.ts` — implementa `IEmailService` usando `new Resend(env.RESEND_API_KEY)`. Construye link `${env.FRONTEND_URL}/confirmar?token=${token}`. HTML template simple.
5. `adapters/out/email/tokenVerificacion.prisma.repository.ts` — implementa `ITokenVerificacionRepository` sobre tabla `tokens_verificacion`. **IMPORTANTE:** almacena `bcrypt.hash(token, 10)` y busca con `bcrypt.compare(token, hash)`. **Lazy deletion:** `buscarPorTokenHash` elimina todos los tokens expirados antes de buscar (mismo patrón que `loginSecurity.prisma.repository.obtenerEstado`).

### Puertos de entrada
6. `core/ports/in/auth/IConfirmarEmailUseCase.ts` — interface con `confirmar(token: string): Promise<void>`.
7. `core/ports/in/auth/IReenviarVerificacionUseCase.ts` — interface con `reenviar(correo: string): Promise<void>`.

### Casos de uso
8. `core/usecases/auth/confirmarEmail.usecase.ts` — hashea el token recibido con bcrypt, busca por hash en DB, valida expiración, elimina token, marca `email_verificado: true`.
9. `core/usecases/auth/reenviarVerificacionUseCase.ts` — valida rate limit (3 reenvíos/día), elimina token anterior, genera nuevo token, hashea, guarda hash en DB, envía token plano por email.
10. **Modificar** `core/usecases/auth/registroCliente.usecase.ts` — inyectar `IEmailService` + `ITokenVerificacionRepository` + `ICredencialRepository`. Después de crear usuario: si `EMAIL_VERIFICATION_ENABLED=true`, generar token, hashear con bcrypt, guardar hash en DB, enviar token plano por email, retornar `{ mensaje, usuario }`. Si `false`, retornar JWT como hasta ahora.

### Configuración
11. **Modificar** `config/env.ts` — agregar `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_VERIFICATION_ENABLED`, `EMAIL_VERIFICATION_EXPIRES_IN_HOURS`, `FRONTEND_URL`.

### HTTP layer
12. `adapters/in/http/auth/auth.schema.ts` — nuevo schema `reenviarVerificacionSchema`.
13. `adapters/in/http/auth/auth.controller.ts` — nuevos métodos `confirmarEmail` y `reenviarVerificacion`.
14. `adapters/in/http/auth/auth.routes.ts` — nuevas rutas, wiring de dependencias. `POST /reenviar-verificacion` aplica middleware `idempotency` (reutiliza `IdempotencyMemoryRepository` e `idempotency.middleware.ts` existentes).
15. `adapters/in/http/auth/auth.docs.ts` — documentación Swagger de los nuevos endpoints (incluir header `Idempotency-Key` en documentación).

### Tests
16. `tests/unit/core/usecases/auth/registroCliente.usecase.test.ts` — actualizar: mock de `IEmailService` + `ITokenVerificacionRepository`, cubrir ambos caminos (enabled/disabled).
17. `tests/unit/core/usecases/auth/confirmarEmail.usecase.test.ts` — token válido, token expirado, token inexistente.
18. `tests/unit/core/usecases/auth/reenviarVerificacion.usecase.test.ts` — reenvío exitoso, rate limit alcanzado.

## Decisiones

- **Resend como proveedor** — SDK oficial de Node.js, 100 emails/día gratis, dominio por defecto `onboarding@resend.dev` sin verificar nada. Cuando se necesite producción, se verifica un dominio real. La abstracción `IEmailService` permite cambiar a cualquier otro proveedor sin tocar lógica de negocio.
- **Token UUID v4 hasheado con bcrypt** — el token en sí es un UUID v4 (simple, sin dependencia de `JWT_SECRET`). Se almacena en la DB como hash bcrypt (misma protección que las contraseñas). Cuando el usuario envía el token, se hashea y se compara. Si alguien roba la DB, los tokens no le sirven. La diferencia con contraseñas: los tokens son de un solo uso y de corta vida (24h), pero la protección adicional es trivial de implementar y no tiene costo.
- **Tabla separada `tokens_verificacion`** en vez de campos en `credenciales_usuarios` — SRP. Cada concepto tiene su tabla. La tabla tiene cascade delete: si se borra el usuario, se borran sus tokens.
- **Columna `email_verificado` en `credenciales_usuarios`** en vez de tabla separada — es un flag booleano simple, no justifica una tabla nueva. Vive en `credenciales_usuarios` porque es una propiedad de la credencial del usuario.
- **Feature toggle vía env var** — permite desactivar la verificación en desarrollo sin cambiar código. Cuando `EMAIL_VERIFICATION_ENABLED=false`, el registro se comporta como antes (retorna JWT inmediato).
- **Rate limit de reenvío en DB** — 3 reenvíos máximo por usuario. Se cuentan los envíos del día actual en `tokens_verificacion.creado_en`. No se usa express-rate-limit porque esto es lógica de negocio, no HTTP.
- **El registro no se bloquea si el email falla** — el usuario queda registrado pero sin JWT. Puede reenviar la verificación después. Esto es mejor que fallar el registro completo (el usuario perdería tiempo rellenando el form).
- **El token se envía en query string** (`/auth/confirmar?token=xxx`) — estándar de la industria para links de verificación por email. El frontend recibe el parámetro y muestra el resultado.
- **Idempotency en reenvío** — `POST /auth/reenviar-verificacion` usa el middleware `idempotency` existente con `IdempotencyMemoryRepository`. El cliente envía un `Idempotency-Key` header; si la key ya fue procesada, se retorna la respuesta cacheada sin enviar email duplicado. Triple capa de protección: `@@unique` en DB + lazy deletion en use case + idempotency a nivel HTTP.

## Riesgos

- **Resend free tier agotado** — si se superan 100 emails/día, Resend rechaza los envíos. Mitigación: el registro no se bloquea, el usuario puede reintentar después. En producción se upgradea el plan o se cambia de proveedor.
- **Email en spam folder** — el email de verificación puede caer en spam. Mitigación: usar dominio verificado en producción con SPF/DKIM configurados.
