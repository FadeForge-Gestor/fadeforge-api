# 005 · Verificación de correo — control de acceso al login + link de confirmación

**Estado:** en planificación

## Qué hace

Tres cambios sobre el flujo de verificación de correo electrónico (feature 002):

1. **Bloquea el login de cuentas sin correo verificado.** Cuando la verificación está habilitada (`EMAIL_VERIFICATION_ENABLED=true`), un usuario con `email_verificado=false` no puede iniciar sesión: recibe un `403 Forbidden` con mensaje claro. Cuando la verificación está deshabilitada, el login se comporta como hoy (sin bloqueo).

2. **Corrige el link de confirmación del correo.** Hoy el link que llega en el email apunta a `FRONTEND_URL/confirmar?token=...`, que no existe (da "Cannot GET /confirmar"). Debe apuntar al endpoint real del backend: `API_URL/api/v1/auth/confirmar?token=...`.

3. **El admin avala la identidad al crear usuarios.** Los usuarios creados por admin (`POST /usuarios`) y el admin del seed nacen con `email_verificado=true`: el admin ya validó la identidad por un canal fuera de banda, así que la cuenta entra directo (modelo *trust anchor*). Sin esto, con el bloqueo de la Parte 1 activo, el admin del seed y los usuarios creados por admin quedarían bloqueados del login.

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
- [ ] Todos los tests pasan (`npm test`) y `npm run build` compila.
- [ ] Documentación Swagger de `/auth/login` actualizada con el `403`.

## Fuera de alcance

- Página/HTML de éxito tras confirmar el correo (el frontend la va a manejar con su propia ruta `/correo-confirmado`).
- `GET /auth/me` (perfil del usuario logueado) — gap de frontend, feature aparte.
- Logo en el template del correo — pendiente de la feature 004 (el `{{logoUrl}}` se pasa pero ningún template lo renderiza).
- Limpieza periódica de cuentas sin verificar.
