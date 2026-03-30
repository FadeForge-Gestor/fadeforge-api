/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 *
 * /api/auth/login:
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
 *                 example: usuario@mail.com
 *               contrasena:
 *                 type: string
 *                 example: "123456"
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
 */
