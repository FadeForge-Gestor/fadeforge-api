-- AlterTable
-- Los hashes bcrypt existentes (60 chars) caben en VARCHAR(64) pero dejan de
-- resolver contra el lookup sha256: los tokens en vuelo quedan inválidos y el
-- usuario reenvía por POST /reenviar-verificacion.
ALTER TABLE "seguridad"."tokens_verificacion" ALTER COLUMN "token_hash" SET DATA TYPE VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacion_token_hash_key" ON "seguridad"."tokens_verificacion"("token_hash");
