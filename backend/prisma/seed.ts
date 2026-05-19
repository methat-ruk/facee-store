import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
const PASSWORD_SALT_ROUNDS = 12;
const adminSeed = {
  email: 'admin@facee.local',
  fullName: 'Facee Admin',
  password: 'password123',
  role: 'ADMIN' as const,
};
const customerSeed = {
  email: 'customer@facee.local',
  fullName: 'Facee Customer',
  password: 'password123',
  phone: '0812345678',
  addressLine: '88 Sukhumvit Road',
  city: 'Bangkok',
  postalCode: '10110',
  role: 'CUSTOMER' as const,
};

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

const categories = [
  {
    name: 'Cleansers',
    slug: 'cleansers',
  },
  {
    name: 'Serums',
    slug: 'serums',
  },
  {
    name: 'Moisturizers',
    slug: 'moisturizers',
  },
  {
    name: 'Sun Care',
    slug: 'sun-care',
  },
] as const;

const categoryGalleryMap = {
  cleansers: [
    '/images/products/cloud-calm-gel-cleanser.png',
    '/images/products/soft-reset-cream-cleanser.png',
    '/images/products/quiet-bloom-amino-cleanser.png',
  ],
  serums: [
    '/images/products/bright-dew-vitamin-serum.png',
    '/images/products/barrier-bloom-peptide-serum.png',
    '/images/products/pure-balance-bha-serum.png',
  ],
  moisturizers: [
    '/images/products/daily-veil-moisture-cream.png',
    '/images/products/overnight-silk-repair-cream.png',
    '/images/products/hydra-petal-water-cream.png',
  ],
  'sun-care': [
    '/images/products/velvet-shield-spf-50.png',
    '/images/products/airy-glow-tone-up-spf-50.png',
    '/images/products/invisible-finish-uv-milk.png',
  ],
} as const;

type ProductSeed = {
  name: string;
  sku: string;
  slug: string;
  subtitle: string;
  sizeLabel: string;
  description: string;
  howToUse: string;
  benefits: string[];
  ingredients: string[];
  imageUrl: string;
  galleryImages: string[];
  isPublished: boolean;
  isFlashSale?: boolean;
  price: string;
  compareAtPrice?: string;
  stock: number;
  categorySlug: keyof typeof categoryGalleryMap;
};

type SeedProductLookup = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
};

function buildGallery(
  primaryImage: string,
  categorySlug: keyof typeof categoryGalleryMap,
) {
  return [
    primaryImage,
    ...categoryGalleryMap[categorySlug].filter((item) => item !== primaryImage),
  ];
}

