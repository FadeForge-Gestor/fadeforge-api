# 001 · Control de intentos fallidos de login

**Estado:** propuesta

## Qué hace

Bloquea temporalmente el inicio de sesión de un usuario después de múltiples intentos fallidos con credenciales incorrectas. También aplica rate limit por usuario (por correo electrónico), no solo el rate limit global que ya existe. Son dos mecanismos independientes que se complementan.

## Por qué

Hoy un atacante puede hacer fuerza bruta contra `/auth/login` sin límite por cuenta. El rate limit global (`authRateLimit`) protege contra ataques distribuidos pero no contra un ataque focalizado a una cuenta específica: si 100 IPs distintas intentan con el mismo correo, el rate limit global no lo detecta. Sin control por usuario, la contraseña de un cliente vulnerable es cuestión de tiempo.

## Criterios de aceptación

- [ ] Después de **5 intentos fallidos** con el mismo correo, el endpoint retorna `429` con el mensaje "Cuenta bloqueada temporalmente" y el tiempo restante.
- [ ] El bloqueo dura **15 minutos** desde el último intento fallido.
- [ ] Los intentos fallidos y el estado de bloqueo se persisten en **PostgreSQL** (tabla `intentos_login`), sobreviviendo reinicios del servidor.
- [ ] Un intento exitoso **resetea** el contador de intentos fallidos de ese correo.
- [ ] El rate limit por usuario aplica **5 intentos máximo** por ventana de 15 minutos por correo electrónico, usando `express-rate-limit` con `keyGenerator`.
- [ ] El rate limit por usuario es **independiente** del rate limit global (ambos activos en `/auth/login`).
- [ ] El error de cuenta bloqueada (lockout) y el error de rate limit son distinguibles (distinto mensaje y/origen).
- [ ] Los tests unitarios del use case cubren los casos: intentos fallidos, bloqueo, reseteo exitoso, y rate limit.
- [ ] Los correos se normalizan a lowercase para evitar duplicados por casing.

## Fuera de alcance

- Verificación de correo electrónico (feature futura).
- Notificación al usuario por correo cuando su cuenta es bloqueada.
- Bloqueo permanente o escalada de sanciones.
