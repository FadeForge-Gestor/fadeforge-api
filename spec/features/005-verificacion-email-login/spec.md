# 005 · Verificación de correo — control de acceso al login + link de confirmación

**Estado:** implementado (rama `fix/verificacion-email-login`, pendiente PR a `main`)

## Qué hace

Siete cambios sobre el flujo de verificación de correo electrónico (feature 002):

1. **Bloquea el login de cuentas sin correo verificado.** Cuando la verificación está habilitada (`EMAIL_VERIFICATION_ENABLED=true`), un usuario con `email_verificado=false` no puede iniciar sesión: recibe un `403 Forbidden` con mensaje claro. Cuando la verificación está deshabilitada, el login se comporta como hoy (sin bloqueo).

2. **Corrige el link de confirmación del correo.** Hoy el link que llega en el email apunta a `FRONTEND_URL/confirmar?token=...`, que no existe (da "Cannot GET /confirmar"). Debe apuntar al endpoint real del backend: `API_URL/api/v1/auth/confirmar?token=...`.

3. **El admin avala la identidad al crear usuarios.** Los usuarios creados por admin (`POST /usuarios`) y el admin del seed nacen con `email_verificado=true`: el admin ya validó la identidad por un canal fuera de banda, así que la cuenta entra directo (modelo *trust anchor*). Sin esto, con el bloqueo de la Parte 1 activo, el admin del seed y los usuarios creados por admin quedarían bloqueados del login.

4. **Corrige la validación del token de confirmación.** El endpoint `GET /api/v1/auth/confirmar` siempre respondía "El token de verificación es inválido o expiró", aun con un token recién enviado, por un doble hash de bcrypt: el use case hasheaba el token en claro (salt nuevo) y el repositorio comparaba ese hash contra el hash almacenado. `bcrypt.compare(plano, hash)` nunca puede coincidir recibiendo un hash como "plano". El fix: el use case pasa el token en claro al repositorio, que lo compara contra el hash guardado en BD.

5. **Semántica HTTP correcta en la confirmación.** `POST /auth/confirmar` con el token en el body (`{ token }`) es el **consumidor canónico**: valida, marca `email_verificado=true` y elimina el token (de un solo uso). `GET /auth/confirmar?token=...` (el link del correo) pasa a ser de **solo validación**: responde si el token existe y no expiró, sin escribir en BD. Un GET nunca debe mutar (contrato HTTP): el método es parte del diseño, no un detalle — un GET que escribe confunde a quien consume la API.

6. **Los rechazos de Resend son visibles.** El SDK de Resend no lanza excepción cuando un envío falla: devuelve `{ data, error }`. El servicio chequeaba el resultado pero descartaba el error, y los use cases tenían `catch {}` — un rechazo (dominio no verificado, quota, API key inválida) dejaba al usuario sin correo con la API respondiendo "correo enviado". Ahora `ResendEmailService` lanza `Error` con el mensaje del SDK y los use cases loguean el fallo (`console.error`) sin romper el flujo: el correo es un side-effect, no un requisito de la transacción.

7. **Template del correo con logo y sin token expuesto.** El header muestra el logo (dorado sobre la barra negra, desde `LOGO_URL`) y se eliminó el texto "Copia y pega este enlace" que exponía el link con el token en claro. El token viaja solo en el `href` del botón; la nota bajo el CTA aclara que es de un solo uso y expira en N horas. `LOGO_URL` apunta a una versión recortada on-the-fly de Cloudinary (`c_crop,x_202,y_54,w_273,h_262`): el asset original (677x369) tiene el logo (273x262) centrado con mucho margen transparente.

## Por qué

### 1. El flag `email_verificado` es decorativo

La feature 002 implementó la verificación de correo completa: token bcrypt, expiración, reenvío con rate limit. Pero `login.usecase.ts` **nunca valida `email_verificado`**: cualquier persona puede registrarse con un correo que no le pertenece (o un correo desechable) y usar el sistema completo sin confirmar nada. La verificación no cumple su función de puerta de acceso.

### 2. El link del correo apunta a un lugar inexistente

`resendEmail.service.ts` construye el link así:

```typescript
const link = `${env.FRONTEND_URL}/confirmar?token=${token}`;
```

`FRONTEND_URL` es la URL del frontend (que aún no existe). El endpoint que valida el token vive en el backend (`GET /api/v1/auth/confirmar`). Resultado: al hacer click, el navegador pega contra una ruta que no existe y el usuario no puede confirmar su correo. Sin frontend, el link debe apuntar directo al backend.

### 3. El admin avala la identidad (trust anchor)

Con el bloqueo del punto 1 activo, el admin del seed (`prisma/seed.ts`) y los usuarios creados vía `POST /usuarios` no podrían iniciar sesión: ambos nacen con `email_verificado=false`. La verificación de correo existe para probar que un correo le pertenece a quien se auto-registra (anti-spam, anti-squatting). Cuando un admin crea la cuenta, el admin ES el ancla de confianza: ya validó la identidad por un canal fuera de banda (cara a cara, documento, RR.HH.). Es el patrón estándar de las empresas grandes (Okta, Google Workspace, GitHub orgs): el correo de bienvenida informa, el aprovisionamiento habilita.

