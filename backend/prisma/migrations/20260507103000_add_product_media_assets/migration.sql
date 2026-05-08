CREATE TABLE "ProductMediaAsset" (
  "id" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductMediaAsset_url_key" ON "ProductMediaAsset"("url");
CREATE UNIQUE INDEX "ProductMediaAsset_filename_key" ON "ProductMediaAsset"("filename");
CREATE INDEX "ProductMediaAsset_createdAt_idx" ON "ProductMediaAsset"("createdAt");
