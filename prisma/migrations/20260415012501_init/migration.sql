-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "citas";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "seguridad";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "servicios";

-- CreateEnum
CREATE TYPE "citas"."estado_cita" AS ENUM ('nueva', 'pendiente', 'proceso', 'cancelada', 'finalizada');

-- CreateTable
CREATE TABLE "citas"."citas" (
    "id" SERIAL NOT NULL,
    "id_clientes" INTEGER NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(6) NOT NULL,
    "estado" "citas"."estado_cita" NOT NULL DEFAULT 'pendiente',
    "motivo_cancelado" TEXT,
    "cancelado_por" INTEGER,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas"."detalle_cita" (
    "id" SERIAL NOT NULL,
    "id_cita" INTEGER NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "precio_aplicado" DECIMAL(10,2) NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,

    CONSTRAINT "detalle_cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."credenciales_usuarios" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "correo" VARCHAR(100) NOT NULL,
    "hash_contrasena" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credenciales_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."empleados" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."roles" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguridad"."usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "a_paterno" VARCHAR(100) NOT NULL,
    "a_materno" VARCHAR(100),
    "telefono" VARCHAR(20) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios"."categorias_servicios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios"."historial_precios" (
    "id" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "fecha_inicio" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(6),

    CONSTRAINT "historial_precios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios"."servicios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "duracion_minutos" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credenciales_usuarios_id_usuario_key" ON "seguridad"."credenciales_usuarios"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "credenciales_usuarios_correo_key" ON "seguridad"."credenciales_usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_id_usuario_key" ON "seguridad"."empleados"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "roles_clave_key" ON "seguridad"."roles"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_nombre" ON "seguridad"."roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_servicios_nombre_key" ON "servicios"."categorias_servicios"("nombre");

-- AddForeignKey
ALTER TABLE "citas"."citas" ADD CONSTRAINT "citas_cancelado_por_fkey" FOREIGN KEY ("cancelado_por") REFERENCES "seguridad"."usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas"."citas" ADD CONSTRAINT "citas_id_clientes_fkey" FOREIGN KEY ("id_clientes") REFERENCES "seguridad"."usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas"."citas" ADD CONSTRAINT "citas_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "seguridad"."empleados"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas"."detalle_cita" ADD CONSTRAINT "detalle_cita_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "citas"."citas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas"."detalle_cita" ADD CONSTRAINT "detalle_cita_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "servicios"."servicios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seguridad"."credenciales_usuarios" ADD CONSTRAINT "fk_credenciales_usuarios" FOREIGN KEY ("id_usuario") REFERENCES "seguridad"."usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seguridad"."empleados" ADD CONSTRAINT "empleados_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seguridad"."usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seguridad"."usuarios" ADD CONSTRAINT "fk_usuario_rol" FOREIGN KEY ("id_rol") REFERENCES "seguridad"."roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "servicios"."historial_precios" ADD CONSTRAINT "fk_historial_servicio" FOREIGN KEY ("id_servicio") REFERENCES "servicios"."servicios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "servicios"."servicios" ADD CONSTRAINT "fk_servicio_categoria" FOREIGN KEY ("id_categoria") REFERENCES "servicios"."categorias_servicios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
