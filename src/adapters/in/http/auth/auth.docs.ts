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
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: |
 *           Rate limit alcanzado o cuenta bloqueada. Tres escenarios posibles:
 *           - **Rate limit global**: más de 10 requests por IP en 15 min.
 *           - **Rate limit por correo**: más de 5 intentos por correo en 15 min.
 *           - **Cuenta bloqueada**: 5 intentos fallidos consecutivos → bloqueo de 15 min.
 *         content:
 *           application/json:
 *             examples:
 *               rate-limit-ip:
 *                 summary: Rate limit global por IP
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
 */
