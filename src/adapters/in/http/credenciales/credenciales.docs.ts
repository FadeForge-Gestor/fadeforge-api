/**
 * @swagger
 * tags:
 *   name: Credenciales
 *   description: Gestión de credenciales del usuario autenticado
 *
 * /credenciales/contrasena:
 *   put:
 *     summary: Cambiar la contraseña del usuario autenticado
 *     tags: [Credenciales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contrasenaActual, nuevaContrasena]
 *             properties:
 *               contrasenaActual:
 *                 type: string
 *                 example: "Actual#123"
 *               nuevaContrasena:
 *                 type: string
 *                 example: "Nueva#456"
 *     responses:
 *       204:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *
 * /credenciales/correo:
 *   put:
 *     summary: Cambiar el correo del usuario autenticado
 *     tags: [Credenciales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contrasenaActual, nuevoCorreo]
 *             properties:
 *               contrasenaActual:
 *                 type: string
 *                 example: "Actual#123"
 *               nuevoCorreo:
 *                 type: string
 *                 example: "nuevo@correo.com"
 *     responses:
 *       204:
 *         description: Correo actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       409:
 *         description: El correo ya está registrado
 *
 * /credenciales/{id}/reset:
 *   put:
 *     summary: Resetear la contraseña de un usuario (solo admin)
 *     tags: [Credenciales]
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
 *             required: [nuevaContrasena]
 *             properties:
 *               nuevaContrasena:
 *                 type: string
 *                 example: "Reset#789"
 *     responses:
 *       204:
 *         description: Contraseña reseteada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: No se puede resetear la contraseña de un administrador
 */
