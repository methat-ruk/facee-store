import { AdminProductEditorPage } from '@/features/admin-products/admin-product-editor-page';

type AdminProductDetailRouteProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function AdminProductDetailRoute({
  params,
}: AdminProductDetailRouteProps) {
  const { productId } = await params;

  return <AdminProductEditorPage productId={productId} />;
}
