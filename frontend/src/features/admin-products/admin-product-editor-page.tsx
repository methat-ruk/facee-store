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
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
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
import { type AdminProductUpsertInput } from '@/features/admin-products/schemas';
import { Link, useRouter } from '@/i18n/navigation';
import { toApiError } from '@/services/api-error';
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
  locale: string,
  message: string | undefined,
) {
  if (!message) {
    return message;
  }

  const isThai = locale === 'th';

  switch (message) {
    case PRODUCT_EDITOR_ERROR.nameRequired:
      return isThai ? 'กรุณากรอกชื่อสินค้า' : 'Enter the product name.';
    case PRODUCT_EDITOR_ERROR.skuRequired:
      return isThai ? 'กรุณากรอก SKU' : 'Enter the product SKU.';
    case PRODUCT_EDITOR_ERROR.skuFormat:
      return isThai
        ? 'SKU ใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข และขีด -'
        : 'SKU can use letters, numbers, and hyphens only.';
    case PRODUCT_EDITOR_ERROR.slugRequired:
      return isThai ? 'กรุณากรอก slug' : 'Enter the product slug.';
    case PRODUCT_EDITOR_ERROR.slugFormat:
      return isThai
        ? 'Slug ใช้ตัวพิมพ์เล็ก ตัวเลข และขีด - เท่านั้น'
        : 'Slug must use lowercase letters, numbers, and hyphens only.';
    case PRODUCT_EDITOR_ERROR.descriptionRequired:
      return isThai
        ? 'กรุณากรอกคำอธิบายสินค้า'
        : 'Enter the product description.';
    case PRODUCT_EDITOR_ERROR.howToUseRequired:
      return isThai ? 'กรุณากรอกวิธีใช้' : 'Enter how to use this product.';
    case PRODUCT_EDITOR_ERROR.listRequired:
      return isThai ? 'กรุณาเพิ่มอย่างน้อย 1 รายการ' : 'Add at least one item.';
    case PRODUCT_EDITOR_ERROR.priceRequired:
      return isThai ? 'กรุณากรอกราคาปัจจุบัน' : 'Enter the current price.';
    case PRODUCT_EDITOR_ERROR.stockRequired:
      return isThai ? 'กรุณากรอกจำนวนสต็อก' : 'Enter the stock quantity.';
    case PRODUCT_EDITOR_ERROR.categoryRequired:
      return isThai ? 'กรุณาเลือกหมวดหมู่' : 'Choose a category.';
    case PRODUCT_EDITOR_ERROR.compareAtPriceInvalid:
      return isThai
        ? 'ราคาเดิมต้องมากกว่าราคาปัจจุบัน'
        : 'Compare-at price must be greater than price.';
    default:
      return message;
  }
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
    <Card className="border-border/65 bg-background/68 shadow-none">
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
  const locale = useLocale();
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
  const [pendingRemoveImageUrl, setPendingRemoveImageUrl] = useState<
    string | null
  >(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const pushToast = useToastStore((state) => state.pushToast);

  const uiText =
    locale === 'th'
      ? {
          title: productId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่',
          description:
            'จัดการข้อมูลสินค้า ราคา สต็อก การเผยแพร่ และรูปภาพให้พร้อมสำหรับ storefront',
          back: 'กลับไปหน้าสินค้า',
          loading: 'กำลังโหลดข้อมูลสินค้า...',
          save: productId ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างสินค้า',
          saving: productId ? 'กำลังบันทึก...' : 'กำลังสร้าง...',
          detailsTitle: 'รายละเอียดสินค้า',
          detailsDescription:
            'กำหนดข้อมูลหลักของสินค้าให้พร้อมสำหรับการค้นหาและใช้งานในระบบ',
          merchandisingTitle: 'การขายและสต็อก',
          merchandisingDescription:
            'อัปเดตราคา สถานะการขาย และปริมาณสต็อกในพื้นที่เดียว',
          mediaTitle: 'รูปภาพสินค้า',
          mediaDescription:
            'อัปโหลดรูปหลักและจัดลำดับรูป gallery ให้พร้อมใช้งาน',
          contentTitle: 'เนื้อหาสินค้า',
          contentDescription:
            'ดูแลคำอธิบาย วิธีใช้ และรายการข้อมูลที่จะไปแสดงหน้าลูกค้า',
          name: 'ชื่อสินค้า',
          sku: 'SKU',
          slug: 'Slug',
          subtitle: 'คำโปรยสั้น',
          category: 'หมวดหมู่',
          descriptionLabel: 'คำอธิบายสินค้า',
          howToUse: 'วิธีใช้',
          benefits: 'ประโยชน์หลัก',
          ingredients: 'ส่วนผสม',
          benefitsDescription:
            'เพิ่มประโยชน์เป็นรายการแยกทีละข้อ เพื่อให้เรียงลำดับและปรับแก้ได้ง่ายก่อนแสดงบนหน้าลูกค้า',
          ingredientsDescription:
            'จัดการส่วนผสมแบบ 1 รายการต่อ 1 กล่อง เพื่อให้เพิ่ม ลบ แก้ไข และย้ายตำแหน่งได้ชัดเจน',
          addBenefit: 'เพิ่มข้อ',
          addIngredient: 'เพิ่มรายการ',
          itemPlaceholder: 'กรอกข้อมูลแต่ละข้อ',
          price: 'ราคา',
          compareAtPrice: 'ราคาเทียบ',
          stock: 'สต็อก',
          publish: 'เผยแพร่สินค้า',
          flashSale: 'Flash sale',
          coverImage: 'รูปหน้าปก',
          galleryImages: 'แกลเลอรีรูปภาพ',
          uploadCover: 'อัปโหลดรูปหน้าปก',
          uploadGallery: 'อัปโหลดรูปเพิ่ม',
          uploadRequirements: 'JPG, PNG, WEBP · สูงสุด 6 MB',
          setAsCover: 'ตั้งเป็นรูปหลัก',
          removeImage: 'ลบรูป',
          previewImage: 'ดูภาพขนาดใหญ่',
          removeImageTitle: 'ลบรูปนี้ออก?',
          removeImageDescription:
            'รูปจะถูกนำออกจากรายการในฟอร์มทันที แม้ว่ายังไม่ได้กดบันทึกการเปลี่ยนแปลง',
          cancel: 'ยกเลิก',
          confirmRemove: 'ยืนยันการลบ',
          closePreview: 'ปิดภาพ',
          saveSuccessTitle: 'บันทึกสินค้าแล้ว',
          saveSuccessDescription:
            'ข้อมูลสินค้าได้รับการอัปเดตแล้ว และพร้อมแสดงผลตามค่าล่าสุด',
          validationErrorTitle: 'ยังบันทึกไม่ได้',
          validationErrorDescription:
            'กรุณาตรวจสอบข้อมูลที่จำเป็นและข้อความแจ้งเตือนในแบบฟอร์มก่อนบันทึกอีกครั้ง',
          uploadSuccessTitle: 'อัปโหลดรูปสำเร็จ',
          uploadSuccessDescription:
            'เพิ่มรูปภาพสินค้าเข้าแบบฟอร์มเรียบร้อยแล้ว',
          removeImageSuccessTitle: 'นำรูปออกแล้ว',
          removeImageSuccessDescription:
            'รูปถูกนำออกจากแบบฟอร์มแล้ว และจะไม่อยู่ในสินค้านี้เมื่อบันทึก',
          emptyGallery: 'ยังไม่มีรูปในแกลเลอรี',
          uploadFailed: 'อัปโหลดรูปภาพไม่สำเร็จ',
          loadFailed: 'โหลดข้อมูลสินค้าไม่สำเร็จ',
          saveFailed: 'บันทึกสินค้าไม่สำเร็จ',
          hidden: 'ยังไม่เผยแพร่',
          published: 'เผยแพร่แล้ว',
        }
      : {
          title: productId ? 'Edit product' : 'Create a new product',
          description:
            'Manage catalog copy, pricing, stock, publishing, and product imagery for the storefront.',
          back: 'Back to products',
          loading: 'Loading product details...',
          save: productId ? 'Save changes' : 'Create product',
          saving: productId ? 'Saving...' : 'Creating...',
          detailsTitle: 'Product details',
          detailsDescription:
            'Set the core identity, naming, and routing fields for this catalog entry.',
          merchandisingTitle: 'Merchandising and stock',
          merchandisingDescription:
            'Review selling price, publish state, campaign flag, and available units together.',
          mediaTitle: 'Product media',
          mediaDescription:
            'Upload the lead image and arrange supporting gallery visuals for the storefront.',
          contentTitle: 'Customer-facing content',
          contentDescription:
            'Maintain the descriptive copy and structured lists shown on the product page.',
          name: 'Product name',
          sku: 'SKU',
          slug: 'Slug',
          subtitle: 'Subtitle',
          category: 'Category',
          descriptionLabel: 'Description',
          howToUse: 'How to use',
          benefits: 'Benefits',
          ingredients: 'Ingredients',
          benefitsDescription:
            'Manage each customer-facing benefit as a separate line so the product page stays easy to scan.',
          ingredientsDescription:
            'Keep ingredients as one row per item so the team can add, edit, remove, and reorder them cleanly.',
          addBenefit: 'Add benefit',
          addIngredient: 'Add ingredient',
          itemPlaceholder: 'Add one item here',
          price: 'Price',
          compareAtPrice: 'Compare-at price',
          stock: 'Stock',
          publish: 'Publish product',
          flashSale: 'Flash sale',
          coverImage: 'Cover image',
          galleryImages: 'Gallery images',
          uploadCover: 'Upload cover image',
          uploadGallery: 'Upload more images',
          uploadRequirements: 'JPG, PNG, WEBP · Up to 6 MB',
          setAsCover: 'Set as cover',
          removeImage: 'Remove image',
          previewImage: 'Preview image',
          removeImageTitle: 'Remove this image?',
          removeImageDescription:
            'The image will be removed from this form immediately, even before you save changes.',
          cancel: 'Cancel',
          confirmRemove: 'Remove image',
          closePreview: 'Close preview',
          saveSuccessTitle: 'Product saved',
          saveSuccessDescription:
            'The product has been updated and is ready to reflect the latest content.',
          validationErrorTitle: 'Unable to save yet',
          validationErrorDescription:
            'Please review the required fields and any inline validation messages before saving again.',
          uploadSuccessTitle: 'Images uploaded',
          uploadSuccessDescription:
            'The selected images were added to this product form successfully.',
          removeImageSuccessTitle: 'Image removed',
          removeImageSuccessDescription:
            'The image was removed from this form and will stay out after you save.',
          emptyGallery: 'No gallery images yet.',
          uploadFailed: 'Unable to upload product images right now.',
          loadFailed: 'Unable to load this product right now.',
          saveFailed: 'Unable to save this product right now.',
          hidden: 'Hidden',
          published: 'Published',
        };

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
          const product = productResponse.product;

          form.reset({
            name: product.name,
            sku: product.sku,
            slug: product.slug,
            subtitle: product.subtitle ?? '',
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
              product.compareAtPrice === null
                ? ''
                : String(product.compareAtPrice),
            stock: String(product.stock),
            categoryId: product.category.id,
          });
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
  }, [form, productId, uiText.loadFailed]);

  async function handleUpload(
    files: FileList | null,
    mode: 'cover' | 'gallery',
  ) {
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadAdminProductImages(Array.from(files));
      const urls = response.items.map((item) => item.url);
      const currentGallery = form.getValues('galleryImages');
      const mergedGallery = Array.from(new Set([...currentGallery, ...urls]));

      form.setValue('galleryImages', mergedGallery, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (mode === 'cover' || !form.getValues('imageUrl')) {
        form.setValue('imageUrl', urls[0], {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

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

      setPageError(null);
      pushToast({
        title: uiText.saveSuccessTitle,
        description: uiText.saveSuccessDescription,
        tone: 'success',
      });
      router.push(`/admin/products/${response.product.id}`);
      router.refresh();
    } catch (error: unknown) {
      const apiError = toApiError(error, {
        code: 'ADMIN_PRODUCT_SAVE_FAILED',
        message: uiText.saveFailed,
      });

      setPageError(apiError.message);

      if (apiError.fieldErrors?.sku) {
        form.setError('sku', {
          message:
            locale === 'th'
              ? 'SKU นี้ถูกใช้งานแล้ว'
              : 'This SKU is already in use.',
        });
      }

      if (apiError.fieldErrors?.slug) {
        form.setError('slug', {
          message:
            locale === 'th'
              ? 'Slug นี้ถูกใช้งานแล้ว'
              : 'This slug is already in use.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function onInvalidSubmit() {
    pushToast({
      title: uiText.validationErrorTitle,
      description: uiText.validationErrorDescription,
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
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="product-name">{uiText.name}</Label>
                <Input
                  id="product-name"
                  placeholder={
                    locale === 'th'
                      ? 'เช่น Quiet Bloom Amino Cleanser'
                      : 'For example: Quiet Bloom Amino Cleanser'
                  }
                  {...form.register('name')}
                />
                <p className="text-xs text-muted-foreground">
                  {locale === 'th'
                    ? 'ใช้ชื่อที่ลูกค้าจะเห็นบนหน้าสินค้าและในรายการค้นหา'
                    : 'Use the customer-facing product name shown across the storefront.'}
                </p>
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      locale,
                      form.formState.errors.name.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-sku">{uiText.sku}</Label>
                <Input
                  id="product-sku"
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
                  {locale === 'th'
                    ? 'ใช้ตัวอักษรอังกฤษ ตัวเลข และขีด - เท่านั้น'
                    : 'Use letters, numbers, and hyphens only.'}
                </p>
                {form.formState.errors.sku ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      locale,
                      form.formState.errors.sku.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-slug">{uiText.slug}</Label>
                <Input
                  id="product-slug"
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
                  {locale === 'th'
                    ? 'ใช้ตัวพิมพ์เล็ก ตัวเลข และขีด - สำหรับ URL สินค้า'
                    : 'Use lowercase letters, numbers, and hyphens for the product URL.'}
                </p>
                {form.formState.errors.slug &&
                form.formState.errors.slug.message !==
                  PRODUCT_EDITOR_ERROR.slugRequired ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      locale,
                      form.formState.errors.slug.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-subtitle">{uiText.subtitle}</Label>
                <Input
                  id="product-subtitle"
                  placeholder={
                    locale === 'th'
                      ? 'ข้อความสั้นใต้ชื่อสินค้า'
                      : 'A short line shown under the product name'
                  }
                  {...form.register('subtitle')}
                />
                {form.formState.errors.subtitle ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.subtitle.message}
                  </p>
                ) : null}
              </div>
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
                  <SelectTrigger>
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
                      locale,
                      form.formState.errors.categoryId.message,
                    )}
                  </p>
                ) : null}
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
                  rows={2}
                  placeholder={
                    locale === 'th'
                      ? 'อธิบายเนื้อสัมผัส จุดเด่น และความรู้สึกหลังใช้'
                      : 'Describe the texture, purpose, and skin feel after use.'
                  }
                  {...form.register('description')}
                />
                {form.formState.errors.description ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      locale,
                      form.formState.errors.description.message,
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-how-to-use">{uiText.howToUse}</Label>
                <Textarea
                  id="product-how-to-use"
                  rows={2}
                  placeholder={
                    locale === 'th'
                      ? 'เช่น นวดบนผิวเปียกแล้วล้างออก'
                      : 'For example: Massage onto damp skin, then rinse.'
                  }
                  {...form.register('howToUse')}
                />
                {form.formState.errors.howToUse ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      locale,
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
              locale,
              form.formState.errors.benefits?.message,
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
              locale,
              form.formState.errors.ingredients?.message,
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
                    placeholder="350"
                    {...form.register('price')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {locale === 'th'
                      ? 'ราคาขายจริงที่ลูกค้าจ่ายตอนนี้'
                      : 'The current selling price shown to customers.'}
                  </p>
                  {form.formState.errors.price ? (
                    <p className="text-xs text-destructive">
                      {getProductEditorErrorMessage(
                        locale,
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
                    {...form.register('compareAtPrice')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {locale === 'th'
                      ? 'ราคาเดิมต้องมากกว่าราคาปัจจุบันเสมอ'
                      : 'Compare-at price must be higher than the current price.'}
                  </p>
                  {form.formState.errors.compareAtPrice ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.compareAtPrice.message ===
                      'Compare-at price must be greater than price.'
                        ? locale === 'th'
                          ? 'ราคาเดิมต้องมากกว่าราคาปัจจุบัน'
                          : 'Compare-at price must be greater than price.'
                        : form.formState.errors.compareAtPrice.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-stock">{uiText.stock}</Label>
                <Input
                  id="product-stock"
                  placeholder="25"
                  {...form.register('stock')}
                />
                {form.formState.errors.stock ? (
                  <p className="text-xs text-destructive">
                    {getProductEditorErrorMessage(
                      locale,
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
                    {uiText.flashSale}
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
            <CardContent className="grid gap-5">
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {uiText.coverImage}
                  </p>
                  <div className="flex shrink-0 flex-col-reverse items-end gap-2">
                    <div className="text-right text-[11px] leading-5 text-muted-foreground">
                      <p>{uiText.uploadRequirements}</p>
                      <p>
                        {locale === 'th'
                          ? 'à¹à¸™à¸°à¸™à¸³ 1200 Ã— 1500 px à¸‚à¸¶à¹‰à¸™à¹„à¸›'
                          : 'Recommended 1200 × 1500 px or larger'}
                      </p>
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        void handleUpload(event.target.files, 'cover')
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => coverInputRef.current?.click()}
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
              </div>

              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {uiText.galleryImages}
                </p>
                <div className="flex shrink-0 flex-col-reverse items-end gap-2">
                  <div className="text-right text-[11px] leading-5 text-muted-foreground">
                    <p>{uiText.uploadRequirements}</p>
                    <p>
                      {locale === 'th'
                        ? 'à¹à¸™à¸°à¸™à¸³ 1200 Ã— 1500 px à¸‚à¸¶à¹‰à¸™à¹„à¸›'
                        : 'Recommended 1200 × 1500 px or larger'}
                    </p>
                  </div>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) =>
                      void handleUpload(event.target.files, 'gallery')
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImagePlusIcon data-icon="inline-start" />
                    {uiText.uploadGallery}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {galleryImages.length > 0 ? (
                  galleryImages.map((url) => (
                    <div
                      key={url}
                      className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-4 rounded-[1.3rem] border border-border/60 bg-card/70 p-4"
                    >
                      <div className="self-start overflow-hidden rounded-[1rem] border border-border/60 bg-background/70">
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
                              alt="Gallery"
                              className="aspect-3/4 w-full object-cover object-center transition-opacity hover:opacity-90"
                            />
                          </div>
                        </button>
                      </div>
                      <div className="grid min-w-0 gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 space-y-2">
                            <p className="break-all text-sm font-medium leading-6 text-foreground">
                              {url}
                            </p>
                            {url === imageUrl ? (
                              <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-primary"
                              >
                                {uiText.coverImage}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                            {url !== imageUrl ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  form.setValue('imageUrl', url, {
                                    shouldDirty: true,
                                  })
                                }
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
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
                    {uiText.emptyGallery}
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
