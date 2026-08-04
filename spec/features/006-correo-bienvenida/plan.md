# 006 · Correo de bienvenida tras la verificación — Plan

_Qué se va a hacer y cómo, explicado para armar los tickets de trabajo. Detalle técnico en `spec.md`._

## Objetivo

Cuando un usuario verifica su correo (haciendo click en el link de confirmación que recibe al registrarse), la cuenta se activa. Hoy el usuario no recibe ninguna confirmación por email de que su cuenta quedó activa: el flujo termina y nadie lo vuelve a acompañar.

Esta feature agrega el **correo de bienvenida**: una vez que el usuario verifica su correo, se le envía automáticamente un primer correo que lo saluda por su nombre y le confirma que su cuenta está activa y que ya puede empezar a usar la aplicación.

## Enfoque

Un solo cambio sobre el flujo de verificación que ya existe (features 002 y 005). No cambia la forma de registrarse ni de verificar: el usuario hace lo mismo de siempre. Lo único nuevo es que, **después** de que la verificación se completa, el sistema manda un correo adicional.

Puntos clave del enfoque:

- **El correo es informativo, no bloquea nada.** La cuenta queda activada igual aunque el correo de bienvenida falle. Si el envío falla, el error queda registrado para diagnóstico, pero el usuario no nota nada raro: su cuenta ya está activa.
- **Se envía una sola vez, garantizado.** El link de confirmación es de un solo uso, y el sistema usa ese mismo link como "candado": la primera solicitud que lo consume es la única autorizada a enviar la bienvenida. Si el usuario confirma dos veces a la vez (doble click, dos pestañas, reintento de red), solo sale un correo. Sin agregar campos nuevos a la base de datos.
- **Saluda por el nombre.** Usa el nombre que el usuario ingresó al registrarse ("Hola Juan, tu cuenta está activa").
- **Mismo estilo visual.** El correo reutiliza el diseño de los correos actuales (logo y pie de página), manteniendo la identidad de la marca.

## Alcance

### Incluye

1. **Nueva capacidad del servicio de correos**: poder enviar correos de bienvenida, además de los de verificación que ya existen.
2. **Disparo automático en la confirmación**: al completarse la verificación del correo, se envía la bienvenida.
3. **Garantía de envío único (idempotencia)**: la bienvenida se envía como máximo una vez, incluso si llegan dos confirmaciones al mismo tiempo. El propio link de confirmación actúa como candado: la primera solicitud que lo consume gana el derecho a enviar. No se agregan columnas ni campos nuevos a la base.
4. **Nuevo diseño de correo**: template de bienvenida que reutiliza el logo y el pie actuales.
5. **Vista previa local**: poder revisar el correo de bienvenida antes de enviarlo.
6. **Pruebas**: cobertura de tests del nuevo flujo (envío correcto, fallo de envío sin romper la activación, correo no duplicado ni con confirmaciones simultáneas).

### No incluye

- **Bienvenida para usuarios creados por un administrador.** Esos usuarios nacen con la cuenta ya activa (el admin los dio de alta) y no pasan por el paso de verificación, así que no reciben este correo. Si se quiere, es una decisión aparte.
- **Botones o links a páginas web.** El frontend todavía no existe; un botón que lleve a una página inexistente sería un link roto. El correo es informativo, sin botones.
- **Reintentos de correos fallidos.** Si el envío falla, se registra el error. La garantía de entrega (outbox pattern con worker de reintentos) quedó como feature pendiente en el roadmap.

## Decisiones

| Decisión | Por qué |
|----------|---------|
| **La bienvenida no bloquea la activación** | La verificación del correo es lo importante; el correo de bienvenida es un aviso. Si el envío falla, el usuario sigue teniendo su cuenta activa y el error queda registrado para el equipo. |
| **Se envía después de activar la cuenta** | Primero se activa la cuenta (fuente de verdad), después se avisa. Así nunca puede pasar que el correo llegue sin que la cuenta esté activa. |
| **Una sola vez (idempotencia)** | El link de un solo uso no alcanza por sí solo: si dos confirmaciones llegan a la vez, las dos podrían leer el link antes de que ninguna lo consuma, y ambas enviarían la bienvenida. Por eso el consumo del link actúa como candado: la primera solicitud que lo consume es la única que envía. Misma idea que un asiento único: el primero que se sienta, gana. |
| **Saludo por el nombre** | El nombre se pide en el registro y hasta ahora no se usa en ningún correo. La bienvenida es el primer contacto post-activación y el saludo personalizado es lo natural. |
| **Sin botones a páginas web** | El frontend aún no existe (mismo criterio ya aplicado en la feature 005 para el link de verificación). Un botón a una página inexistente genera desconfianza; se agrega cuando exista el frontend. |
| **Mismo diseño visual** | Reutilizar el logo y el pie de página mantiene la identidad de marca y no agrega trabajo de diseño. |

## Riesgos

| Riesgo | Qué pasa si ocurre | Cómo lo mitigamos |
|--------|---------------------|-------------------|
| **El correo no llega (cae en spam o el remitente no está configurado)** | El usuario no ve la bienvenida, aunque su cuenta ya esté activa. | Es el mismo riesgo ya documentado en la feature 005 (configuración del remitente en Resend pendiente). No se resuelve en esta feature; la cuenta se activa igual. |
| **Falla el envío del correo** | El usuario no recibe la bienvenida. | La activación no depende del correo: la cuenta queda activa y el error queda en los logs para diagnóstico. |
| **Duplicar la bienvenida** | El usuario recibe dos correos iguales. | El consumo del link es el candado: de dos confirmaciones simultáneas, solo una puede consumirlo, y solo esa envía la bienvenida. La garantía no depende del cliente ni de configuración, es estructural. |

## Orden de trabajo sugerido

1. Capacidad de envío de bienvenida en el servicio de correos.
2. Disparo automático en el flujo de confirmación, con garantía de envío único (el link como candado).
3. Diseño del correo de bienvenida (template).
4. Vista previa local.
5. Pruebas y validación final.
