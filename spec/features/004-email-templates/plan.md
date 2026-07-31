# 004 · Templates HTML para correos electrónicos — Plan

_Cómo se implementa lo descrito en `spec.md`._

## Enfoque

Extraer el HTML inline de `ResendEmailService` a archivos `.hbs` separados, usando **Handlebars** como template engine. El adapter compila los templates al construirse y los renderiza con los datos que recibe en cada llamado.

Handlebars es el estándar de la industria para emails HTML: sintaxis `{{variable}}`, cero lógica en los templates, archivos separados del código.

---

## Estado de implementación

| Paso | Estado |
|------|--------|
| 1. Dependencia (`handlebars`) | ✅ Implementado (`6e5c98d`) |
| 2. Build: copiar `.hbs` al `dist/` | ✅ Implementado (`6e5c98d`) |
| 3. Template loader | ✅ Implementado (`6e5c98d`) |
| 4. Template de verificación | ✅ Implementado (`6e5c98d`) — falta logo (sección 7) |
| 5. Modificar `ResendEmailService` | ✅ Implementado (`6e5c98d`, `9c1ae9e`) — logo en sección 7 |
| 6. Tests | ✅ Implementado (`6e5c98d`) — logo en sección 7 |
| 7. Logo en el template (opción B) | ✅ Implementado — incluye validación 400 si el logo no existe |

## Arquitectura hexagonal y SOLID

### Dónde vive cada cosa

```
src/
├── core/
│   └── ports/out/email/IEmailService.ts     ← Puerto de salida (contrato)
└── adapters/
    └── out/email/
        ├── templateLoader.ts                ← Utilidad de infraestructura (interno del adapter)
        ├── templates/                       ← Assets .hbs (solo HTML)
        │   ├── verificacion.hbs
        │   └── ...
        ├── resendEmail.service.ts           ← Implementación concreta del puerto
        └── nullEmail.service.ts             ← Otra implementación (Null Object)
```

El template loader y los templates son **detalles internos del adapter**. El dominio no sabe ni debe saber que existen templates. La interfaz `IEmailService` no cambia, los casos de uso no se tocan.

### SOLID aplicado

| Principio | Cómo se cumple |
|-----------|---------------|
| **SRP** | `ResendEmailService` se ocupaba de construir HTML + enviar. Ahora solo envía. El `templateLoader` se ocupa de leer y compilar. |
| **OCP** | Nuevo tipo de correo = nuevo archivo `.hbs` + nuevo método en `IEmailService`. No se modifica nada existente. |
| **LSP** | `ResendEmailService` y `NullEmailService` siguen implementando `IEmailService` sin cambios. |
| **ISP** | `IEmailService` no se toca. No se crean interfaces nuevas. |
| **DIP** | Los casos de uso dependen de `IEmailService` (abstracción). El template loader es un detalle interno del adapter, ningún módulo de alto nivel depende de él. |

### Lo que NO cambia (y por qué es importante)

- `IEmailService` — el contrato sigue siendo el mismo
- `RegistroClienteUseCase` — llama a `emailService.enviarVerificacion()` como siempre
- `ReenviarVerificacionUseCase` — idem
- `AuthController` — no se toca
- `auth.routes.ts` — no se toca

El cambio es 100% dentro del adapter de salida. La dirección de las dependencias sigue apuntando hacia adentro (regla de oro de hexagonal).

---

## Implementación

### 1. Dependencia

```bash
npm install handlebars
```

Handlebars v4+ incluye tipos (no requiere `@types/handlebars`). Sin dependencias transitivas significativas, >10 años en el ecosistema.

### 2. Build: copiar `.hbs` al `dist/`

`tsc` compila solo `.ts`. Los `.hbs` no se copian solos al `dist/`. Solución: modificar `npm run build` para copiarlos después de compilar, usando `fs.cpSync` nativo de Node 16.7+ (cero dependencias):

```json
"build": "tsc && node -e \"require('fs').cpSync('src', 'dist', { filter: f => f.endsWith('.hbs'), recursive: true })\""
```

Esto copia cualquier `.hbs` preservando la estructura. El CI ejecuta `npm run build` — no hay que tocar `.github/workflows/`.

### 3. Template loader

```
src/adapters/out/email/templateLoader.ts
```

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

const TEMPLATES_DIR = join(__dirname, 'templates');

export function loadTemplate(nombre: string): HandlebarsTemplateFunction {
    const path = join(TEMPLATES_DIR, `${nombre}.hbs`);
    const source = readFileSync(path, 'utf-8');
    return Handlebars.compile(source);
}
```

El `__dirname` en desarrollo apunta a `src/adapters/out/email/`. En producción, a `dist/adapters/out/email/`. Como el build copia los `.hbs` a `dist/`, el `join(__dirname, 'templates', 'verificacion.hbs')` resuelve correctamente en ambos entornos.

El loader está fuera de `templates/` para mantener esa carpeta como solo assets `.hbs`, sin código TypeScript mezclado.

### 4. Template de verificación

```
src/adapters/out/email/templates/verificacion.hbs
```

```html
<h1>Bienvenido a FadeForge</h1>
<p>Haz clic en el siguiente enlace para confirmar tu correo electrónico:</p>
<a href="{{link}}">Confirmar correo</a>
<p>Este enlace expira en {{horasExpiracion}} horas.</p>
<p>Si no creaste esta cuenta, podés ignorar este mensaje.</p>
```

Solo HTML + placeholders `{{variable}}`. Sin lógica, sin condicionales, sin helpers.

### 5. Modificar ResendEmailService

```typescript
import { Resend } from 'resend';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { env } from '@config/env';
import { loadTemplate } from './templateLoader';

