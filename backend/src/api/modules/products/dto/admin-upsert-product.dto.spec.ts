import {
  createAdminProductSchema,
  updateAdminProductSchema,
} from './admin-upsert-product.dto';

describe('updateAdminProductSchema', () => {
  it('does not inject default arrays for omitted fields', () => {
    expect(
      updateAdminProductSchema.parse({
        benefits: ['Updated benefit'],
      }),
    ).toEqual({
      benefits: ['Updated benefit'],
    });
  });

  it('accepts relative media paths for existing product images', () => {
    expect(
      updateAdminProductSchema.parse({
        imageUrl: '/images/products/quiet-bloom-amino-cleanser.png',
        galleryImages: [
          '/images/products/quiet-bloom-amino-cleanser.png',
          'http://localhost:4000/uploads/products/example.png',
        ],
      }),
    ).toEqual({
      imageUrl: '/images/products/quiet-bloom-amino-cleanser.png',
      galleryImages: [
        '/images/products/quiet-bloom-amino-cleanser.png',
        'http://localhost:4000/uploads/products/example.png',
      ],
    });
  });

  it('normalizes sku values to uppercase', () => {
    expect(
      updateAdminProductSchema.parse({
        sku: 'fce-test-001',
      }),
    ).toEqual({
      sku: 'FCE-TEST-001',
    });
  });
});

describe('createAdminProductSchema', () => {
  it('accepts relative media paths for create payloads', () => {
    expect(
      createAdminProductSchema.parse({
        name: 'Quiet Bloom Amino Cleanser',
        sku: 'FCE-TEST-001',
        slug: 'quiet-bloom-amino-cleanser',
        subtitle: null,
        description: 'Soft daily cleanser',
        howToUse: 'Massage and rinse',
        benefits: ['Gentle cleanse'],
        ingredients: ['Panthenol'],
        imageUrl: '/images/products/quiet-bloom-amino-cleanser.png',
        galleryImages: ['/images/products/quiet-bloom-amino-cleanser.png'],
        isPublished: true,
        isFlashSale: false,
        price: 450,
        compareAtPrice: null,
        stock: 10,
        categoryId: 'cmo9n44670000ncvatty9xtm2',
      }),
    ).toMatchObject({
      sku: 'FCE-TEST-001',
      imageUrl: '/images/products/quiet-bloom-amino-cleanser.png',
      galleryImages: ['/images/products/quiet-bloom-amino-cleanser.png'],
    });
  });
});
