import Image from 'next/image';
import { cn } from '@/lib/cn';
import type { Product } from './schemas';

type ProductCardProps = {
  product: Product;
};

function getAvailabilityLabel(stock: number) {
  if (stock === 0) {
    return 'Out of stock';
  }

  if (stock <= 10) {
    return 'Low stock';
  }

  return 'In stock';
}

function getAvailabilityClassName(stock: number) {
  if (stock === 0) {
    return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
  }

  if (stock <= 10) {
    return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
  }

  return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';
}

export function ProductCard({ product }: ProductCardProps) {
  const availabilityLabel = getAvailabilityLabel(product.stock);
  const availabilityClassName = getAvailabilityClassName(product.stock);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-border bg-white/85 shadow-[0_24px_70px_rgba(132,83,60,0.1)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(132,83,60,0.16)]">
      <div className="relative h-56 cursor-pointer overflow-hidden bg-[linear-gradient(180deg,#fff3ea_0%,#f7ddd0_100%)]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 640px) calc(50vw - 2.5rem), calc(100vw - 3rem)"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center transition duration-300 group-hover:bg-white/20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted">
                Facee
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                Image coming soon
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
              {product.category.name}
            </p>
            <h2 className="mt-2 cursor-pointer text-lg font-semibold text-foreground underline decoration-transparent underline-offset-4 transition hover:text-[#8b5e3c] hover:decoration-current">
              {product.name}
            </h2>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              availabilityClassName,
            )}
          >
            {availabilityLabel}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-muted">
          {product.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-semibold text-foreground">
            THB {product.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted">{product.stock} available</span>
        </div>
      </div>
    </article>
  );
}
