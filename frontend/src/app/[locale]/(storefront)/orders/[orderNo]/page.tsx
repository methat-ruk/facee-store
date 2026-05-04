import { OrderDetailPage } from '@/features/orders/order-detail-page';

type LocaleOrderDetailPageProps = {
  params: Promise<{
    orderNo: string;
  }>;
};

export default async function LocaleOrderDetailPage({
  params,
}: LocaleOrderDetailPageProps) {
  const { orderNo } = await params;

  return <OrderDetailPage orderNo={orderNo} />;
}
