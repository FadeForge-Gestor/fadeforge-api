/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Consulta de roles del sistema (solo admins). Los roles son fijos y se siembran vía prisma/seed.ts.
 *
 * components:
 *   schemas:
 *     Rol:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         clave:
 *           type: string
 *           example: admin
 *         nombre:
 *           type: string
 *           example: Administrador
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: Acceso total al sistema
 *         activo:
 *           type: boolean
 *           example: true
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *         fechaModificacion:
 *           type: string
 *           format: date-time
 *
 * /admin/roles/activos:
 *   get:
 *     summary: Listar roles activos
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rol'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *
 * /admin/roles:
 *   get:
 *     summary: Listar todos los roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rol'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *
 * /admin/roles/{id}:
 *   get:
 *     summary: Obtener un rol por ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         example: 1
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Rol'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Rol no encontrado
 */
