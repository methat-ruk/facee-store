DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
      AND column_name = 'isflashsale'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
      AND column_name = 'isFlashSale'
  ) THEN
    EXECUTE 'ALTER TABLE "Product" RENAME COLUMN isflashsale TO "isFlashSale"';
  END IF;
END $$;
