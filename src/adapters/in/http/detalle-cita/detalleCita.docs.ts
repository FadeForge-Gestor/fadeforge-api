/**
 * @swagger
 * tags:
 *   name: DetalleCita
 *   description: Consulta de detalles de citas
 *
 * /detalle-cita/cita/{idCita}:
 *   get:
 *     summary: Listar los servicios incluidos en una cita
 *     tags: [DetalleCita]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCita
 *         required: true
 *         schema:
 *           type: number
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de detalles de la cita
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
 *                     $ref: '#/components/schemas/DetalleCita'
 *       401:
 *         description: Token no proporcionado o inválido
 */
