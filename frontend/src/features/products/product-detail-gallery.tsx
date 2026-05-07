'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { cn } from '@/lib/utils';

type ProductDetailGalleryProps = {
  name: string;
  imageUrl: string | null;
  galleryImages: string[];
};

export function ProductDetailGallery({
  name,
  imageUrl,
  galleryImages,
}: ProductDetailGalleryProps) {
  const t = useTranslations('products');
  const images = useMemo(() => {
    const candidates = [...galleryImages, imageUrl].filter(
      (value): value is string => Boolean(value),
    );

    return [...new Set(candidates)];
  }, [galleryImages, imageUrl]);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    images[0] ?? null,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[0.92] overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,#fff6ef_0%,#f5ddd1_100%)] shadow-[0_30px_80px_rgba(132,83,60,0.12)]">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={name}
            fill
            priority
            unoptimized={shouldBypassNextImageOptimization(selectedImage)}
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {t('brandFallback')}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {t('imageSoon')}
              </p>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <ToggleGroup
          type="single"
          value={selectedImage ?? ''}
          onValueChange={(value) => {
            if (value) {
              setSelectedImage(value);
            }
          }}
          className="w-full justify-start gap-3 overflow-x-auto pb-1"
        >
          {images.map((image, index) => (
            <ToggleGroupItem
              key={`${image}-${index}`}
              value={image}
              aria-label={t('galleryImageLabel', { index: index + 1 })}
              variant="outline"
              className={cn(
                'size-20 shrink-0 overflow-hidden rounded-2xl border-border/80 bg-card p-0 data-[state=on]:border-foreground data-[state=on]:bg-card',
              )}
            >
              <div className="relative size-full overflow-hidden rounded-[1rem]">
                <Image
                  src={image}
                  alt={`${name} ${index + 1}`}
                  fill
                  unoptimized={shouldBypassNextImageOptimization(image)}
                  sizes="80px"
                  className="object-cover object-center"
                />
              </div>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}
    </div>
  );
}
