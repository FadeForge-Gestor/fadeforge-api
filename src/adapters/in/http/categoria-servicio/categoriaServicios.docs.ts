/**
 * @swagger
 * tags:
 *   name: Categorias de Servicios
 *   description: Gestión de categorías de servicios
 *
 * components:
 *   schemas:
 *     CategoriaServicio:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         nombre:
 *           type: string
 *           example: Cortes
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: Servicios relacionados con cortes de cabello
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
 * /categorias-servicios/activos:
 *   get:
 *     summary: Listar categorías activas
 *     tags: [Categorias de Servicios]
 *     responses:
 *       200:
 *         description: Lista de categorías activas
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
 *                     $ref: '#/components/schemas/CategoriaServicio'
 *
 * /categorias-servicios:
 *   get:
 *     summary: Listar todas las categorías de servicios
 *     tags: [Categorias de Servicios]
 *     responses:
 *       200:
 *         description: Lista de categorías de servicios
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
 *                     $ref: '#/components/schemas/CategoriaServicio'
 *
 *   post:
 *     summary: Crear una nueva categoría de servicio
 *     tags: [Categorias de Servicios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Coloración
 *               descripcion:
 *                 type: string
 *                 example: Servicios de coloración y tintes
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoriaServicio'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       409:
 *         description: Ya existe una categoría con ese nombre
 *
 * /categorias-servicios/{id}:
 *   get:
 *     summary: Obtener una categoría de servicio por ID
 *     tags: [Categorias de Servicios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         example: 1
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoriaServicio'
 *       404:
 *         description: Categoría no encontrada
 *
 *   put:
 *     summary: Actualizar una categoría de servicio
 *     tags: [Categorias de Servicios]
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
 *               nombre:
 *                 type: string
 *                 example: Coloración
 *               descripcion:
 *                 type: string
 *                 example: Servicios de coloración y tintes
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoriaServicio'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: Ya existe una categoría con ese nombre
 *
 * /categorias-servicios/{id}/desactivar:
 *   put:
 *     summary: Desactivar una categoría de servicio (soft delete)
 *     tags: [Categorias de Servicios]
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
 *         description: Categoría desactivada exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Categoría no encontrada
 *
 * /admin/categorias-servicios/{id}/reactivar:
 *   put:
 *     summary: Reactivar una categoría de servicio
 *     tags: [Categorias de Servicios]
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
 *         description: Categoría reactivada exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: La categoría ya está activa
 */
