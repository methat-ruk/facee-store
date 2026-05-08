import { AdminOrderDetailPage } from '@/features/admin-orders/admin-order-detail-page';

type LocaleAdminOrderDetailPageProps = {
  params: Promise<{
    orderNo: string;
  }>;
};

export default async function LocaleAdminOrderDetailPage({
  params,
}: LocaleAdminOrderDetailPageProps) {
  const { orderNo } = await params;

  return <AdminOrderDetailPage orderNo={orderNo} />;
}
