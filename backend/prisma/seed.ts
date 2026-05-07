import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.cjs';

const databaseUrl = process.env.DATABASE_URL;
const PASSWORD_SALT_ROUNDS = 12;
const adminSeed = {
  id: 'admin_facee_seed',
  email: 'admin@facee.local',
  fullName: 'Facee Admin',
  password: 'FaceeAdmin123!',
  role: 'ADMIN' as const,
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

async function main() {
  const adminPasswordHash = await bcrypt.hash(
    adminSeed.password,
    PASSWORD_SALT_ROUNDS,
  );

  await prisma.user.upsert({
    where: {
      email: adminSeed.email,
    },
    update: {
      fullName: adminSeed.fullName,
      passwordHash: adminPasswordHash,
      role: adminSeed.role,
    },
    create: {
      id: adminSeed.id,
      email: adminSeed.email,
      fullName: adminSeed.fullName,
      passwordHash: adminPasswordHash,
      role: adminSeed.role,
    },
  });

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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
