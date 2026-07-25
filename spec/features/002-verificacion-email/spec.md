# 002 · Verificación de correo electrónico

**Estado:** propuesta

## Qué hace

Envía un correo de verificación con un link de confirmación al registrarse. El usuario queda inactivo hasta que confirme su correo haciendo click en el link. También soporta reenvío de verificación con rate limit.

## Por qué

Hoy un usuario puede registrarse con cualquier correo (real o inventado) y queda activo inmediatamente. Sin verificación de propiedad:
- No se puede notificar al usuario por correo (recordatorios de cita, etc.)
- Cuentas falsas o con typos se acumulan en la DB
- Un usuario puede registrar un correo ajeno y recibir información que no le corresponde

## Criterios de aceptación

- [ ] Al registrarse (`POST /auth/registro`), el usuario queda con `email_verificado: false` y recibe un email con un link de confirmación.
- [ ] El endpoint `GET /auth/confirmar?token=xxx` valida el token, marca el correo como verificado y redirige al frontend.
- [ ] Si el token es inválido o expiró, se retorna error claro (400 con mensaje descriptivo).
- [ ] Los tokens de verificación expiran después de **24 horas** (configurable vía `EMAIL_VERIFICATION_EXPIRES_IN_HOURS`).
- [ ] El endpoint `POST /auth/reenviar-verificacion` genera un nuevo token y reenvía el email, con rate limit de **3 reenvíos máximo** por usuario.
- [ ] El endpoint `POST /auth/reenviar-verificacion` aplica **idempotency** con header `Idempotency-Key` para prevenir emails duplicados (reutiliza middleware existente).
- [ ] La feature es **togglable** vía `EMAIL_VERIFICATION_ENABLED`: si está en `false`, el registro retorna JWT inmediatamente (comportamiento actual).
- [ ] Si el envío de email falla, el registro **no se bloquea** — el usuario queda registrado y puede reenviar después.
- [ ] Se utiliza **Resend** como proveedor de email (dominio por defecto `onboarding@resend.dev` para desarrollo).
- [ ] Los tokens de verificación se almacenan en la DB como **hash bcrypt** (nunca en texto plano). El token en texto plano solo viaja por el email.
- [ ] Los tests unitarios cubren: registro con verificación, confirmación de token válido, token expirado, token inválido, reenvío con rate limit, y fallback cuando `EMAIL_VERIFICATION_ENABLED=false`.

## Fuera de alcance

- Verificación de existencia del buzón SMTP (feature futura).
- Notificaciones de citas, recordatorios u otros emails transaccionales.
- Cambio de contraseña vía email.
- Templates HTML profesionales (se usa uno básico funcional).
