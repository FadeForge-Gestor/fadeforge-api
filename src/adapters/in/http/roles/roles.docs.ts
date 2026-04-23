/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles del sistema (solo admins)
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
 *
 * /roles:
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
 *   post:
 *     summary: Crear un nuevo rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clave, nombre]
 *             properties:
 *               clave:
 *                 type: string
 *                 example: empleado
 *               nombre:
 *                 type: string
 *                 example: Empleado
 *               descripcion:
 *                 type: string
 *                 example: Acceso a agenda y servicios
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
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
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *
 * /roles/{id}:
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
 *
 *   put:
 *     summary: Actualizar un rol
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clave:
 *                 type: string
 *                 example: admin
 *               nombre:
 *                 type: string
 *                 example: Administrador
 *               descripcion:
 *                 type: string
 *                 example: Acceso total al sistema
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
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
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Rol no encontrado
 *
 *
 * /roles/{id}/desactivar:
 *   put:
 *     summary: Desactivar un rol (soft delete)
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
 *       204:
 *         description: Rol desactivado exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: El rol ya está desactivado
 */
