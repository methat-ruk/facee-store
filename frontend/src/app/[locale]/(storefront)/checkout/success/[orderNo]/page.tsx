import { CheckoutSuccessPage } from '@/features/orders/order-success-page';

type CheckoutSuccessRouteProps = {
  params: Promise<{
    orderNo: string;
  }>;
};

export default async function CheckoutSuccessRoute({
  params,
}: CheckoutSuccessRouteProps) {
  const { orderNo } = await params;

  return <CheckoutSuccessPage orderNo={orderNo} />;
}