const products: ProductSeed[] = [
  {
    name: 'Cloud Calm Gel Cleanser',
    sku: 'FCE-CLN-001',
    slug: 'cloud-calm-gel-cleanser',
    subtitle:
      'A comfort-first gel wash that leaves skin fresh, soft, and balanced.',
    sizeLabel: '150 ml',
    description:
      'A gentle gel cleanser that removes excess oil without leaving the skin feeling stripped or tight.',
    howToUse:
      'Massage one to two pumps over damp skin for 30 seconds, then rinse with lukewarm water. Use morning and evening as your first skincare step.',
    benefits: [
      'Refreshes without a squeaky-clean after-feel',
      'Supports a calm, balanced skin finish',
      'Works well for daily morning and evening use',
    ],
    ingredients: ['Glycerin', 'Panthenol', 'Betaine', 'Allantoin'],
    imageUrl: '/images/products/cloud-calm-gel-cleanser.png',
    galleryImages: buildGallery(
      '/images/products/cloud-calm-gel-cleanser.png',
      'cleansers',
    ),
    isPublished: true,
    price: '490.00',
    stock: 28,
    categorySlug: 'cleansers',
  },
  {
    name: 'Soft Reset Cream Cleanser',
    sku: 'FCE-CLN-002',
    slug: 'soft-reset-cream-cleanser',
    subtitle: 'A plush cream cleanser made to comfort dry or sensitive skin.',
    sizeLabel: '120 ml',
    description:
      'A creamy face wash for dry and sensitive skin with a comfort-first texture for morning and evening routines.',
    howToUse:
      'Smooth a small amount onto damp skin, massage gently, and rinse clean. Follow with a hydrating serum or moisturizer.',
    benefits: [
      'Comforts skin while cleansing away residue',
      'Leaves skin feeling soft and replenished',
      'Ideal for dry, delicate, or redness-prone routines',
    ],
    ingredients: ['Squalane', 'Glycerin', 'Ceramide NP', 'Oat Extract'],
    imageUrl: '/images/products/soft-reset-cream-cleanser.png',
    galleryImages: buildGallery(
      '/images/products/soft-reset-cream-cleanser.png',
      'cleansers',
    ),
    isPublished: true,
    price: '520.00',
    stock: 14,
    categorySlug: 'cleansers',
  },
  {
    name: 'Bright Dew Vitamin Serum',
    sku: 'FCE-SRM-001',
    slug: 'bright-dew-vitamin-serum',
    subtitle:
      'A glow-focused serum for uneven tone, dullness, and daily radiance.',
    sizeLabel: '30 ml',
    description:
      'A lightweight brightening serum made for uneven tone, dullness, and everyday glow support.',
    howToUse:
      'Apply two to three drops after cleansing and before moisturizer. Use in the morning with sunscreen or in the evening for glow support.',
    benefits: [
      'Supports a brighter, more even-looking complexion',
      'Layers smoothly under moisturizer and SPF',
      'Adds lightweight hydration without heaviness',
    ],
    ingredients: ['Vitamin C Derivative', 'Niacinamide', 'Hyaluronic Acid'],
    imageUrl: '/images/products/bright-dew-vitamin-serum.png',
    galleryImages: buildGallery(
      '/images/products/bright-dew-vitamin-serum.png',
      'serums',
    ),
    isPublished: true,
    isFlashSale: true,
    price: '790.00',
    compareAtPrice: '990.00',
    stock: 11,
    categorySlug: 'serums',
  },
  {
    name: 'Barrier Bloom Peptide Serum',
    sku: 'FCE-SRM-002',
    slug: 'barrier-bloom-peptide-serum',
    subtitle:
      'A silky peptide serum designed to support bounce and barrier comfort.',
    sizeLabel: '30 ml',
    description:
      'A peptide-focused serum that helps the skin barrier feel smoother, calmer, and more resilient over time.',
    howToUse:
      'Press one to two pumps into clean skin before cream. Best used in the evening or as part of a recovery-focused routine.',
    benefits: [
      'Helps skin feel smooth and comforted',
      'Supports a supple, resilient barrier feel',
      'Pairs well with moisturizers and recovery creams',
    ],
    ingredients: ['Peptide Complex', 'Panthenol', 'Beta-Glucan', 'Ceramides'],
    imageUrl: '/images/products/barrier-bloom-peptide-serum.png',
    galleryImages: buildGallery(
      '/images/products/barrier-bloom-peptide-serum.png',
      'serums',
    ),
    isPublished: true,
    isFlashSale: true,
    price: '890.00',
    compareAtPrice: '1090.00',
    stock: 8,
    categorySlug: 'serums',
  },
  {
    name: 'Daily Veil Moisture Cream',
    sku: 'FCE-MST-001',
    slug: 'daily-veil-moisture-cream',
    subtitle: 'A balanced daily cream for smooth hydration with a soft finish.',
    sizeLabel: '50 ml',
    description:
      'A daily moisturizer for balanced hydration with a soft finish that layers well under makeup.',
    howToUse:
      'Apply as the final step of your morning or evening routine. Smooth over face and neck after serum.',
    benefits: [
      'Delivers balanced hydration with a breathable finish',
      'Sits comfortably under sunscreen or makeup',
      'Helps skin feel soft and polished throughout the day',
    ],
    ingredients: ['Ceramide NP', 'Shea Butter', 'Glycerin', 'Squalane'],
    imageUrl: '/images/products/daily-veil-moisture-cream.png',
    galleryImages: buildGallery(
      '/images/products/daily-veil-moisture-cream.png',
      'moisturizers',
    ),
    isPublished: true,
    price: '690.00',
    stock: 19,
    categorySlug: 'moisturizers',
  },
  {
    name: 'Overnight Silk Repair Cream',
    sku: 'FCE-MST-002',
    slug: 'overnight-silk-repair-cream',
    subtitle: 'A richer recovery cream built for deep overnight comfort.',
    sizeLabel: '50 ml',
    description:
      'A richer evening cream designed to support recovery, comfort, and long-lasting overnight moisture.',
    howToUse:
      'Use as the final evening step. Smooth a generous layer over face and neck to lock in moisture overnight.',
    benefits: [
      'Supports overnight moisture retention',
      'Comforts skin after active or dry-day routines',
      'Leaves skin feeling soft and cushioned by morning',
    ],
    ingredients: ['Shea Butter', 'Ceramide Complex', 'Squalane', 'Bisabolol'],
    imageUrl: '/images/products/overnight-silk-repair-cream.png',
    galleryImages: buildGallery(
      '/images/products/overnight-silk-repair-cream.png',
      'moisturizers',
    ),
    isPublished: true,
    price: '950.00',
    stock: 6,
    categorySlug: 'moisturizers',
  },
  {
    name: 'Velvet Shield SPF 50',
    sku: 'FCE-SUN-001',
    slug: 'velvet-shield-spf-50',
    subtitle:
      'A soft-finish daily sunscreen that feels smooth and invisible on skin.',
    sizeLabel: '50 ml',
    description:
      'A broad-spectrum sunscreen with a lightweight feel and a no-white-cast finish for everyday wear.',
    howToUse:
      'Apply generously as the final step of your morning routine. Reapply throughout the day as needed, especially after sweat or sun exposure.',
    benefits: [
      'Helps protect skin with a lightweight daily texture',
      'Leaves little to no visible cast on skin',
      'Sits smoothly under makeup or over skincare',
    ],
    ingredients: ['UV Filters', 'Vitamin E', 'Glycerin', 'Silica'],
    imageUrl: '/images/products/velvet-shield-spf-50.png',
    galleryImages: buildGallery(
      '/images/products/velvet-shield-spf-50.png',
      'sun-care',
    ),
    isPublished: true,
    isFlashSale: true,
    price: '640.00',
    compareAtPrice: '790.00',
    stock: 23,
    categorySlug: 'sun-care',
  },
  {
    name: 'Airy Glow Tone-Up SPF 50',
    sku: 'FCE-SUN-002',
    slug: 'airy-glow-tone-up-spf-50',
    subtitle: 'A brightening sunscreen with a fresh tone-up finish.',
    sizeLabel: '50 ml',
    description:
      'A subtle tone-up sunscreen that helps brighten the complexion while protecting against daily UV exposure.',
    howToUse:
      'Spread evenly over the face as the last morning skincare step. Blend outward for a naturally brightened finish.',
    benefits: [
      'Adds a subtle brightening effect to the complexion',
      'Combines daily protection with lightweight wear',
      'Works well on no-makeup or minimal-makeup days',
    ],
    ingredients: ['UV Filters', 'Niacinamide', 'Pearl Pigment', 'Glycerin'],
    imageUrl: '/images/products/airy-glow-tone-up-spf-50.png',
    galleryImages: buildGallery(
      '/images/products/airy-glow-tone-up-spf-50.png',
      'sun-care',
    ),
    isPublished: true,
    price: '720.00',
    stock: 17,
    categorySlug: 'sun-care',
  },
  {
    name: 'Pure Balance BHA Serum',
    sku: 'FCE-SRM-003',
    slug: 'pure-balance-bha-serum',
    subtitle:
      'A clarifying serum for texture, visible pores, and oilier zones.',
    sizeLabel: '30 ml',
    description:
      'A clarifying treatment serum created for textured skin, visible pores, and oil-prone areas.',
    howToUse:
      'Apply a thin layer in the evening after cleansing. Start a few nights per week, then adjust to your skin comfort level.',
    benefits: [
      'Helps refine the look of uneven texture',
      'Supports a clearer look around congested areas',
      'Designed for targeted oil-prone routines',
    ],
    ingredients: ['Salicylic Acid', 'Niacinamide', 'Green Tea Extract'],
    imageUrl: '/images/products/pure-balance-bha-serum.png',
    galleryImages: buildGallery(
      '/images/products/pure-balance-bha-serum.png',
      'serums',
    ),
    isPublished: true,
    isFlashSale: true,
    price: '830.00',
    compareAtPrice: '990.00',
    stock: 12,
    categorySlug: 'serums',
  },
  {
    name: 'Hydra Petal Water Cream',
    sku: 'FCE-MST-003',
    slug: 'hydra-petal-water-cream',
    subtitle:
      'A fresh gel-cream with featherlight hydration and a dewy finish.',
    sizeLabel: '50 ml',
    description:
      'A fresh gel-cream moisturizer for lightweight hydration and a soft, dewy skin finish.',
    howToUse:
      'Use after serum as your lightweight moisturizer. Layer a second amount onto dry areas if extra comfort is needed.',
    benefits: [
      'Feels cool and lightweight on skin',
      'Leaves a soft dewy finish without heaviness',
      'Great for warm weather or combination skin routines',
    ],
    ingredients: ['Hyaluronic Acid', 'Glycerin', 'Panthenol', 'Lotus Extract'],
    imageUrl: '/images/products/hydra-petal-water-cream.png',
    galleryImages: buildGallery(
      '/images/products/hydra-petal-water-cream.png',
      'moisturizers',
    ),
    isPublished: true,
    isFlashSale: true,
    price: '710.00',
    compareAtPrice: '830.00',
    stock: 26,
    categorySlug: 'moisturizers',
  },
  {
    name: 'Quiet Bloom Amino Cleanser',
    sku: 'FCE-CLN-003',
    slug: 'quiet-bloom-amino-cleanser',
    subtitle: 'A low-foam cleanser for calm, comfortable everyday cleansing.',
    sizeLabel: '120 ml',
    description:
      'A low-foam amino cleanser made for gentle daily cleansing and comfortable skin feel.',
    howToUse:
      'Massage onto damp skin with small circular motions, then rinse. Follow with serum and cream while skin is still lightly damp.',
    benefits: [
      'Cleanses without overwhelming the skin barrier',
      'Low-foam texture feels calm and soft',
      'Suitable for simple morning and night routines',
    ],
    ingredients: ['Amino Acid Surfactants', 'Glycerin', 'Panthenol'],
    imageUrl: '/images/products/quiet-bloom-amino-cleanser.png',
    galleryImages: buildGallery(
      '/images/products/quiet-bloom-amino-cleanser.png',
      'cleansers',
    ),
    isPublished: true,
    price: '450.00',
    stock: 31,
    categorySlug: 'cleansers',
  },
  {
    name: 'Invisible Finish UV Milk',
    sku: 'FCE-SUN-003',
    slug: 'invisible-finish-uv-milk',
    subtitle: 'A fluid UV milk with a soft-matte finish for warm, humid days.',
    sizeLabel: '40 ml',
    description:
      'A fluid sunscreen with a soft-matte finish for combination skin and warm-weather routines.',
    howToUse:
      'Shake before use and apply evenly as the final morning step. Reapply through the day when spending time outdoors.',
    benefits: [
      'Leaves a lighter, soft-matte skin finish',
      'Designed for combination skin and humid climates',
      'Sits well with lightweight daytime routines',
    ],
    ingredients: ['UV Filters', 'Silica', 'Vitamin E', 'Niacinamide'],
    imageUrl: '/images/products/invisible-finish-uv-milk.png',
    galleryImages: buildGallery(
      '/images/products/invisible-finish-uv-milk.png',
      'sun-care',
    ),
    isPublished: false,
    price: '680.00',
    stock: 10,
    categorySlug: 'sun-care',
  },
];

