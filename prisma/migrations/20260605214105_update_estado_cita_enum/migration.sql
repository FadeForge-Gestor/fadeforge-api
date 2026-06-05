/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `servicios` will be added. If there are existing duplicate values, this will fail.
  - Made the column `folio` on table `citas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "citas"."citas" ALTER COLUMN "folio" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "servicios_nombre_key" ON "servicios"."servicios"("nombre");
