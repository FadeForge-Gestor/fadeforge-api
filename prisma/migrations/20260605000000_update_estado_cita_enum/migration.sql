-- AlterEnum: rename proceso -> en proceso
ALTER TYPE "citas"."estado_cita" RENAME VALUE 'proceso' TO 'en proceso';

-- AlterEnum: add missing values
ALTER TYPE "citas"."estado_cita" ADD VALUE IF NOT EXISTS 'reprogramada';
ALTER TYPE "citas"."estado_cita" ADD VALUE IF NOT EXISTS 'no asistio';