const demoOrders = [
  {
    orderNo: 'FC-20260518-100001',
    status: 'PENDING' as const,
    refundStatus: 'NONE' as const,
    paymentMethod: 'QR_PAYMENT' as const,
    paymentDemoStatus: 'NOT_STARTED' as const,
    paymentSubmittedAt: null,
    paymentCompletedAt: null,
    createdAt: new Date('2026-05-18T02:00:00.000Z'),
    subtotal: '1360.00',
    shippingTotal: '0.00',
    total: '1360.00',
    items: [
      { slug: 'quiet-bloom-amino-cleanser', quantity: 1, unitPrice: '450.00' },
      { slug: 'daily-veil-moisture-cream', quantity: 1, unitPrice: '690.00' },
      { slug: 'airy-glow-tone-up-spf-50', quantity: 1, unitPrice: '220.00' },
    ],
  },
  {
    orderNo: 'FC-20260516-100002',
    status: 'PENDING' as const,
    refundStatus: 'NONE' as const,
    paymentMethod: 'QR_PAYMENT' as const,
    paymentDemoStatus: 'QR_SUBMITTED' as const,
    paymentSubmittedAt: new Date('2026-05-16T05:25:00.000Z'),
    paymentCompletedAt: null,
    createdAt: new Date('2026-05-16T05:10:00.000Z'),
    subtotal: '1540.00',
    shippingTotal: '0.00',
    total: '1540.00',
    items: [
      { slug: 'velvet-shield-spf-50', quantity: 1, unitPrice: '640.00' },
      { slug: 'barrier-bloom-peptide-serum', quantity: 1, unitPrice: '900.00' },
    ],
  },
  {
    orderNo: 'FC-20260514-100003',
    status: 'PAID' as const,
    refundStatus: 'NONE' as const,
    paymentMethod: 'QR_PAYMENT' as const,
    paymentDemoStatus: 'QR_CONFIRMED' as const,
    paymentSubmittedAt: new Date('2026-05-14T09:28:00.000Z'),
    paymentCompletedAt: new Date('2026-05-14T09:32:00.000Z'),
    createdAt: new Date('2026-05-14T09:25:00.000Z'),
    subtotal: '1180.00',
    shippingTotal: '50.00',
    total: '1230.00',
    items: [
      { slug: 'cloud-calm-gel-cleanser', quantity: 1, unitPrice: '490.00' },
      { slug: 'bright-dew-vitamin-serum', quantity: 1, unitPrice: '690.00' },
    ],
  },
  {
    orderNo: 'FC-20260512-100004',
    status: 'PACKING' as const,
    refundStatus: 'PENDING_MANUAL' as const,
    paymentMethod: 'CARD' as const,
    paymentDemoStatus: 'CARD_COMPLETED' as const,
    paymentSubmittedAt: null,
    paymentCompletedAt: new Date('2026-05-12T03:45:00.000Z'),
    createdAt: new Date('2026-05-12T03:30:00.000Z'),
    subtotal: '1590.00',
    shippingTotal: '0.00',
    total: '1590.00',
    items: [
      {
        slug: 'overnight-silk-repair-cream',
        quantity: 1,
        unitPrice: '950.00',
      },
      { slug: 'cloud-calm-gel-cleanser', quantity: 1, unitPrice: '490.00' },
      { slug: 'quiet-bloom-amino-cleanser', quantity: 1, unitPrice: '150.00' },
    ],
  },
  {
    orderNo: 'FC-20260510-100005',
    status: 'CANCELED' as const,
    refundStatus: 'REFUNDED' as const,
    paymentMethod: 'CARD' as const,
    paymentDemoStatus: 'CARD_COMPLETED' as const,
    paymentSubmittedAt: null,
    paymentCompletedAt: new Date('2026-05-10T07:18:00.000Z'),
    createdAt: new Date('2026-05-10T07:00:00.000Z'),
    subtotal: '710.00',
    shippingTotal: '50.00',
    total: '760.00',
    items: [
      { slug: 'hydra-petal-water-cream', quantity: 1, unitPrice: '710.00' },
    ],
  },
] as const;

