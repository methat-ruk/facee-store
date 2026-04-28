CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING_MANUAL', 'REFUNDED');
CREATE TYPE "CancellationReasonCode" AS ENUM (
  'WRONG_ADDRESS',
  'DUPLICATE_ORDER',
  'CHANGED_MIND',
  'PAYMENT_ISSUE',
  'ORDER_DELAY',
  'OTHER'
);
CREATE TYPE "CancellationRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED');

ALTER TABLE "Order"
ADD COLUMN "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE';

CREATE TABLE "Address" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "recipientFullName" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "recipientPhone" TEXT NOT NULL,
  "addressLine" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderCancellationRequest" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "reasonCode" "CancellationReasonCode" NOT NULL,
  "details" TEXT,
  "status" "CancellationRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "reviewNote" TEXT,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderCancellationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId", "createdAt");
CREATE INDEX "OrderCancellationRequest_orderId_createdAt_idx" ON "OrderCancellationRequest"("orderId", "createdAt");
CREATE INDEX "OrderCancellationRequest_requesterUserId_createdAt_idx" ON "OrderCancellationRequest"("requesterUserId", "createdAt");

ALTER TABLE "Address"
ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderCancellationRequest"
ADD CONSTRAINT "OrderCancellationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderCancellationRequest"
ADD CONSTRAINT "OrderCancellationRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderCancellationRequest"
ADD CONSTRAINT "OrderCancellationRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Address" (
  "id",
  "userId",
  "label",
  "recipientFullName",
  "recipientEmail",
  "recipientPhone",
  "addressLine",
  "city",
  "postalCode",
  "isDefault"
)
SELECT
  'addr_' || md5("id" || ':legacy-address'),
  "id",
  'Primary',
  "fullName",
  "email",
  COALESCE("phone", ''),
  COALESCE("addressLine", ''),
  COALESCE("city", ''),
  COALESCE("postalCode", ''),
  true
FROM "User"
WHERE
  "phone" IS NOT NULL
  OR "addressLine" IS NOT NULL
  OR "city" IS NOT NULL
  OR "postalCode" IS NOT NULL;
