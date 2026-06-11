/**
 * @swagger
 * tags:
 *   name: Historial de Precios
 *   description: Gestión del historial de precios de servicios
 *
 * components:
 *   schemas:
 *     HistorialPrecio:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         idServicio:
 *           type: number
 *           example: 3
 *         precio:
 *           type: number
 *           example: 1500.00
 *         fechaInicio:
 *           type: string
 *           format: date-time
 *         fechaFin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *
 * /historial-precios/{idServicio}:
 *   get:
 *     summary: Listar el historial de precios de un servicio
 *     tags: [Historial de Precios]
 *     parameters:
 *       - in: path
 *         name: idServicio
 *         required: true
 *         schema:
 *           type: number
 *         example: 3
 *     responses:
 *       200:
 *         description: Historial de precios del servicio
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
 *                     $ref: '#/components/schemas/HistorialPrecio'
 *
 * /historial-precios/{idServicio}/actual:
 *   get:
 *     summary: Obtener el precio vigente de un servicio
 *     tags: [Historial de Precios]
 *     parameters:
 *       - in: path
 *         name: idServicio
 *         required: true
 *         schema:
 *           type: number
 *         example: 3
 *     responses:
 *       200:
 *         description: Precio vigente del servicio (null si no tiene precio registrado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: number
 *                   nullable: true
 *                   example: 1500.00
 *
 * /historial-precios:
 *   post:
 *     summary: Registrar un nuevo precio para un servicio
 *     tags: [Historial de Precios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idServicio, precio]
 *             properties:
 *               idServicio:
 *                 type: number
 *                 example: 3
 *               precio:
 *                 type: number
 *                 example: 1800.00
 *     responses:
 *       201:
 *         description: Precio registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HistorialPrecio'
 *       400:
 *         description: Datos inválidos (precio <= 0 o campos faltantes)
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 */
