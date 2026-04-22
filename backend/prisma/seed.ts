import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.cjs';

const databaseUrl = process.env.DATABASE_URL;

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

const products = [
  {
    name: 'Cloud Calm Gel Cleanser',
    slug: 'cloud-calm-gel-cleanser',
    description:
      'A gentle gel cleanser that removes excess oil without leaving the skin feeling stripped or tight.',
    imageUrl: '/images/products/cloud-calm-gel-cleanser.png',
    isPublished: true,
    price: '490.00',
    stock: 28,
    categorySlug: 'cleansers',
  },
  {
    name: 'Soft Reset Cream Cleanser',
    slug: 'soft-reset-cream-cleanser',
    description:
      'A creamy face wash for dry and sensitive skin with a comfort-first texture for morning and evening routines.',
    imageUrl: '/images/products/soft-reset-cream-cleanser.png',
    isPublished: true,
    price: '520.00',
    stock: 14,
    categorySlug: 'cleansers',
  },
  {
    name: 'Bright Dew Vitamin Serum',
    slug: 'bright-dew-vitamin-serum',
    description:
      'A lightweight brightening serum made for uneven tone, dullness, and everyday glow support.',
    imageUrl: '/images/products/bright-dew-vitamin-serum.png',
    isPublished: true,
    price: '790.00',
    stock: 11,
    categorySlug: 'serums',
  },
  {
    name: 'Barrier Bloom Peptide Serum',
    slug: 'barrier-bloom-peptide-serum',
    description:
      'A peptide-focused serum that helps the skin barrier feel smoother, calmer, and more resilient over time.',
    imageUrl: '/images/products/barrier-bloom-peptide-serum.png',
    isPublished: true,
    price: '890.00',
    stock: 8,
    categorySlug: 'serums',
  },
  {
    name: 'Daily Veil Moisture Cream',
    slug: 'daily-veil-moisture-cream',
    description:
      'A daily moisturizer for balanced hydration with a soft finish that layers well under makeup.',
    imageUrl: '/images/products/daily-veil-moisture-cream.png',
    isPublished: true,
    price: '690.00',
    stock: 19,
    categorySlug: 'moisturizers',
  },
  {
    name: 'Overnight Silk Repair Cream',
    slug: 'overnight-silk-repair-cream',
    description:
      'A richer evening cream designed to support recovery, comfort, and long-lasting overnight moisture.',
    imageUrl: '/images/products/overnight-silk-repair-cream.png',
    isPublished: true,
    price: '950.00',
    stock: 6,
    categorySlug: 'moisturizers',
  },
  {
    name: 'Velvet Shield SPF 50',
    slug: 'velvet-shield-spf-50',
    description:
      'A broad-spectrum sunscreen with a lightweight feel and a no-white-cast finish for everyday wear.',
    imageUrl: '/images/products/velvet-shield-spf-50.png',
    isPublished: true,
    price: '640.00',
    stock: 23,
    categorySlug: 'sun-care',
  },
  {
    name: 'Airy Glow Tone-Up SPF 50',
    slug: 'airy-glow-tone-up-spf-50',
    description:
      'A subtle tone-up sunscreen that helps brighten the complexion while protecting against daily UV exposure.',
    imageUrl: '/images/products/airy-glow-tone-up-spf-50.png',
    isPublished: true,
    price: '720.00',
    stock: 17,
    categorySlug: 'sun-care',
  },
  {
    name: 'Pure Balance BHA Serum',
    slug: 'pure-balance-bha-serum',
    description:
      'A clarifying treatment serum created for textured skin, visible pores, and oil-prone areas.',
    imageUrl: '/images/products/pure-balance-bha-serum.png',
    isPublished: true,
    price: '830.00',
    stock: 12,
    categorySlug: 'serums',
  },
  {
    name: 'Hydra Petal Water Cream',
    slug: 'hydra-petal-water-cream',
    description:
      'A fresh gel-cream moisturizer for lightweight hydration and a soft, dewy skin finish.',
    imageUrl: '/images/products/hydra-petal-water-cream.png',
    isPublished: true,
    price: '710.00',
    stock: 26,
    categorySlug: 'moisturizers',
  },
  {
    name: 'Quiet Bloom Amino Cleanser',
    slug: 'quiet-bloom-amino-cleanser',
    description:
      'A low-foam amino cleanser made for gentle daily cleansing and comfortable skin feel.',
    imageUrl: '/images/products/quiet-bloom-amino-cleanser.png',
    isPublished: true,
    price: '450.00',
    stock: 31,
    categorySlug: 'cleansers',
  },
  {
    name: 'Invisible Finish UV Milk',
    slug: 'invisible-finish-uv-milk',
    description:
      'A fluid sunscreen with a soft-matte finish for combination skin and warm-weather routines.',
    imageUrl: '/images/products/invisible-finish-uv-milk.png',
    isPublished: false,
    price: '680.00',
    stock: 10,
    categorySlug: 'sun-care',
  },
] as const;

async function main() {
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
        description: product.description,
        imageUrl: product.imageUrl,
        isPublished: product.isPublished,
        price: product.price,
        stock: product.stock,
        categoryId: category.id,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        imageUrl: product.imageUrl,
        isPublished: product.isPublished,
        price: product.price,
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
