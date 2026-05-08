'use client';

/* eslint-disable @next/next/no-img-element */

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ImagePlusIcon,
  LoaderCircleIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  getAdminProductEditorText,
  getAdminProductUploadWarningText,
  getAdminProductValidationText,
} from '@/features/admin-products/messages';
import { type AdminProductUpsertInput } from '@/features/admin-products/schemas';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ApiError, toApiError } from '@/services/api-error';
import {
  createAdminProduct,
  getAdminProductDetail,
  listAdminProductCategories,
  updateAdminProduct,
  uploadAdminProductImages,
} from '@/services/admin-products';
import { useToastStore } from '@/store/use-toast-store';

type AdminProductEditorPageProps = {
  productId?: string;
};

type ListField = {
  value: string;
};

type PreviewImageState = {
  url: string;
  label: string;
};

type ProductEditorFormValues = {
  name: string;
  sku: string;
  slug: string;
  subtitle: string;
  sizeLabel: string;
  description: string;
  howToUse: string;
  benefits: ListField[];
  ingredients: ListField[];
  imageUrl: string;
  galleryImages: string[];
  isPublished: boolean;
  isFlashSale: boolean;
  price: string;
  compareAtPrice: string;
  stock: string;
  categoryId: string;
};

const defaultValues: ProductEditorFormValues = {
  name: '',
  sku: '',
  slug: '',
  subtitle: '',
  sizeLabel: '',
  description: '',
  howToUse: '',
  benefits: [{ value: '' }],
  ingredients: [{ value: '' }],
  imageUrl: '',
  galleryImages: [],
  isPublished: false,
  isFlashSale: false,
  price: '',
  compareAtPrice: '',
  stock: '0',
  categoryId: '',
};

const PRODUCT_EDITOR_ERROR = {
  nameRequired: 'PRODUCT_NAME_REQUIRED',
  skuRequired: 'PRODUCT_SKU_REQUIRED',
  skuFormat: 'PRODUCT_SKU_FORMAT',
  slugRequired: 'PRODUCT_SLUG_REQUIRED',
  slugFormat: 'PRODUCT_SLUG_FORMAT',
  descriptionRequired: 'PRODUCT_DESCRIPTION_REQUIRED',
  howToUseRequired: 'PRODUCT_HOW_TO_USE_REQUIRED',
  listRequired: 'PRODUCT_LIST_REQUIRED',
  priceRequired: 'PRODUCT_PRICE_REQUIRED',
  stockRequired: 'PRODUCT_STOCK_REQUIRED',
  categoryRequired: 'PRODUCT_CATEGORY_REQUIRED',
  compareAtPriceInvalid: 'PRODUCT_COMPARE_AT_PRICE_INVALID',
} as const;

const listItemSchema = z.object({
  value: z.string().trim(),
});

const listGroupSchema = z
  .array(listItemSchema)
  .refine(
    (items) => items.some((item) => item.value.trim().length > 0),
    PRODUCT_EDITOR_ERROR.listRequired,
  );
const productMediaUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.startsWith('/') || z.string().url().safeParse(value).success,
    'Invalid media URL.',
  );

const productEditorFormSchema = z
  .object({
    name: z.string().trim().min(1, PRODUCT_EDITOR_ERROR.nameRequired),
    sku: z
      .string()
      .trim()
      .min(1, PRODUCT_EDITOR_ERROR.skuRequired)
      .max(64)
      .regex(/^[A-Za-z0-9-]+$/, PRODUCT_EDITOR_ERROR.skuFormat),
    slug: z
      .string()
      .trim()
      .min(1, PRODUCT_EDITOR_ERROR.slugRequired)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, PRODUCT_EDITOR_ERROR.slugFormat),
    subtitle: z.string().trim(),
    sizeLabel: z.string().trim().max(40),
    description: z
      .string()
      .trim()
      .min(1, PRODUCT_EDITOR_ERROR.descriptionRequired),
    howToUse: z.string().trim().min(1, PRODUCT_EDITOR_ERROR.howToUseRequired),
    benefits: listGroupSchema,
    ingredients: listGroupSchema,
    imageUrl: productMediaUrlSchema.or(z.literal('')),
    galleryImages: z.array(productMediaUrlSchema),
    isPublished: z.boolean(),
    isFlashSale: z.boolean(),
    price: z.string().trim().min(1, PRODUCT_EDITOR_ERROR.priceRequired),
    compareAtPrice: z.string().trim(),
    stock: z.string().trim().min(1, PRODUCT_EDITOR_ERROR.stockRequired),
    categoryId: z.string().min(1, PRODUCT_EDITOR_ERROR.categoryRequired),
  })
  .superRefine((value, ctx) => {
    if (!value.compareAtPrice.trim()) {
      return;
    }

    const price = Number(value.price);
    const compareAtPrice = Number(value.compareAtPrice);

    if (!Number.isFinite(price) || !Number.isFinite(compareAtPrice)) {
      return;
    }

    if (compareAtPrice <= price) {
      ctx.addIssue({
        code: 'custom',
        message: PRODUCT_EDITOR_ERROR.compareAtPriceInvalid,
        path: ['compareAtPrice'],
      });
    }
  });

