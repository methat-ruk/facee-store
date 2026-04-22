import Image from 'next/image';

type BrandMarkProps = {
  priority?: boolean;
};

export function BrandMark({ priority = false }: BrandMarkProps) {
  return (
    <Image
      src="/images/brand/facee-logo.png"
      alt="Facee Skincare Store"
      width={176}
      height={176}
      priority={priority}
      className="h-auto w-36 sm:w-44"
    />
  );
}