export class ResendEmailService implements IEmailService {

    private readonly resend: Resend;
    private readonly templateVerificacion: HandlebarsTemplateFunction;

    constructor() {
        this.resend = new Resend(env.RESEND_API_KEY);
        this.templateVerificacion = loadTemplate('verificacion');
    }

    async enviarVerificacion(correo: string, token: string): Promise<void> {
        const link = `${env.FRONTEND_URL}/confirmar?token=${token}`;

        await this.resend.emails.send({
            from: env.EMAIL_FROM,
            to: correo,
            subject: 'Confirma tu correo electrónico — FadeForge',
            html: this.templateVerificacion({
                link,
                horasExpiracion: env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS,
            }),
        });
    }
}
```

El template se compila una sola vez en el constructor. Si el archivo `.hbs` no existe, `readFileSync` lanza error al arrancar la aplicación (fail-fast, mejor que fallar en runtime).

### 6. Tests

```
tests/unit/adapters/out/email/templateLoader.test.ts
```

El test usa `loadTemplate` para compilar el `.hbs` y verifica el HTML renderizado:

- `{{link}}` se reemplaza por el valor pasado.
- `{{horasExpiracion}}` se renderiza como string.
- El HTML generado contiene los textos esperados.

No necesita instanciar `ResendEmailService`. Testea solo la transformación string → string.

### 7. Logo de la app en el template (opción B)

El logo se sirve desde Cloudinary en la carpeta `fadeforge/{env}/templates_email/` (el asset `logo_app` ya está subido en `dev`). La URL NO se hardcodea en el template: se pasa como variable de Handlebars `{{logoUrl}}`, calculada por el adapter según `env.NODE_ENV`.

**Template (`verificacion.hbs`):**

```html
<img src="{{logoUrl}}" alt="FadeForge" />
<h1>Bienvenido a FadeForge</h1>
<p>Haz clic en el siguiente enlace para confirmar tu correo electrónico:</p>
<a href="{{link}}">Confirmar correo</a>
<p>Este enlace expira en {{horasExpiracion}} horas.</p>
<p>Si no creaste esta cuenta, podés ignorar este mensaje.</p>
```

**Adapter (`resendEmail.service.ts`):**

```typescript
async enviarVerificacion(correo: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/confirmar?token=${token}`;
    const carpeta = env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const logoUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/fadeforge/${carpeta}/templates_email/logo_app`;

    await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to: correo,
        subject: 'Confirma tu correo electrónico — FadeForge',
        html: this.templateVerificacion({
            link,
            horasExpiracion: env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS,
            logoUrl,
        }),
    });
}
```

**Por qué es así:**

- **Hexagonal:** el cálculo de la URL es responsabilidad del adapter (infraestructura). El template es solo presentación; no sabe de Cloudinary ni de entornos.
- **SRP:** `ResendEmailService` construye el contexto del template (qué URL usar según entorno); el template solo interpola.
- **OCP:** si mañana el logo cambia de proveedor (CDN propio, S3), solo cambia el adapter. El `.hbs` no se toca.
- **Fail-fast:** el patrón de URL es determinístico; no requiere llamadas de red ni verificación de existencia del asset.

### 8. Validación del logo — error 400 si no existe

El logo es un recurso del adapter, no del dominio. Si el asset no está en Cloudinary, el `<img>` fallaría silenciosamente y el correo llegaría roto al cliente. Para detectarlo, `enviarVerificacion()` hace un `HEAD` request a la URL del logo antes de enviar:

- **`404`** → el logo NO existe → lanza `BadRequestError` (HTTP 400). El `errorMiddleware` lo traduce en la respuesta API.
- **Otro status (2xx, 5xx)** → se envía el correo normalmente.
- **Error de red (`fetch` lanza)** → se envía el correo normalmente. Un problema transitorio de red no debe bloquear el registro del cliente.

**Caché con TTL (5 min):** el resultado de la verificación se guarda en memoria (`logoDisponible: boolean | null` + `ultimaVerificacionLogo`). Dentro del TTL no se vuelve a consultar Cloudinary:

- `true` (200 o red caída) → el correo se envía sin nuevo `HEAD`.
- `false` (404 confirmado) → se relanza `BadRequestError` sin nuevo `HEAD`.
- Pasado el TTL → se vuelve a verificar.

Esto evita martillar Cloudinary si está caído: con la versión sin caché, cada registro en una caída de 5 minutos disparaba un `HEAD` fallido.

```typescript
private async verificarLogoDisponible(logoUrl: string): Promise<void> {
    const ahora = Date.now();

    if (this.logoDisponible !== null && ahora - this.ultimaVerificacionLogo < LOGO_TTL_MS) {
        if (!this.logoDisponible) {
            throw new BadRequestError('No se encontró el logo de la app para el correo de verificación');
        }
        return;
    }

    this.logoDisponible = true;

    try {
        const respuesta = await fetch(logoUrl, { method: 'HEAD' });
        if (respuesta.status === 404) {
            this.logoDisponible = false;
        }
    } catch {
        // Problema de red transitorio: el envío continúa (logoDisponible queda en true).
    } finally {
        this.ultimaVerificacionLogo = Date.now();
    }

    if (!this.logoDisponible) {
        throw new BadRequestError('No se encontró el logo de la app para el correo de verificación');
    }
}
```

**Por qué `BadRequestError` y no `NotFoundError`:** el logo no es un recurso que el cliente pueda pedir; es un requisito interno del envío de correo. Si falta, el request del cliente (registro/reenvío de verificación) no se puede completar tal como está → 400. Si usáramos 404, el cliente podría creer que su cuenta no existe.

**Por qué `HEAD` y no descargar la imagen:** `HEAD` no transfiere el body (solo headers). Es el request más barato para verificar existencia. Node 18+ tiene `fetch` nativo, cero dependencias.

**Por qué TTL en memoria y no persistente:** el logo cambia raramente; 5 minutos de desactualización son irrelevantes. Memoria por instancia evita estado compartido y complicaciones de Redis/caché externo. Si la app corre multi-instancia, cada una verifica a lo sumo 1 vez cada 5 min.

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `package.json` | Agregar `handlebars` + modificar `"build"` script |
| `src/adapters/out/email/templateLoader.ts` | **Nuevo** — helper que lee y compila templates |
| `src/adapters/out/email/templates/verificacion.hbs` | **Nuevo** — template del correo de verificación (incluye `{{logoUrl}}`) |
| `src/adapters/out/email/resendEmail.service.ts` | Reemplazar HTML inline por template compilado + calcular y pasar `logoUrl` según entorno |
| `tests/unit/adapters/out/email/templateLoader.test.ts` | **Nuevo** — test del loader y template (incluye `{{logoUrl}}`) |

Sin cambios: `core/ports/out/email/IEmailService.ts`, `NullEmailService`, casos de uso, controllers, routes.

---

## Decisiones

| Decisión | Por qué |
|----------|---------|
| **Handlebars** | Estándar de la industria para emails. Sintaxis declarativa, cero lógica, archivos separados. |
| **Loader fuera de `templates/`** | `templates/` es solo assets `.hbs`. El loader es código TypeScript. Separación clara. |
| **`readFileSync` en constructor** | Carga única al arrancar. Si falta el archivo, falla temprano. No hay beneficio en lazy loading. |
| **`fs.cpSync` en build** | Cero dependencias nuevas. Nativo de Node 16.7+. Filtra solo `.hbs`, no copia todo `src/`. |
| **Logo como variable `{{logoUrl}}`** | El template no hardcodea URLs. El adapter calcula la URL según `NODE_ENV` (`dev`/`prod`), siguiendo el patrón existente de `FRONTEND_URL`. |
| **Carpeta `templates_email` en Cloudinary** | Separada de `servicios/`. Los assets de correo no se mezclan con imágenes de negocio. El asset `logo_app` ya está subido en `dev`. |
| **`HEAD` + `BadRequestError` si el logo da 404** | El correo no debe salir roto. Detección temprana con el request más barato posible. 400 (no 404) porque el logo es un requisito interno del envío, no un recurso consultable. |
| **No se tocan interfaces** | El template es un detalle interno del adapter. El dominio no cambia. |

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| **Ruta de templates en producción** | `__dirname` resuelve a `dist/adapters/out/email/`. El build copia los `.hbs` a `dist/adapters/out/email/templates/`. `join(__dirname, 'templates', 'archivo.hbs')` funciona en dev y prod. |
| **Build script más complejo** | `"build"` ejecuta `tsc && node -e ...`. Documentado en `package.json`. Si alguien corre `tsc` suelto, no se copian los `.hbs`. |
| **Template no existe en disco** | `readFileSync` lanza error en el constructor. Falla al arrancar, no en runtime. Es comportamiento deseado (fail-fast). |
| **Logo no existe en Cloudinary (404)** | `enviarVerificacion()` verifica con `HEAD` antes de enviar y lanza `BadRequestError` (400) si da 404. El correo nunca sale roto. El error es visible en la respuesta API. |
| **URL de logo con caracteres especiales** | Handlebars escapa caracteres especiales en `{{logoUrl}}` (HTML-escape). Las URLs de Cloudinary (patrón `https://...`) no contienen caracteres que Handlebars escape, por lo que no hace falta triple-stache `{{{ }}}`. |
| **Overhead del `HEAD` por envío** | Cacheado con TTL de 5 min en memoria (`logoDisponible` + `ultimaVerificacionLogo`): a lo sumo 1 `HEAD` por instancia cada 5 min, independiente de la cantidad de envíos. Multi-instancia: 1 `HEAD` por instancia por ventana. |