function getProductEditorErrorMessage(
  validationText: ReturnType<typeof getAdminProductValidationText>,
  message: string | undefined,
) {
  if (!message) {
    return message;
  }

  return validationText.schemaMessageMap[message] ?? message;
}

type ProductEditorFieldName =
  | 'name'
  | 'sku'
  | 'slug'
  | 'subtitle'
  | 'sizeLabel'
  | 'description'
  | 'howToUse'
  | 'benefits'
  | 'ingredients'
  | 'imageUrl'
  | 'galleryImages'
  | 'price'
  | 'compareAtPrice'
  | 'stock'
  | 'categoryId';

function getAdminProductApiFieldErrorMessage(
  validationText: ReturnType<typeof getAdminProductValidationText>,
  field: ProductEditorFieldName,
  codes: string[],
) {
  const primaryCode = codes[0];

  if (primaryCode === 'REQUIRED') {
    return (
      validationText.requiredFieldMap[field] ?? validationText.fallback(field)
    );
  }

  return (
    validationText.apiCodeMap[primaryCode] ?? validationText.fallback(field)
  );
}

function applyAdminProductApiFieldErrors(
  apiError: ApiError,
  validationText: ReturnType<typeof getAdminProductValidationText>,
  setError: ReturnType<typeof useForm<ProductEditorFormValues>>['setError'],
) {
  const fieldEntries = Object.entries(apiError.fieldErrors ?? {}) as Array<
    [string, string[]]
  >;

  if (fieldEntries.length === 0) {
    return null;
  }

  let firstMessage: string | null = null;

  for (const [field, codes] of fieldEntries) {
    const typedField = field as ProductEditorFieldName;
    const message = getAdminProductApiFieldErrorMessage(
      validationText,
      typedField,
      codes,
    );

    if (!firstMessage) {
      firstMessage = message;
    }

    setError(typedField, { message });
  }

  return firstMessage;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function toListFields(values: string[]) {
  return values.length > 0
    ? values.map((value) => ({ value }))
    : [{ value: '' }];
}

function toListValues(values: ListField[]) {
  return values.map((item) => item.value.trim()).filter(Boolean);
}

async function getImageFileDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        };

        image.onerror = () => {
          reject(new Error('Unable to read image dimensions.'));
        };

        image.src = objectUrl;
      },
    );

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function toFieldErrorMessages(errors: unknown) {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.map((item) => {
    if (
      item &&
      typeof item === 'object' &&
      'value' in item &&
      item.value &&
      typeof item.value === 'object' &&
      'message' in item.value &&
      typeof item.value.message === 'string'
    ) {
      return item.value.message;
    }

    return undefined;
  });
}

function getFieldGroupErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  if (
    'root' in error &&
    error.root &&
    typeof error.root === 'object' &&
    'message' in error.root &&
    typeof error.root.message === 'string'
  ) {
    return error.root.message;
  }

  return undefined;
}