### 4. El token de confirmación siempre da inválido (doble hash de bcrypt)

En el registro se guarda `token_hash = bcrypt.hash(token)` (el token en claro se hashea UNA vez al persistir, ver `registroCliente.usecase.ts`). En la confirmación, `confirmarEmail.usecase.ts` re-hasheaba el token (`bcrypt.hash(token, 10)` → hash con salt aleatorio, cadena distinta) y el repositorio hacía `bcrypt.compare(hash2, hash1)`: `bcrypt.compare` espera el token EN CLARO como primer argumento, así que comparaba `hash(hash2)` contra `hash1`. Como cada `bcrypt.hash` genera un salt aleatorio, la comparación NUNCA coincidía: el flujo de confirmación estaba roto de punta a punta y los tests no lo detectaban porque mockeaban `buscarPorTokenHash` (el roundtrip real de bcrypt nunca se ejercitaba).

## Criterios de aceptación

- [ ] `LoginUseCase` devuelve `ForbiddenError` (HTTP 403) con mensaje claro ("Debes verificar tu correo electrónico antes de iniciar sesión") cuando `EMAIL_VERIFICATION_ENABLED=true` y la cuenta tiene `email_verificado=false`.
- [ ] El `403` es distinguible del `401` de credenciales inválidas (el frontend puede mostrar pantallas distintas).
- [ ] Con `EMAIL_VERIFICATION_ENABLED=false`, el login no bloquea a nadie (comportamiento actual).
- [ ] El login exitoso devuelve `emailVerificado` en la respuesta (`LoginOutput`) con el valor real de la BD: siempre `true` cuando la verificación está habilitada (el `403` filtra a los no verificados).
- [ ] `CredencialesAuth` (entidad de dominio) incluye `emailVerificado: boolean`.
- [ ] El repositorio de auth trae `email_verificado` en `buscarPorCorreo`.
- [ ] Los usuarios creados por admin (`POST /usuarios`) nacen con `email_verificado=true` (el admin avala la identidad).
- [ ] El admin del seed (`prisma/seed.ts`) nace con `email_verificado=true`.
- [ ] El registro self-service (`POST /auth/registro`) sigue naciendo con `email_verificado=false` (debe verificar antes de entrar).
- [ ] El link del correo de verificación apunta a `API_URL/api/v1/auth/confirmar?token=...`.
- [ ] `API_URL` es una variable de entorno configurable, con default sensato para desarrollo (`http://localhost:PORT`).
- [ ] El mock de `@config/env` en los tests incluye `API_URL` y `EMAIL_VERIFICATION_ENABLED`.
- [ ] `POST /auth/confirmar` con `{ token }` en el body consume el token, marca `email_verificado=true`, lo elimina y responde 200 JSON (test de regresión con bcrypt REAL, sin mockear bcrypt).
- [ ] La confirmación **solo requiere el token, nunca la contraseña**: probar posesión del correo es responsabilidad del token (factor de posesión); probar conocimiento de la cuenta es responsabilidad exclusiva del `POST /auth/login`. Pedir la contraseña en la confirmación sería redundante (se valida dos veces) y rompe el flujo estándar de verificación (Stripe/GitHub/Google no la piden al confirmar).
- [ ] `GET /auth/confirmar?token=...` valida sin mutar: 200 `{ valido: true }` con token válido y no expirado, 400 si es inválido. **No escribe en BD** (un GET no debe tener efectos).
- [ ] El token es **de un solo uso**: `POST /auth/confirmar` lo elimina al consumirlo; reutilizar el mismo token responde 400.
- [ ] Las respuestas de `GET`/`POST /auth/confirmar` **no incluyen el token** en el JSON; solo el email lo contiene.
- [ ] Un token incorrecto no verifica la cuenta y responde 400 (no revela si el correo existe).
- [ ] `ResendEmailService` lanza `Error` con el mensaje del SDK cuando `respuesta.error` viene poblado (los rechazos no son silenciosos).
- [ ] Un fallo de envío de correo no rompe el registro ni el reenvío: los use cases loguean (`console.error`) y responden éxito igual.
- [ ] El template de verificación no muestra el token ni el link en texto visible; el token viaja solo en el `href` del botón.
- [ ] El header del template renderiza el logo desde `LOGO_URL` (versión recortada on-the-fly de Cloudinary).
- [ ] Todos los tests pasan (`npm test`) y `npm run build` compila.
- [ ] Documentación Swagger de `/auth/login` actualizada con el `403`.

## Fuera de alcance

- Página/HTML de éxito tras confirmar el correo servida por el GET (el patrón completo "GET renderiza la página + POST consume") — queda para cuando exista el frontend. Hoy el GET valida y devuelve JSON.
- `GET /auth/me` (perfil del usuario logueado) — gap de frontend, feature aparte.
- Limpieza periódica de cuentas sin verificar.
- `EMAIL_FROM` con un dominio verificado en Resend — pendiente de configuración: sin él, Resend usa el sandbox (`onboarding@resend.dev`) y Gmail filtra el correo a Spam. Afecta a todos los templates, no solo al de verificación.
