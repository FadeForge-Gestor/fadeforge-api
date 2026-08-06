/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: false
 *         name:
 *           type: string
 *           example: TooManyRequestsError
 *         message:
 *           type: string
 *           example: "Cuenta bloqueada temporalmente. Intentá de nuevo en 10 minuto(s)."
 *     LoginRateLimitResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: "Demasiados intentos para este correo. Intentá de nuevo en 15 minutos."
 *     IpRateLimitResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: "Demasiadas solicitudes desde esta IP. Intentá de nuevo en 15 minutos."
 *
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 *
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, contrasena]
 *             properties:
 *               correo:
 *                 type: string
 *                 example: usuario@gmail.com
 *               contrasena:
 *                 type: string
 *                 example: "Abc123!@#"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                         correo:
 *                           type: string
 *                         rol:
 *                           type: number
 *                         emailVerificado:
 *                           type: boolean
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Correo electrónico no verificado (solo con `EMAIL_VERIFICATION_ENABLED=true`)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: |
 *           Rate limit alcanzado o cuenta bloqueada. Cuatro escenarios posibles:
 *           - **Rate limit global de la API**: más de 100 requests por IP en 15 min (aplica a toda la API).
 *           - **Rate limit global de login**: más de 10 requests por IP en 15 min.
 *           - **Rate limit por correo**: más de 5 intentos por correo en 15 min.
 *           - **Cuenta bloqueada**: 5 intentos fallidos consecutivos → bloqueo de 15 min.
 *         content:
 *           application/json:
 *             examples:
 *               rate-limit-api:
 *                 summary: Rate limit global de la API por IP
 *                 value:
 *                   status: error
 *                   message: "Demasiadas solicitudes desde esta IP. Intentá de nuevo en 15 minutos."
 *               rate-limit-ip:
 *                 summary: Rate limit global de login por IP
 *                 value:
 *                   status: error
 *                   message: "Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos."
 *               rate-limit-usuario:
 *                 summary: Rate limit por correo
 *                 value:
 *                   status: error
 *                   message: "Demasiados intentos para este correo. Intentá de nuevo en 15 minutos."
 *               cuenta-bloqueada:
 *                 summary: Cuenta bloqueada tras 5 fallos
 *                 value:
 *                   ok: false
 *                   name: TooManyRequestsError
 *                   message: "Cuenta bloqueada temporalmente. Intentá de nuevo en 10 minuto(s)."
 *
 * /auth/registro:
 *   post:
 *     summary: Registro de cliente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, aPaterno, telefono, correo, contrasena]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan
 *               aPaterno:
 *                 type: string
 *                 example: Pérez
 *               aMaterno:
 *                 type: string
 *                 example: García
 *               telefono:
 *                 type: string
 *                 example: "5512345678"
 *               correo:
 *                 type: string
 *                 example: juan@gmail.com
 *               contrasena:
 *                 type: string
 *                 description: "Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos"
 *                 example: "Abc123!@#"
 *     responses:
 *       201:
 *         description: Registro exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                         correo:
 *                           type: string
 *                         rol:
 *                           type: string
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El correo ya está registrado
 *       429:
 *         description: Demasiadas solicitudes desde esta IP (máximo 5 en 15 min)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IpRateLimitResponse'
 *
 * /auth/confirmar:
 *   get:
 *     summary: Validar token de verificación de correo (read-only)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificación recibido por correo
 *     responses:
 *       200:
 *         description: El token es válido y no expiró (no consume el token — un GET no muta)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valido:
 *                       type: boolean
 *                       example: true
 *                     mensaje:
 *                       type: string
 *                       example: "El token es válido"
 *       400:
 *         description: Token inválido, expirado o faltante (no escribe en BD)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Demasiadas solicitudes desde esta IP (máximo 30 en 15 min, contador compartido entre GET y POST)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IpRateLimitResponse'
 *   post:
 *     summary: Confirmar correo electrónico (consume el token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de verificación recibido por correo (de un solo uso)
 *     responses:
 *       200:
 *         description: Correo verificado. El token queda consumido (un solo uso) y no se devuelve en la respuesta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     mensaje:
 *                       type: string
 *                       example: "Correo electrónico verificado. Ya podés iniciar sesión."
 *       400:
 *         description: Token inválido, expirado o ya utilizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Demasiadas solicitudes desde esta IP (máximo 30 en 15 min, contador compartido con el GET)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IpRateLimitResponse'
 *
 * /auth/reenviar-verificacion:
 *   post:
 *     summary: Reenviar correo de verificación
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *         description: Clave de idempotencia para prevenir emails duplicados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo]
 *             properties:
 *               correo:
 *                 type: string
 *                 example: usuario@gmail.com
 *     responses:
 *       200:
 *         description: Correo de verificación reenviado
 *       400:
 *         description: El correo ya está verificado
 *       404:
 *         description: No se encontró una cuenta con ese correo
 *       429:
 *         description: |
 *           Límite de reenvíos alcanzado. Dos escenarios posibles:
 *           - **Rate limit por IP**: más de 5 solicitudes desde la misma IP en 15 min.
 *           - **Límite de reenvíos por día**: superado el máximo de reenvíos para el correo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IpRateLimitResponse'
 */
