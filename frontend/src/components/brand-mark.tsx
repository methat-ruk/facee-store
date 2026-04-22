import Image from 'next/image';
import { cn } from '@/lib/cn';

type BrandMarkProps = {
  className?: string;
  frameClassName?: string;
  framed?: boolean;
  priority?: boolean;
};

export function BrandMark({
  className,
  frameClassName,
  framed = false,
  priority = false,
}: BrandMarkProps) {
  const image = (
    <Image
      src="/images/brand/facee-logo.png"
      alt="Facee Skincare Store"
      width={176}
      height={176}
      priority={priority}
      className={cn('h-auto w-36 rounded-[1rem] sm:w-44', className)}
    />
  );

  if (!framed) {
    return image;
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-[1.35rem] border border-border/80 bg-white/88 p-1.5 shadow-[0_14px_30px_rgba(88,51,38,0.08)] backdrop-blur',
        frameClassName,
      )}
    >
      {image}
    </span>
  );
}
