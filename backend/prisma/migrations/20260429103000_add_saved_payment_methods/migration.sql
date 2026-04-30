CREATE TABLE "SavedPaymentMethod" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "PaymentMethod" NOT NULL,
  "label" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "cardholderName" TEXT,
  "cardLast4" TEXT,
  "cardExpiryMonth" TEXT,
  "cardExpiryYear" TEXT,
  "bankName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SavedPaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedPaymentMethod_userId_createdAt_idx"
ON "SavedPaymentMethod"("userId", "createdAt");

ALTER TABLE "SavedPaymentMethod"
ADD CONSTRAINT "SavedPaymentMethod_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