async function seedCatalog() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
      },
      create: category,
    });
  }

  await prisma.product.deleteMany({
    where: {
      slug: {
        notIn: products.map((product) => product.slug),
      },
    },
  });

  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: {
        slug: product.categorySlug,
      },
    });

    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.name,
        sku: product.sku,
        subtitle: product.subtitle,
        sizeLabel: product.sizeLabel,
        description: product.description,
        howToUse: product.howToUse,
        benefits: [...product.benefits],
        ingredients: [...product.ingredients],
        imageUrl: product.imageUrl,
        galleryImages: [...product.galleryImages],
        isPublished: product.isPublished,
        isFlashSale: product.isFlashSale ?? false,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        stock: product.stock,
        categoryId: category.id,
      },
      create: {
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        subtitle: product.subtitle,
        sizeLabel: product.sizeLabel,
        description: product.description,
        howToUse: product.howToUse,
        benefits: [...product.benefits],
        ingredients: [...product.ingredients],
        imageUrl: product.imageUrl,
        galleryImages: [...product.galleryImages],
        isPublished: product.isPublished,
        isFlashSale: product.isFlashSale ?? false,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        stock: product.stock,
        categoryId: category.id,
      },
    });
  }
}

async function resetDemoUsers() {
  await prisma.authSession.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderCancellationRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.savedPaymentMethod.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
}

