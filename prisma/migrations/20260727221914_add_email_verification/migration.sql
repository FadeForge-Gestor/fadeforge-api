-- AlterTable
ALTER TABLE "seguridad"."credenciales_usuarios" ADD COLUMN     "email_verificado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "seguridad"."tokens_verificacion" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" VARCHAR(60) NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacion_id_usuario_key" ON "seguridad"."tokens_verificacion"("id_usuario");

-- AddForeignKey
ALTER TABLE "seguridad"."tokens_verificacion" ADD CONSTRAINT "tokens_verificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seguridad"."usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
