/**
 * @swagger
 * tags:
 *   name: Empleados
 *   description: Gestión de empleados del sistema
 *
 * components:
 *   schemas:
 *     Empleado:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         idUsuario:
 *           type: number
 *           example: 5
 *         nombreCompleto:
 *           type: string
 *           example: Juan Pérez García
 *         correo:
 *           type: string
 *           example: juan.perez@email.com
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
 * /admin/empleados:
 *   get:
 *     summary: Listar todos los empleados (activos e inactivos)
 *     tags: [Empleados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empleados
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
 *                     $ref: '#/components/schemas/Empleado'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *
 *   post:
 *     summary: Promover un usuario existente a empleado
 *     tags: [Empleados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idUsuario]
 *             properties:
 *               idUsuario:
 *                 type: number
 *                 example: 5
 *     responses:
 *       201:
 *         description: Empleado promovido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Empleado'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El usuario ya es empleado, está desactivado, o es administrador
 *
 * /admin/empleados/activos:
 *   get:
 *     summary: Listar solo los empleados activos
 *     tags: [Empleados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empleados activos
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
 *                     $ref: '#/components/schemas/Empleado'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *
 * /admin/empleados/{id}:
 *   get:
 *     summary: Obtener un empleado por ID
 *     tags: [Empleados]
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
 *         description: Empleado encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Empleado'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Empleado no encontrado
 *
 * /admin/empleados/{id}/desactivar:
 *   put:
 *     summary: Desactivar un empleado (soft delete)
 *     tags: [Empleados]
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
 *         description: Empleado desactivado exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Empleado no encontrado
 *       409:
 *         description: El empleado ya está desactivado
 *
 * /admin/empleados/{id}/reactivar:
 *   put:
 *     summary: Reactivar un empleado previamente desactivado
 *     tags: [Empleados]
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
 *         description: Empleado reactivado exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Empleado no encontrado
 *       409:
 *         description: El empleado ya está activo
 */