async function createDemoUsers() {
  const passwordHash = await bcrypt.hash(
    adminSeed.password,
    PASSWORD_SALT_ROUNDS,
  );

  const admin = await prisma.user.create({
    data: {
      email: adminSeed.email,
      fullName: adminSeed.fullName,
      passwordHash,
      role: adminSeed.role,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: customerSeed.email,
      fullName: customerSeed.fullName,
      passwordHash,
      phone: customerSeed.phone,
      addressLine: customerSeed.addressLine,
      city: customerSeed.city,
      postalCode: customerSeed.postalCode,
      role: customerSeed.role,
    },
  });

  return {
    admin,
    customer,
  };
}

async function createDemoAddresses(customerId: string) {
  await prisma.address.createMany({
    data: [
      {
        userId: customerId,
        label: 'Home',
        recipientFullName: customerSeed.fullName,
        recipientEmail: customerSeed.email,
        recipientPhone: customerSeed.phone,
        addressLine: '88 Sukhumvit Road',
        city: 'Bangkok',
        postalCode: '10110',
        isDefault: true,
      },
      {
        userId: customerId,
        label: 'Office',
        recipientFullName: customerSeed.fullName,
        recipientEmail: customerSeed.email,
        recipientPhone: customerSeed.phone,
        addressLine: '120 Silom Complex',
        city: 'Bangkok',
        postalCode: '10500',
        isDefault: false,
      },
    ],
  });
}

