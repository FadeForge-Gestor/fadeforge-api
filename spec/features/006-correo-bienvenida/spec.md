# 006 · Correo de bienvenida tras la verificación

**Estado:** planificado (rama `feat/correo-bienvenida`, pendiente de implementar)

## Qué hace

Un cambio sobre el flujo de verificación de correo (features 002/005): cuando el usuario **consume** el token en `POST /auth/confirmar` — el endpoint que marca `email_verificado=true` y elimina el token (single-use) — el sistema envía por **primera vez** un correo de bienvenida personalizado que saluda al usuario por su nombre ("Hola {nombre}, tu cuenta está activa").

El envío es un **side-effect**: la verificación se persiste en BD antes del intento de envío, así que un fallo del correo no revierte la verificación ni cambia la respuesta HTTP (el `200` se mantiene y el error queda logueado). Como el token es de un solo uso, la bienvenida solo puede dispararse una vez por verificación: es imposible el doble envío.

## Por qué

### 1. El flujo de verificación termina "a oscuras" para el usuario

El correo de verificación (005) le pide al usuario confirmar su correo, pero **nunca recibe confirmación de que lo logró**: la única señal es el JSON del `POST /auth/confirmar` ("Correo electrónico verificado. Ya podés iniciar sesión."), que solo ve quien consume la API. El usuario que verifica desde su bandeja de entrada hace click en el link del correo, recibe el `{ valido: true }` del GET y queda sin ninguna confirmación por email de que su cuenta quedó activa.

### 2. El correo de bienvenida es el onboarding estándar

Cualquier producto con registro (Stripe, GitHub, Airbnb, Google) cierra el ciclo de verificación con un correo de bienvenida: confirma que la cuenta está activa y reduce la tasa de usuarios que verifican y nunca vuelven. Sin él, el flujo de verificación cumple su función técnica (probar propiedad del correo) pero pierde la oportunidad de activar al usuario.

### 3. Personalización con el nombre

El nombre se captura en el registro (`POST /auth/registro`) pero hasta ahora no se usa en ningún correo. La bienvenida es el primer contacto "post-activación" y el saludo por nombre es la personalización natural: el usuario siente que el sistema lo conoce, y es el momento de mayor engagement (recién verificó su correo).

## Criterios de aceptación

- [ ] `POST /auth/confirmar` con token válido: marca `email_verificado=true`, elimina el token **y además** envía un correo de bienvenida al correo del usuario.
- [ ] El correo saluda por el nombre del usuario ("Hola {nombre}") — el nombre proviene de la tabla `usuarios` (`IUsuarioRepository.buscarPorId`).
- [ ] El correo se envía **una sola vez** por verificación: el token es single-use y no existe endpoint de "reenviar bienvenida"; reutilizar el token responde 400 y no reenvía nada.
- [ ] Un fallo de envío **no** revierte la verificación, **no** cambia la respuesta 200 y se loguea (`console.error`) con la causa.
- [ ] Con `EMAIL_VERIFICATION_ENABLED=false`, no se envía nada y el flujo es el actual (`NullEmailService` no-op).
- [ ] `GET /auth/confirmar` (validación read-only) **no** dispara la bienvenida: un GET no debe tener efectos.
- [ ] `IEmailService` incluye `enviarBienvenida(correo: string, nombre: string)`; `ResendEmailService` lo implementa con el mismo flujo que `enviarVerificacion` (verificación del logo con TTL, rechazos de Resend visibles) y `NullEmailService` es no-op.
- [ ] El template `bienvenida.mjml` reusa el header con logo (`LOGO_URL`) y el footer existentes; no contiene el token ni links a URLs inexistentes (el frontend no existe).
- [ ] No se crea **ningún** método nuevo de repositorio: se reusan `buscarPorId` (nombre) y `buscarPorIdUsuario` (correo), ambos existentes.
- [ ] `ConfirmarEmailUseCase` sigue dependiendo solo de puertos (DIP): `ITokenVerificacionRepository`, `ICredencialRepository`, `IUsuarioRepository`, `IEmailService`. Sin lógica de envío en controller ni repositorios.
- [ ] Todos los tests pasan (`npm test`) y `npm run build` compila.

## Fuera de alcance

- **Bienvenida para usuarios creados por admin** — nacen con `email_verificado=true` (trust anchor de la 005) y no pasan por `POST /auth/confirmar`, así que no reciben bienvenida. Si se quiere, es una decisión aparte (por ejemplo, dispararla en `POST /usuarios`).
- **CTA con link al login/frontend** — el frontend no existe; un botón apuntando a `FRONTEND_URL` (default `localhost:3000`) daría "Cannot GET". Se agrega cuando exista el frontend.
- **Cola / reintentos de correos de bienvenida fallidos** — el envío es best-effort y se loguea; no hay infraestructura de colas en el proyecto.
- **Personalización con apellidos o teléfono** — solo el nombre (`usuarios.nombre`).
