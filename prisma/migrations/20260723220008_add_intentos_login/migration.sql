-- CreateTable
CREATE TABLE "seguridad"."intentos_login" (
    "id" SERIAL NOT NULL,
    "correo" VARCHAR(100) NOT NULL,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intentos_login_correo_key" ON "seguridad"."intentos_login"("correo");
