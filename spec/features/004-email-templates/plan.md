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
| 8. **Fase 2:** rediseño profesional con MJML (build-time) | 🔲 En diseño — docs actualizadas, sin implementar |

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

El logo se sirve desde Cloudinary y su URL se configura en `.env` como `LOGO_URL`. NO se hardcodea en el template ni se adivina un patrón en el código: es una variable de Handlebars `{{logoUrl}}` que el adapter lee de la configuración.

**Template (`verificacion.hbs`):**

```html
<img src="{{logoUrl}}" alt="FadeForge" />
<h1>Bienvenido a FadeForge</h1>
<p>Haz clic en el siguiente enlace para confirmar tu correo electrónico:</p>
<a href="{{link}}">Confirmar correo</a>
<p>Este enlace expira en {{horasExpiracion}} horas.</p>
<p>Si no creaste esta cuenta, podés ignorar este mensaje.</p>
```

**Configuración (`.env` / `.env.template`):**

```
LOGO_URL=https://res.cloudinary.com/<cloud-name>/image/upload/v1/<public-id>
```

`LOGO_URL` es una variable **requerida** (como `DATABASE_URL`, `JWT_SECRET`, etc.): si falta, la app no arranca (fail-fast). Se incluye en `env.ts` con el resto de las variables de Cloudinary.

**Adapter (`resendEmail.service.ts`):**

```typescript
private obtenerLogoUrl(): string {
    return env.LOGO_URL;
}
```

**Por qué es así:**

- **Hexagonal:** la URL del logo es configuración de infraestructura, no lógica de negocio. El template es solo presentación; no sabe de Cloudinary ni de entornos.
- **SRP:** `ResendEmailService` inyecta la configuración al template; el template solo interpola.
- **OCP:** si mañana el logo cambia de proveedor (CDN propio, S3), solo cambia el valor de `LOGO_URL`. El `.hbs` y el servicio no se tocan.
- **Por qué `LOGO_URL` y no un patrón construido en código:** el `public_id` real que asigna Cloudinary (con versión y nombre autogenerado, ej. `logo_abc123.png` en la raíz) no sigue ningún patrón predecible. Construir la URL en código obliga a que el asset viva exactamente en una carpeta/nombre que el código conoce — frágil y difícil de mantener. Configurar la URL literal la hace independiente de dónde/qué nombre tenga el asset, y al re-subir el logo solo se actualiza una línea del `.env`.
- **Fail-fast:** `LOGO_URL` requerida en `env.ts` → si falta, la app no arranca.

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

## Fase 2 · Rediseño profesional con MJML (build-time)

_La Fase 1 está implementada y funcionando. Esta fase rediseña los templates con MJML 5, compilado en build-time. NO cambia la arquitectura: Handlebars sigue siendo la capa de render y los templates siguen siendo detalles internos del adapter._

### Decisión y por qué

| Opción | Veredicto |
|--------|-----------|
| **A — MJML build-time** | ✅ **Elegida.** HTML de calidad profesional sin costo en runtime. |
| **B — MJML runtime** | ❌ Descartada: CPU por render + paquete pesado en producción, sin ventajas sobre A. |
| **C — HTML a mano con tablas** | ❌ Descartada: con 5 templates proyectados, los hacks de Outlook se repiten 5 veces y la consistencia entre correos se rompe. |

**MJML 5.4.0**: licencia MIT (verificada en el repo oficial y FAQ de mjml.io), $0. Requiere **Node ≥ 22** (el proyecto corre Node 24.11.1 ✅). Es un monorepo: `mjml-cli`, `mjml-core`, `mjml-validator`, `mjml-preset-core`, `@babel/runtime` + transitivas — **hay que auditar el árbol antes de instalar** (regla del proyecto).

### Cómo funciona el pipeline

```
templates/verificacion.mjml   ← fuente (se commitea, con placeholders {{...}})
        │  mjml CLI (prebuild, dentro de npm run build)
        ▼
templates/verificacion.hbs    ← HTML compilado (tablas + estilos inline), placeholders intactos
        │  Handlebars (runtime, templateLoader existente)
        ▼
HTML final con datos (link, logoUrl, horasExpiracion)
```

1. El build corre el CLI de MJML sobre `src/adapters/out/email/templates/*.mjml` → genera el HTML compilado junto al `.mjml`.
2. El `cpSync` actual del build ya copia `.hbs` a `dist/` — ajustar el filter para que cubra el archivo generado.
3. `templateLoader` y `ResendEmailService` **no se tocan** — siguen cargando el template compilado y renderizando con Handlebars.

### Spike de integración (primer paso de la implementación)

El riesgo técnico principal: ¿los placeholders de Handlebars sobreviven la compilación de MJML?

- `{{logoUrl}}` en atributo `src` de `<mj-image>` → el validator de MJML puede quejarse de URLs no válidas.
- `{{{link}}}` en `href` de `<mj-button>` → idem.
- `{{horasExpiracion}}` en texto dentro de `<mj-text>` → debería pasar sin problema.

**Fallback documentado** (si el spike falla): compilar con tokens literales (`__LINK__`, `__LOGO_URL__`) y reemplazarlos post-compilación (helper de Handlebars o `string.replace` en el loader). La decisión se toma con evidencia del spike, no por adelantado.

### Estructura del template (verificacion.mjml)

