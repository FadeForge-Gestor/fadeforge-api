-- AlterTable
ALTER TABLE "citas"."citas" ADD COLUMN "folio" VARCHAR(10);

-- CreateIndex
CREATE UNIQUE INDEX "citas_folio_key" ON "citas"."citas"("folio");

-- CreateFunction
CREATE OR REPLACE FUNCTION citas.generate_folio()
RETURNS TRIGGER AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..10 LOOP
            result := result || substr(chars, floor(random() * 36 + 1)::int, 1);
        END LOOP;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM citas.citas WHERE folio = result);
    END LOOP;
    NEW.folio := result;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER trg_set_folio
BEFORE INSERT ON "citas"."citas"
FOR EACH ROW
EXECUTE FUNCTION citas.generate_folio();