function DynamicListEditor({
  fieldName,
  title,
  description,
  addLabel,
  emptyLabel,
  fields,
  register,
  remove,
  append,
  move,
  itemErrors,
  errorMessage,
}: {
  fieldName: 'benefits' | 'ingredients';
  title: string;
  description: string;
  addLabel: string;
  emptyLabel: string;
  fields: Array<{ id: string }>;
  register: ReturnType<typeof useForm<ProductEditorFormValues>>['register'];
  remove: (index: number) => void;
  append: (value: ListField) => void;
  move: (from: number, to: number) => void;
  itemErrors?: Array<string | undefined>;
  errorMessage?: string;
}) {
  return (
    <Card
      className={cn(
        'border-border/65 bg-background/68 shadow-none',
        errorMessage &&
          'border-destructive bg-destructive/5 ring-2 ring-destructive/25',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ value: '' })}
        >
          <PlusIcon data-icon="inline-start" />
          {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {fields.length > 0 ? (
          fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[1.25rem] border border-border/60 bg-card/70 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <div className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/72 text-sm font-semibold text-muted-foreground">
                {index + 1}
              </div>

              <Input
                {...register(`${fieldName}.${index}.value`)}
                placeholder={emptyLabel}
                aria-invalid={itemErrors?.[index] ? 'true' : undefined}
              />
              {itemErrors?.[index] ? (
                <p className="text-xs text-destructive sm:col-start-2">
                  {itemErrors[index]}
                </p>
              ) : null}

              <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}

        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AdminProductEditorPage({
  productId,
}: AdminProductEditorPageProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof listAdminProductCategories>>
  >([]);
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasCustomizedSlug, setHasCustomizedSlug] = useState(
    Boolean(productId),
  );
  const [previewImage, setPreviewImage] = useState<PreviewImageState | null>(
    null,
  );
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [pendingRemoveImageUrl, setPendingRemoveImageUrl] = useState<
    string | null
  >(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const pushToast = useToastStore((state) => state.pushToast);

  const t = useTranslations('adminProducts');
  const uiText = getAdminProductEditorText(t, productId);
  const uploadWarningText = getAdminProductUploadWarningText(t);
  const validationText = getAdminProductValidationText(t);

  function getUploadGuidance() {
    return {
      size: uiText.uploadRecommendedSize,
      aspect: uiText.uploadAspect,
      warningsTitle: uiText.warningsTitle,
    };
  }

  function getUploadWarningMessage(
    name: string,
    type: 'landscape' | 'square' | 'aspect',
  ) {
    if (type === 'landscape') {
      return uploadWarningText.landscape(name);
    }

    if (type === 'square') {
      return uploadWarningText.square(name);
    }

    return uploadWarningText.aspect(name);
  }

  async function buildUploadWarnings(files: File[]) {
    const warnings: string[] = [];

    for (const file of files) {
      try {
        const { width, height } = await getImageFileDimensions(file);
        const ratio = width / height;
        const targetRatio = 4 / 5;
        const ratioDelta = Math.abs(ratio - targetRatio);

        if (width > height) {
          warnings.push(getUploadWarningMessage(file.name, 'landscape'));
          continue;
        }

        if (Math.abs(width - height) <= 4) {
          warnings.push(getUploadWarningMessage(file.name, 'square'));
          continue;
        }

        if (ratioDelta > 0.08) {
          warnings.push(getUploadWarningMessage(file.name, 'aspect'));
        }
      } catch {
        continue;
      }
    }

    return warnings;
  }

  const uploadGuidance = getUploadGuidance();

  const form = useForm<ProductEditorFormValues>({
    defaultValues,
    resolver: zodResolver(productEditorFormSchema),
    mode: 'onSubmit',
  });

  const benefitsFieldArray = useFieldArray({
    control: form.control,
    name: 'benefits',
  });
  const ingredientsFieldArray = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const nameValue = useWatch({ control: form.control, name: 'name' });
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' });
  const galleryImages = useWatch({
    control: form.control,
    name: 'galleryImages',
  });
  const categoryId = useWatch({ control: form.control, name: 'categoryId' });
  const isPublishedValue = useWatch({
    control: form.control,
    name: 'isPublished',
  });
  const isFlashSaleValue = useWatch({
    control: form.control,
    name: 'isFlashSale',
  });
  const priceValue = useWatch({ control: form.control, name: 'price' });
  const compareAtPriceValue = useWatch({
    control: form.control,
    name: 'compareAtPrice',
  });

  const applyProductToForm = useCallback(
    (product: Awaited<ReturnType<typeof getAdminProductDetail>>['product']) => {
      form.reset({
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        subtitle: product.subtitle ?? '',
        sizeLabel: product.sizeLabel ?? '',
        description: product.description,
        howToUse: product.howToUse,
        benefits: toListFields(product.benefits),
        ingredients: toListFields(product.ingredients),
        imageUrl: product.imageUrl ?? '',
        galleryImages: product.galleryImages,
        isPublished: product.isPublished,
        isFlashSale: product.isFlashSale,
        price: String(product.price),
        compareAtPrice:
          product.compareAtPrice === null ? '' : String(product.compareAtPrice),
        stock: String(product.stock),
        categoryId: product.category.id,
      });
      setHasCustomizedSlug(true);
    },
    [form],
  );

  useEffect(() => {
    if (productId || hasCustomizedSlug) {
      return;
    }

    form.setValue('slug', slugify(nameValue), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, hasCustomizedSlug, nameValue, productId]);

  useEffect(() => {
    const price = Number(priceValue);
    const compareAtPrice = Number(compareAtPriceValue);
    const hasValidPrice = Number.isFinite(price);
    const hasValidCompareAtPrice =
      compareAtPriceValue.trim().length > 0 && Number.isFinite(compareAtPrice);
    const hasDiscount =
      hasValidPrice && hasValidCompareAtPrice && compareAtPrice > price;

    if (hasDiscount && !isFlashSaleValue) {
      form.setValue('isFlashSale', true, {
        shouldDirty: true,
      });
      return;
    }

    if (!hasDiscount && isFlashSaleValue) {
      form.setValue('isFlashSale', false, {
        shouldDirty: true,
      });
    }
  }, [compareAtPriceValue, form, isFlashSaleValue, priceValue]);

  useEffect(() => {
    let isCancelled = false;

    void Promise.all([
      listAdminProductCategories(),
      productId ? getAdminProductDetail(productId) : Promise.resolve(null),
    ])
      .then(([categoryResponse, productResponse]) => {
        if (isCancelled) {
          return;
        }

        setCategories(categoryResponse);

        if (productResponse) {
          applyProductToForm(productResponse.product);
        } else if (!form.getValues('categoryId') && categoryResponse[0]) {
          form.setValue('categoryId', categoryResponse[0].id, {
            shouldDirty: false,
          });
        }

        setPageError(null);
      })
      .catch(() => {
        if (!isCancelled) {
          setPageError(uiText.loadFailed);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [applyProductToForm, form, productId, uiText.loadFailed]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const selectedFiles = Array.from(files);
    const nextWarnings = await buildUploadWarnings(selectedFiles);
    setUploadWarnings(nextWarnings);

    setIsUploading(true);

    try {
      const uploadSlug =
        form.getValues('slug').trim() || slugify(form.getValues('name'));
      const response = await uploadAdminProductImages(
        selectedFiles,
        uploadSlug,
      );
      const urls = response.items.map((item) => item.url);
      const currentImageUrl = form.getValues('imageUrl');
      const currentGallery = form.getValues('galleryImages');
      const mergedGallery = Array.from(
        new Set(
          [
            ...urls,
            ...currentGallery.filter(
              (item) =>
                !urls.includes(item) &&
                !(
                  currentImageUrl.startsWith('/images/products/') &&
                  item === currentImageUrl
                ),
            ),
          ].filter(Boolean),
        ),
      );

      form.setValue('galleryImages', mergedGallery, {
        shouldDirty: true,
        shouldValidate: true,
      });

      form.setValue('imageUrl', urls[0], {
        shouldDirty: true,
        shouldValidate: true,
      });

      setPageError(null);
      pushToast({
        title: uiText.uploadSuccessTitle,
        description: uiText.uploadSuccessDescription,
        tone: 'success',
      });
    } catch (error: unknown) {
      setPageError(
        toApiError(error, {
          code: 'ADMIN_PRODUCT_UPLOAD_FAILED',
          message: uiText.uploadFailed,
        }).message,
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit(values: ProductEditorFormValues) {
    setIsSubmitting(true);
    form.clearErrors();
    setPageError(null);

    const price = Number(values.price);
    const compareAtPrice = values.compareAtPrice
      ? Number(values.compareAtPrice)
      : null;
    const hasDiscount = compareAtPrice !== null && compareAtPrice > price;

    const payload: AdminProductUpsertInput = {
      name: values.name.trim(),
      sku: values.sku.trim().toUpperCase(),
      slug: values.slug.trim(),
      subtitle: values.subtitle.trim() || null,
      sizeLabel: values.sizeLabel.trim() || null,
      description: values.description.trim(),
      howToUse: values.howToUse.trim(),
      benefits: toListValues(values.benefits),
      ingredients: toListValues(values.ingredients),
      imageUrl: values.imageUrl.trim() || null,
      galleryImages: values.galleryImages,
      isPublished: values.isPublished,
      isFlashSale: hasDiscount,
      price,
      compareAtPrice: hasDiscount ? compareAtPrice : null,
      stock: Number(values.stock),
      categoryId: values.categoryId,
    };

    try {
      const response = productId
        ? await updateAdminProduct(productId, payload)
        : await createAdminProduct(payload);
      applyProductToForm(response.product);
      setPageError(null);
      pushToast({
        title: uiText.saveSuccessTitle,
        description: uiText.saveSuccessDescription,
        tone: 'success',
      });
      router.replace(`/admin/products/${response.product.id}`);
      router.refresh();
    } catch (error: unknown) {
      const apiError = toApiError(error, {
        code: 'ADMIN_PRODUCT_SAVE_FAILED',
        message: uiText.saveFailed,
      });

      const firstFieldErrorMessage = applyAdminProductApiFieldErrors(
        apiError,
        validationText,
        form.setError,
      );

      setPageError(firstFieldErrorMessage ?? apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function onInvalidSubmit() {
    const firstErrorMessage = [
      form.formState.errors.name?.message,
      form.formState.errors.sku?.message,
      form.formState.errors.slug?.message,
      form.formState.errors.categoryId?.message,
      form.formState.errors.price?.message,
      form.formState.errors.compareAtPrice?.message,
      form.formState.errors.stock?.message,
      form.formState.errors.description?.message,
      form.formState.errors.howToUse?.message,
      getFieldGroupErrorMessage(form.formState.errors.benefits),
      getFieldGroupErrorMessage(form.formState.errors.ingredients),
    ].find((message): message is string => typeof message === 'string');

    const resolvedMessage = firstErrorMessage
      ? (getProductEditorErrorMessage(validationText, firstErrorMessage) ??
        firstErrorMessage)
      : '';

    setPageError(resolvedMessage || null);

    pushToast({
      title: uiText.validationErrorTitle,
      description: resolvedMessage,
      tone: 'error',
    });
  }

  function removeImageFromGallery(url: string) {
    const nextImages = galleryImages.filter((item) => item !== url);
    form.setValue('galleryImages', nextImages, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (imageUrl === url) {
      form.setValue('imageUrl', nextImages[0] ?? '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    setPendingRemoveImageUrl(null);
    pushToast({
      title: uiText.removeImageSuccessTitle,
      description: uiText.removeImageSuccessDescription,
      tone: 'info',
    });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-144 items-center justify-center px-4 py-8">
        <p className="text-sm font-medium text-muted-foreground">
          {uiText.loading}
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-5 px-1 pb-4">
      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Button asChild variant="ghost" size="sm" className="px-0">
              <Link href="/admin/products">
                <ArrowLeftIcon data-icon="inline-start" />
                {uiText.back}
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-[2.2rem] leading-none tracking-[0.01em] text-[#fbf1eb] sm:text-[2.75rem]">
                {uiText.title}
              </h2>
              {isPublishedValue ? (
                <Badge
                  variant="outline"
                  className="border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
                >
                  {uiText.published}
                </Badge>
              ) : (
                <Badge variant="outline">{uiText.hidden}</Badge>
              )}
            </div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {uiText.description}
            </p>
          </div>
          <Button
            onClick={form.handleSubmit(onSubmit, onInvalidSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoaderCircleIcon
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            {isSubmitting ? uiText.saving : uiText.save}
          </Button>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-[1.4rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,0.75fr)]">
        <div className="grid gap-5">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">{uiText.detailsTitle}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {uiText.detailsDescription}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="product-name">{uiText.name}</Label>
                <Input
                  id="product-name"
                  aria-invalid={form.formState.errors.name ? 'true' : undefined}
                  placeholder={uiText.namePlaceholder}
                  {...form.register('name')}
                />
                <p className="text-xs text-muted-foreground">
                  {uiText.nameHelper}
                </p>
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      validationText,
                      form.formState.errors.name.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-slug">{uiText.slug}</Label>
                <Input
                  id="product-slug"
                  aria-invalid={form.formState.errors.slug ? 'true' : undefined}
                  placeholder="quiet-bloom-amino-cleanser"
                  {...form.register('slug')}
                  onChange={(event) => {
                    setHasCustomizedSlug(true);
                    form.setValue('slug', event.target.value, {
                      shouldDirty: true,
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {uiText.slugHelper}
                </p>
                {form.formState.errors.slug &&
                form.formState.errors.slug.message !==
                  PRODUCT_EDITOR_ERROR.slugRequired ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      validationText,
                      form.formState.errors.slug.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-sku">{uiText.sku}</Label>
                <Input
                  id="product-sku"
                  aria-invalid={form.formState.errors.sku ? 'true' : undefined}
                  placeholder="FCE-CLN-001"
                  {...(() => {
                    const skuField = form.register('sku');

                    return {
                      ...skuField,
                      onChange: (
                        event: React.ChangeEvent<HTMLInputElement>,
                      ) => {
                        event.target.value = event.target.value.toUpperCase();
                        skuField.onChange(event);
                      },
                    };
                  })()}
                />
                <p className="text-xs text-muted-foreground">
                  {uiText.skuHelper}
                </p>
                {form.formState.errors.sku ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      validationText,
                      form.formState.errors.sku.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-subtitle">{uiText.subtitle}</Label>
                <Input
                  id="product-subtitle"
                  aria-invalid={
                    form.formState.errors.subtitle ? 'true' : undefined
                  }
                  placeholder={uiText.subtitlePlaceholder}
                  {...form.register('subtitle')}
                />
                <p className="text-xs text-muted-foreground">
                  {uiText.subtitleHelper}
                </p>
                {form.formState.errors.subtitle ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.subtitle.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{uiText.category}</Label>
                  <Select
                    value={categoryId}
                    onValueChange={(value) =>
                      form.setValue('categoryId', value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-invalid={
                        form.formState.errors.categoryId ? 'true' : undefined
                      }
                    >
                      <SelectValue placeholder={uiText.category} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId ? (
                    <p className="text-xs text-destructive">
                      {getProductEditorErrorMessage(
                        validationText,
                        form.formState.errors.categoryId.message,
                      )}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-size">{uiText.sizeLabel}</Label>
                  <Input
                    id="product-size"
                    aria-invalid={
                      form.formState.errors.sizeLabel ? 'true' : undefined
                    }
                    placeholder={uiText.sizePlaceholder}
                    {...form.register('sizeLabel')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">{uiText.contentTitle}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {uiText.contentDescription}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="product-description">
                  {uiText.descriptionLabel}
                </Label>
                <Textarea
                  id="product-description"
                  aria-invalid={
                    form.formState.errors.description ? 'true' : undefined
                  }
                  rows={2}
                  placeholder={uiText.descriptionPlaceholder}
                  {...form.register('description')}
                />
                {form.formState.errors.description ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      validationText,
                      form.formState.errors.description.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-how-to-use">{uiText.howToUse}</Label>
                <Textarea
                  id="product-how-to-use"
                  aria-invalid={
                    form.formState.errors.howToUse ? 'true' : undefined
                  }
                  rows={2}
                  placeholder={uiText.howToUsePlaceholder}
                  {...form.register('howToUse')}
                />
                {form.formState.errors.howToUse ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      validationText,
                      form.formState.errors.howToUse.message,
                    )}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <DynamicListEditor
            fieldName="benefits"
            title={uiText.benefits}
            description={uiText.benefitsDescription}
            addLabel={uiText.addBenefit}
            emptyLabel={uiText.itemPlaceholder}
            fields={benefitsFieldArray.fields}
            register={form.register}
            remove={benefitsFieldArray.remove}
            append={benefitsFieldArray.append}
            move={benefitsFieldArray.move}
            itemErrors={toFieldErrorMessages(form.formState.errors.benefits)}
            errorMessage={getProductEditorErrorMessage(
              validationText,
              getFieldGroupErrorMessage(form.formState.errors.benefits),
            )}
          />

          <DynamicListEditor
            fieldName="ingredients"
            title={uiText.ingredients}
            description={uiText.ingredientsDescription}
            addLabel={uiText.addIngredient}
            emptyLabel={uiText.itemPlaceholder}
            fields={ingredientsFieldArray.fields}
            register={form.register}
            remove={ingredientsFieldArray.remove}
            append={ingredientsFieldArray.append}
            move={ingredientsFieldArray.move}
            itemErrors={toFieldErrorMessages(form.formState.errors.ingredients)}
            errorMessage={getProductEditorErrorMessage(
              validationText,
              getFieldGroupErrorMessage(form.formState.errors.ingredients),
            )}
          />
        </div>

        <div className="grid gap-5">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">
                {uiText.merchandisingTitle}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {uiText.merchandisingDescription}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="product-price">{uiText.price}</Label>
                  <Input
                    id="product-price"
                    aria-invalid={
                      form.formState.errors.price ? 'true' : undefined
                    }
                    placeholder="350"
                    {...form.register('price')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {uiText.priceHelper}
                  </p>
                  {form.formState.errors.price ? (
                    <p className="text-xs text-destructive">
                      {getProductEditorErrorMessage(
                        validationText,
                        form.formState.errors.price.message,
                      )}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-compare">
                    {uiText.compareAtPrice}
                  </Label>
                  <Input
                    id="product-compare"
                    aria-invalid={
                      form.formState.errors.compareAtPrice ? 'true' : undefined
                    }
                    {...form.register('compareAtPrice')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {uiText.compareAtHelper}
                  </p>
                  {form.formState.errors.compareAtPrice ? (
                    <p className="text-xs text-destructive">
                      {getProductEditorErrorMessage(
                        validationText,
                        form.formState.errors.compareAtPrice.message,
                      ) ?? form.formState.errors.compareAtPrice.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-stock">{uiText.stock}</Label>
                <Input
                  id="product-stock"
                  aria-invalid={
                    form.formState.errors.stock ? 'true' : undefined
                  }
                  placeholder="25"
                  {...form.register('stock')}
                />
                {form.formState.errors.stock ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      validationText,
                      form.formState.errors.stock.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="rounded-[1.3rem] border border-border/60 bg-card/65 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {uiText.publish}
                  </p>
                  <Switch
                    checked={isPublishedValue}
                    onCheckedChange={(checked) =>
                      form.setValue('isPublished', checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {uiText.onSale}
                  </p>
                  <Switch
                    checked={isFlashSaleValue}
                    onCheckedChange={(checked) => {
                      form.setValue('isFlashSale', checked, {
                        shouldDirty: true,
                      });

                      if (!checked) {
                        form.setValue('compareAtPrice', '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">{uiText.mediaTitle}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {uiText.mediaDescription}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {uiText.mediaTitle}
                  </p>
                  <div className="text-[11px] leading-5 text-muted-foreground">
                    <p>{uiText.uploadRequirements}</p>
                    <p>{uploadGuidance.size}</p>
                    <p>{uploadGuidance.aspect}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void handleUpload(event.target.files);
                      event.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    <ImagePlusIcon data-icon="inline-start" />
                    {isUploading ? uiText.saving : uiText.uploadGallery}
                  </Button>
                </div>
              </div>
              {uploadWarnings.length > 0 ? (
                <div className="rounded-[1rem] border border-[#a56b50]/35 bg-[#3a251d]/55 p-3 text-xs leading-6 text-[#f4d8ca]">
                  <p className="font-medium text-[#f9e6dc]">
                    {uploadGuidance.warningsTitle}
                  </p>
                  <div className="mt-1 grid gap-1.5">
                    {uploadWarnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="hidden">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {uiText.coverImage}
                  </p>
                  <div className="flex shrink-0 flex-col-reverse items-end gap-2">
                    <div className="text-right text-[11px] leading-5 text-muted-foreground">
                      <p>{uiText.uploadRequirements}</p>
                      <p>{uiText.uploadRecommendedSize}</p>
                      <p>{uploadGuidance.aspect}</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleUpload(event.target.files);
                        event.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => mediaInputRef.current?.click()}
                    >
                      <ImagePlusIcon data-icon="inline-start" />
                      {isUploading ? uiText.saving : uiText.uploadCover}
                    </Button>
                  </div>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-[linear-gradient(180deg,#2f221d_0%,#1e1512_100%)] p-3">
                  <div className="mx-auto max-w-[18rem] overflow-hidden rounded-[1.15rem] border border-border/45 bg-[#1b130f]/75">
                    {imageUrl ? (
                      <button
                        type="button"
                        className="block w-full cursor-pointer"
                        onClick={() =>
                          setPreviewImage({
                            url: imageUrl,
                            label: uiText.coverImage,
                          })
                        }
                      >
                        <img
                          src={imageUrl}
                          alt="Product cover"
                          className="aspect-4/5 w-full object-cover object-center shadow-[0_16px_34px_rgba(0,0,0,0.28)] transition-opacity hover:opacity-90"
                        />
                      </button>
                    ) : (
                      <div className="flex aspect-4/5 w-full items-center justify-center border border-dashed border-border/50 text-sm text-muted-foreground">
                        FACEE
                      </div>
                    )}
                  </div>
                </div>
                {uploadWarnings.length > 0 ? (
                  <div className="rounded-[1rem] border border-[#a56b50]/35 bg-[#3a251d]/55 p-3 text-xs leading-6 text-[#f4d8ca]">
                    <p className="font-medium text-[#f9e6dc]">
                      {uploadGuidance.warningsTitle}
                    </p>
                    <div className="mt-1 grid gap-1.5">
                      {uploadWarnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="hidden">
                <p className="text-sm font-medium text-foreground">
                  {uiText.galleryImages}
                </p>
                <div className="flex shrink-0 flex-col-reverse items-end gap-2">
                  <div className="text-right text-[11px] leading-5 text-muted-foreground">
                    <p>{uiText.uploadRequirements}</p>
                    <p>{uiText.uploadRecommendedSize}</p>
                    <p>{uploadGuidance.aspect}</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void handleUpload(event.target.files);
                      event.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    <ImagePlusIcon data-icon="inline-start" />
                    {uiText.uploadGallery}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    {galleryImages.map((url, index) => (
                      <div
                        key={url}
                        className="overflow-hidden rounded-[1.4rem] border border-border/60 bg-card/75"
                      >
                        <div className="relative">
                          <button
                            type="button"
                            className="block w-full cursor-pointer"
                            onClick={() =>
                              setPreviewImage({
                                url,
                                label: uiText.galleryImages,
                              })
                            }
                          >
                            <div className="bg-[#1f1613]/70">
                              <img
                                src={url}
                                alt={`Gallery ${index + 1}`}
                                className="aspect-4/5 w-full object-cover object-center transition duration-200 hover:scale-[1.015] hover:opacity-95"
                              />
                            </div>
                          </button>
                          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-start gap-3 p-3">
                            <span className="rounded-full border border-black/10 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/92 backdrop-blur">
                              {uiText.galleryItemLabel(index + 1)}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 p-3">
                          {url === imageUrl ? (
                            <div className="flex justify-center">
                              <Badge className="border-primary/30 bg-primary/10 text-primary">
                                {uiText.coverImage}
                              </Badge>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {url !== imageUrl ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  form.setValue('imageUrl', url, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  form.setValue(
                                    'galleryImages',
                                    [
                                      url,
                                      ...galleryImages.filter(
                                        (item) => item !== url,
                                      ),
                                    ],
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  );
                                }}
                              >
                                {uiText.setAsCover}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground transition-colors hover:bg-destructive/12 hover:text-destructive"
                              onClick={() => setPendingRemoveImageUrl(url)}
                            >
                              <Trash2Icon data-icon="inline-start" />
                              {uiText.removeImage}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
                    {uiText.emptyGalleryDescription}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {pendingRemoveImageUrl ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/66 px-4">
          <div className="w-full max-w-md rounded-[1.75rem] border border-border/70 bg-[rgba(31,22,19,0.98)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-[#fbf1eb]">
                {uiText.removeImageTitle}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {uiText.removeImageDescription}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingRemoveImageUrl(null)}
              >
                {uiText.cancel}
              </Button>
              <Button
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => removeImageFromGallery(pendingRemoveImageUrl)}
              >
                <Trash2Icon data-icon="inline-start" />
                {uiText.confirmRemove}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {previewImage ? (
        <div
          className="fixed inset-0 z-125 flex items-center justify-center bg-black/78 px-4 py-8"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="w-full max-w-5xl rounded-[1.9rem] border border-border/70 bg-[rgba(31,22,19,0.98)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.5)] sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#fbf1eb]">
                {previewImage.label}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewImage(null)}
              >
                {uiText.closePreview}
              </Button>
            </div>
            <div className="overflow-hidden rounded-[1.4rem] border border-border/60 bg-[#140f0d]">
              <img
                src={previewImage.url}
                alt={previewImage.label}
                className="h-[min(82vh,56rem)] w-full object-contain object-center"
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