```mjml
<mjml>
  <mj-body background-color="#f6f6f6">
    <mj-section>
      <mj-column>
        <mj-image src="{{logoUrl}}" width="160px" alt="FadeForge" />
        <mj-text font-size="28px" font-weight="bold" align="center">Bienvenido a FadeForge</mj-text>
        <mj-text align="center">Haz clic en el siguiente enlace para confirmar tu correo electrónico</mj-text>
        <mj-button background-color="#111" color="#ffffff" href="{{{link}}}">Confirmar correo</mj-button>
        <mj-text font-size="12px" color="#777" align="center">Este enlace expira en {{horasExpiracion}} horas.</mj-text>
        <mj-divider />
        <mj-text font-size="12px" color="#999" align="center">Si no creaste esta cuenta, podés ignorar este mensaje.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

### Layout base reutilizable (5 templates proyectados)

Con 5 templates previstos, el header (logo) y el footer (expiración + disclaimer) deben ser **una sola fuente de verdad**: MJML soporta `<mj-include path="..." />` para partials. Diseño:

- `templates/partials/header.mjml` — logo centrado.
- `templates/partials/footer.mjml` — divider + disclaimer + expiración.
- `templates/*.mjml` — cada correo incluye header/footer y define solo su cuerpo.

Esto garantiza consistencia visual por construcción, no por disciplina. (Si el spike muestra que `mj-include` complica el pipeline, fallback: un solo `.mjml` por template duplicando header/footer — decisión con evidencia.)

### Tests (Fase 2)

- `templateLoader.test.ts` existente: los asserts sobre textos, `alt="FadeForge"` y `<img` **siguen pasando** (MJML genera `<img alt="FadeForge">`). Verificar en el spike.
- Nuevo test: el HTML compilado contiene las etiquetas esperadas (`<table`, `role="presentation"`, botón como `<a>` con estilos inline).
- Test de regresión: el HTML compilado renderiza los placeholders igual que hoy.

### Archivos afectados (Fase 2)

| Archivo | Cambio |
|---------|--------|
| `package.json` | `mjml` en `devDependencies` + script de prebuild (CLI de MJML) |
| `src/adapters/out/email/templates/verificacion.mjml` | **Nuevo** — fuente del template |
| `src/adapters/out/email/templates/partials/*.mjml` | **Nuevos** — header/footer si `mj-include` pasa el spike |
| `src/adapters/out/email/templates/verificacion.hbs` | **Generado** — por el build (¿se commitea o solo existe en `dist/`? decisión en implementación) |
| `npm run build` | Pipeline: `mjml` → HTML → `cpSync` a `dist/` |
| `tests/unit/adapters/out/email/templateLoader.test.ts` | Ajustar/agregar asserts sobre el HTML compilado |

Sin cambios (idealmente): `IEmailService`, `ResendEmailService`, casos de uso, controllers, routes.

### Decisiones (Fase 2)

| Decisión | Por qué |
|----------|---------|
| **MJML build-time (Opción A)** | Calidad profesional sin costo en runtime; el HTML compilado es un asset más del build. MIT, $0. |
| **Handlebars sigue siendo la capa de render** | No se cambia la arquitectura de la Fase 1: el adapter sigue renderizando con Handlebars. |
| **`mjml` en devDependencies** | Solo se usa en el build. En producción no se instala el paquete pesado. |
| **`mj-include` para header/footer** | 5 templates → una sola fuente de verdad para header/footer. Consistencia por construcción. |
| **Spike antes de implementar** | El riesgo real es si `{{}}` sobrevive a MJML. Se decide con evidencia, no por adelantado. |

### Riesgos (Fase 2)

| Riesgo | Mitigación |
|--------|-----------|
| **Validator de MJML rechaza `{{}}` en atributos** | Spike primero. Fallback: tokens `__X__` + reemplazo post-compilación. |
| **`mj-include` complica el pipeline** | Fallback: duplicar header/footer por template. |
| **Árbol de dependencias grande de `mjml`** | Auditoría antes de instalar (regla del proyecto). Solo devDependencies. |
| **`.hbs` generado vs source-of-truth** | Decisión explícita: ¿se commitea el HTML compilado o se genera en build? (Pendiente — depende del CI y del flujo del equipo.) |
| **Node < 22 en algún entorno** | `mjml@5` exige Node ≥ 22. El proyecto corre Node 24.11.1. Verificar engines del CI. |

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
| **Logo como variable `{{logoUrl}}`** | El template no hardcodea URLs. El adapter lee `env.LOGO_URL` (configuración) y la pasa al template. |
| **`LOGO_URL` requerida en `.env`** | La URL literal del asset es la única verdad verificada; no se adivina ningún patrón de carpeta/public_id. Cambiar de logo = actualizar una línea del `.env`. |
| **Carpeta en Cloudinary** | El asset no depende de ninguna carpeta específica. Si se organiza en `fadeforge/{env}/...` es decisión del dashboard; el código no lo asume. |
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
| **`LOGO_URL` no configurada** | Variable requerida en `env.ts`: si falta, la app no arranca (fail-fast). Evita correos enviados sin logo. |
| **URL de logo con caracteres especiales** | Handlebars escapa caracteres especiales en `{{logoUrl}}` (HTML-escape). Las URLs de Cloudinary (patrón `https://...`) no contienen caracteres que Handlebars escape, por lo que no hace falta triple-stache `{{{ }}}`. |
| **Overhead del `HEAD` por envío** | Cacheado con TTL de 5 min en memoria (`logoDisponible` + `ultimaVerificacionLogo`): a lo sumo 1 `HEAD` por instancia cada 5 min, independiente de la cantidad de envíos. Multi-instancia: 1 `HEAD` por instancia por ventana. |
