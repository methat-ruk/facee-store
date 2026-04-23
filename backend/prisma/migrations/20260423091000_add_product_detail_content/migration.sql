-- AlterTable
ALTER TABLE "Product"
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "howToUse" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
