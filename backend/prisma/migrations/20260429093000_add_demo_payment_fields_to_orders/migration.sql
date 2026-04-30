CREATE TYPE "PaymentMethod" AS ENUM ('QR_BANK_TRANSFER', 'CARD');

CREATE TYPE "PaymentDemoStatus" AS ENUM (
  'NOT_STARTED',
  'QR_SUBMITTED',
  'CARD_COMPLETED'
);

ALTER TABLE "Order"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'QR_BANK_TRANSFER',
ADD COLUMN "paymentDemoStatus" "PaymentDemoStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "paymentSubmittedAt" TIMESTAMP(3),
ADD COLUMN "paymentCompletedAt" TIMESTAMP(3);