async function createDemoPaymentMethods(customerId: string) {
  await prisma.savedPaymentMethod.createMany({
    data: [
      {
        userId: customerId,
        type: 'CARD',
        label: 'Main Visa',
        isDefault: true,
        cardholderName: customerSeed.fullName,
        cardLast4: '4242',
        cardExpiryMonth: '08',
        cardExpiryYear: '28',
      },
      {
        userId: customerId,
        type: 'QR_PAYMENT',
        label: 'SCB Everyday QR',
        isDefault: false,
        bankName: 'SCB',
      },
    ],
  });
}

async function createDemoOrders(customerId: string) {
  const seededProducts: SeedProductLookup[] = await prisma.product.findMany({
    where: {
      slug: {
        in: demoOrders.flatMap((order) => order.items.map((item) => item.slug)),
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      imageUrl: true,
    },
  });

  const productMap = new Map(
    seededProducts.map((product: SeedProductLookup) => [product.slug, product]),
  );

  const orders = [] as Array<{ id: string; orderNo: string; userId: string }>;

  for (const order of demoOrders) {
    const createdOrder = await prisma.order.create({
      data: {
        orderNo: order.orderNo,
        userId: customerId,
        status: order.status,
        refundStatus: order.refundStatus,
        paymentMethod: order.paymentMethod,
        paymentDemoStatus: order.paymentDemoStatus,
        paymentSubmittedAt: order.paymentSubmittedAt,
        paymentCompletedAt: order.paymentCompletedAt,
        customerFullName: customerSeed.fullName,
        customerEmail: customerSeed.email,
        customerPhone: customerSeed.phone,
        shippingAddressLine: customerSeed.addressLine,
        shippingCity: customerSeed.city,
        shippingPostalCode: customerSeed.postalCode,
        subtotal: order.subtotal,
        shippingTotal: order.shippingTotal,
        total: order.total,
        createdAt: order.createdAt,
        items: {
          create: order.items.map((item) => {
            const product = productMap.get(item.slug);

            if (!product) {
              throw new Error(`Missing seeded product for slug: ${item.slug}`);
            }

            return {
              productId: product.id,
              productName: product.name,
              productSlug: product.slug,
              productImageUrl: product.imageUrl,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            };
          }),
        },
      },
      select: {
        id: true,
        orderNo: true,
        userId: true,
      },
    });

    orders.push(createdOrder);
  }

  return orders;
}

async function createDemoCancellationRequest(
  orders: Array<{ id: string; orderNo: string; userId: string }>,
) {
  const targetOrder = orders.find(
    (order) => order.orderNo === 'FC-20260512-100004',
  );

  if (!targetOrder) {
    return;
  }

  await prisma.orderCancellationRequest.create({
    data: {
      orderId: targetOrder.id,
      requesterUserId: targetOrder.userId,
      reasonCode: 'ORDER_DELAY',
      details: 'Customer asked for an urgent update before shipment leaves.',
      status: 'REQUESTED',
      reviewNote: null,
      reviewedByUserId: null,
      reviewedAt: null,
    },
  });
}

async function createDemoNotifications(
  adminUserId: string,
  customerUserId: string,
) {
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUserId,
        type: 'ORDER_CREATED',
        orderNo: 'FC-20260518-100001',
        titleEn: 'New order received',
        titleTh: 'มีคำสั่งซื้อใหม่เข้ามา',
        bodyEn: 'Facee Customer just placed a new order for today.',
        bodyTh: 'Facee Customer เพิ่งสร้างคำสั่งซื้อใหม่สำหรับวันนี้',
      },
      {
        userId: adminUserId,
        type: 'QR_PAYMENT_SUBMITTED',
        orderNo: 'FC-20260516-100002',
        titleEn: 'QR payment needs review',
        titleTh: 'มีรายการ QR รอตรวจสอบ',
        bodyEn: 'Order FC-20260516-100002 submitted a QR transfer for review.',
        bodyTh: 'ออเดอร์ FC-20260516-100002 ส่งรายการชำระผ่าน QR เข้ามาแล้ว',
      },
      {
        userId: adminUserId,
        type: 'CANCELLATION_REQUESTED',
        orderNo: 'FC-20260512-100004',
        titleEn: 'Cancellation request received',
        titleTh: 'มีคำขอยกเลิกใหม่',
        bodyEn: 'A cancellation review is waiting on the packing order queue.',
        bodyTh: 'มีคำขอยกเลิกรอการตรวจสอบในคิวคำสั่งซื้อที่กำลังแพ็ก',
      },
      {
        userId: customerUserId,
        type: 'ORDER_CREATED',
        orderNo: 'FC-20260518-100001',
        titleEn: 'Order placed successfully',
        titleTh: 'สร้างคำสั่งซื้อเรียบร้อยแล้ว',
        bodyEn:
          'We saved your latest order and are waiting for payment confirmation.',
        bodyTh:
          'ระบบบันทึกคำสั่งซื้อล่าสุดของคุณแล้ว และกำลังรอยืนยันการชำระเงิน',
      },
      {
        userId: customerUserId,
        type: 'QR_PAYMENT_CONFIRMED',
        orderNo: 'FC-20260514-100003',
        titleEn: 'Payment confirmed',
        titleTh: 'ยืนยันการชำระเงินแล้ว',
        bodyEn:
          'Your QR payment for FC-20260514-100003 was confirmed by the team.',
        bodyTh: 'ทีมงานยืนยันการชำระเงินผ่าน QR ของ FC-20260514-100003 แล้ว',
      },
      {
        userId: customerUserId,
        type: 'REFUND_PENDING',
        orderNo: 'FC-20260512-100004',
        titleEn: 'Refund is being processed',
        titleTh: 'กำลังดำเนินการคืนเงิน',
        bodyEn:
          'We are reviewing the refund steps for your latest cancellation.',
        bodyTh: 'เรากำลังตรวจสอบขั้นตอนการคืนเงินสำหรับคำขอยกเลิกล่าสุดของคุณ',
      },
      {
        userId: customerUserId,
        type: 'REFUND_COMPLETED',
        orderNo: 'FC-20260510-100005',
        titleEn: 'Refund completed',
        titleTh: 'คืนเงินสำเร็จแล้ว',
        bodyEn: 'Your refund for FC-20260510-100005 has been completed.',
        bodyTh: 'การคืนเงินสำหรับ FC-20260510-100005 เสร็จสมบูรณ์แล้ว',
      },
    ],
  });
}

async function main() {
  await seedCatalog();
  await resetDemoUsers();
  const { admin, customer } = await createDemoUsers();
  await createDemoAddresses(customer.id);
  await createDemoPaymentMethods(customer.id);
  const orders = await createDemoOrders(customer.id);
  await createDemoCancellationRequest(orders);
  await createDemoNotifications(admin.id, customer.id);

  console.log('Seeded demo credentials:');
  console.log(`- Admin: ${adminSeed.email} / ${adminSeed.password}`);
  console.log(`- Customer: ${customerSeed.email} / ${customerSeed.password}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
