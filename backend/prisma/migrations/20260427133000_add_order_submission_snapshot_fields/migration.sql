ALTER TABLE "Order"
ADD COLUMN "customerFullName" TEXT,
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "customerPhone" TEXT,
ADD COLUMN "shippingAddressLine" TEXT,
ADD COLUMN "shippingCity" TEXT,
ADD COLUMN "shippingPostalCode" TEXT,
ADD COLUMN "subtotal" DECIMAL(10,2),
ADD COLUMN "shippingTotal" DECIMAL(10,2);

ALTER TABLE "OrderItem"
ADD COLUMN "productName" TEXT,
ADD COLUMN "productSlug" TEXT,
ADD COLUMN "productImageUrl" TEXT;
