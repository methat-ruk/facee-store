ALTER TABLE "Product"
ADD COLUMN "sku" TEXT;

WITH product_rankings AS (
  SELECT
    "id",
    CONCAT('FCE-', LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::text, 4, '0')) AS "nextSku"
  FROM "Product"
)
UPDATE "Product"
SET "sku" = product_rankings."nextSku"
FROM product_rankings
WHERE "Product"."id" = product_rankings."id"
  AND "Product"."sku" IS NULL;

ALTER TABLE "Product"
ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
