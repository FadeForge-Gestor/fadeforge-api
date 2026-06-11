/**
 * @swagger
 * tags:
 *   name: Citas
 *   description: Gestión de citas
 *
 * components:
 *   schemas:
 *     DetalleCita:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         idCita:
 *           type: number
 *           example: 1
 *         idServicio:
 *           type: number
 *           example: 3
 *         precioAplicado:
 *           type: number
 *           example: 250.00
 *         duracionMinutos:
 *           type: number
 *           example: 30
 *
 *     Cita:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         folio:
 *           type: string
 *           example: CIT-00001
 *         idCliente:
 *           type: number
 *           example: 5
 *         idEmpleado:
 *           type: number
 *           example: 2
 *         fechaInicio:
 *           type: string
 *           format: date-time
 *           example: 2026-06-10T10:00:00.000Z
 *         fechaFin:
 *           type: string
 *           format: date-time
 *           example: 2026-06-10T11:00:00.000Z
 *         estado:
 *           type: string
 *           enum: [nueva, pendiente, en_proceso, finalizada, cancelada, reprogramada, no_asistio]
 *           example: nueva
 *         subtotal:
 *           type: number
 *           example: 500.00
 *         iva:
 *           type: number
 *           example: 80.00
 *         total:
 *           type: number
 *           example: 580.00
 *         motivoCancelado:
 *           type: string
 *           nullable: true
 *           example: El cliente no se presentó
 *         canceladoPor:
 *           type: number
 *           nullable: true
 *           example: 1
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *         fechaModificacion:
 *           type: string
 *           format: date-time
 *         detalle:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DetalleCita'
 *
 * /citas:
 *   get:
 *     summary: Listar citas por rango de fecha
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         example: 2026-06-01T00:00:00.000Z
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         example: 2026-06-30T23:59:59.000Z
 *     responses:
 *       200:
 *         description: Lista de citas en el rango indicado
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
 *                     $ref: '#/components/schemas/Cita'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *
 *   post:
 *     summary: Crear una nueva cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idCliente, idEmpleado, fechaInicio, servicios]
 *             properties:
 *               idCliente:
 *                 type: number
 *                 example: 5
 *               idEmpleado:
 *                 type: number
 *                 example: 2
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-10T10:00:00.000Z
 *               servicios:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [idServicio]
 *                   properties:
 *                     idServicio:
 *                       type: number
 *                       example: 3
 *     responses:
 *       201:
 *         description: Cita creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Cliente, empleado o servicio no encontrado
 *       409:
 *         description: Cliente o empleado desactivado, servicio sin precio, o fecha inválida
 *
 * /citas/folio/{folio}:
 *   get:
 *     summary: Obtener una cita por folio
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folio
 *         required: true
 *         schema:
 *           type: string
 *         example: CIT-00001
 *     responses:
 *       200:
 *         description: Cita encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Cita no encontrada
 *
 * /citas/cliente/{idCliente}:
 *   get:
 *     summary: Listar citas de un cliente
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: number
 *         example: 5
 *     responses:
 *       200:
 *         description: Lista de citas del cliente
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
 *                     $ref: '#/components/schemas/Cita'
 *       401:
 *         description: Token no proporcionado o inválido
 *
 * /citas/{id}:
 *   get:
 *     summary: Obtener una cita por ID
 *     tags: [Citas]
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
 *         description: Cita encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Cita no encontrada
 *
 *   put:
 *     summary: Actualizar una cita
 *     tags: [Citas]
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
 *               idEmpleado:
 *                 type: number
 *                 example: 3
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-11T09:00:00.000Z
 *               fechaFin:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-11T10:00:00.000Z
 *     responses:
 *       200:
 *         description: Cita actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Cita o empleado no encontrado
 *       409:
 *         description: La cita está cancelada o finalizada y no puede modificarse
 *
 * /citas/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de una cita
 *     tags: [Citas]
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
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [nueva, pendiente, en_proceso, finalizada, cancelada, reprogramada, no_asistio]
 *                 example: pendiente
 *               motivoCancelado:
 *                 type: string
 *                 example: El cliente solicitó cancelar
 *               canceladoPor:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Cita no encontrada
 *       409:
 *         description: Transición de estado inválida o motivo de cancelación faltante
 */
