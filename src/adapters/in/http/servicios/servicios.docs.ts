/**
 * @swagger
 * tags:
 *   name: Servicios
 *   description: Gestión de servicios
 *
 * components:
 *   schemas:
 *     Servicio:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         nombre:
 *           type: string
 *           example: Corte de cabello
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: Corte clásico para caballeros
 *         duracionMinutos:
 *           type: number
 *           example: 30
 *         idCategoria:
 *           type: number
 *           example: 1
 *         imagenUrl:
 *           type: string
 *           nullable: true
 *           example: https://ejemplo.com/imagen.jpg
 *         idImagen:
 *           type: string
 *           nullable: true
 *           example: abc123xyz
 *         nombreImagen:
 *           type: string
 *           nullable: true
 *           example: corte-cabello.jpg
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
 * /servicios/activos:
 *   get:
 *     summary: Listar servicios activos
 *     tags: [Servicios]
 *     responses:
 *       200:
 *         description: Lista de servicios activos
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
 *                     $ref: '#/components/schemas/Servicio'
 *
 * /servicios:
 *   get:
 *     summary: Listar todos los servicios
 *     tags: [Servicios]
 *     responses:
 *       200:
 *         description: Lista de servicios
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
 *                     $ref: '#/components/schemas/Servicio'
 *
 *   post:
 *     summary: Crear un nuevo servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, duracionMinutos, idCategoria]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Corte de cabello
 *               descripcion:
 *                 type: string
 *                 example: Corte clásico para caballeros
 *               duracionMinutos:
 *                 type: number
 *                 example: 30
 *               idCategoria:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Servicio'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: Ya existe un servicio con ese nombre
 *
 * /servicios/{id}:
 *   get:
 *     summary: Obtener un servicio por ID
 *     tags: [Servicios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         example: 1
 *     responses:
 *       200:
 *         description: Servicio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Servicio'
 *       404:
 *         description: Servicio no encontrado
 *
 *   put:
 *     summary: Actualizar un servicio
 *     tags: [Servicios]
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
 *                 example: Corte de cabello
 *               descripcion:
 *                 type: string
 *                 example: Corte clásico para caballeros
 *               duracionMinutos:
 *                 type: number
 *                 example: 30
 *               idCategoria:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Servicio'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Servicio o categoría no encontrada
 *       409:
 *         description: Ya existe un servicio con ese nombre
 *
 * /servicios/{id}/desactivar:
 *   put:
 *     summary: Desactivar un servicio (soft delete)
 *     tags: [Servicios]
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
 *         description: Servicio desactivado exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Servicio no encontrado
 *       409:
 *         description: El servicio ya está desactivado
 *
 * /admin/servicios/{id}/reactivar:
 *   put:
 *     summary: Reactivar un servicio previamente desactivado
 *     tags: [Servicios]
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
 *         description: Servicio reactivado exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Servicio no encontrado
 *       409:
 *         description: El servicio ya está activo
 *
 * /servicios/{id}/imagen:
 *   post:
 *     summary: Subir imagen de un servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [imagen]
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del servicio (JPEG, PNG o WebP, máx 5MB)
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Formato de imagen no permitido
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Servicio no encontrado
 *       409:
 *         description: El servicio ya tiene una imagen
 *
 *   put:
 *     summary: Reemplazar imagen de un servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [imagen]
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Nueva imagen (JPEG, PNG o WebP, máx 5MB)
 *     responses:
 *       200:
 *         description: Imagen actualizada exitosamente
 *       400:
 *         description: Formato de imagen no permitido
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Servicio o imagen no encontrada
 *
 *   delete:
 *     summary: Eliminar imagen de un servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       204:
 *         description: Imagen eliminada exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Servicio o imagen no encontrada
 */
