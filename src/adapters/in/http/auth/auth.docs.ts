/**
 * @swagger
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
 *         description: Demasiados intentos. Intentá de nuevo en 15 minutos.
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
