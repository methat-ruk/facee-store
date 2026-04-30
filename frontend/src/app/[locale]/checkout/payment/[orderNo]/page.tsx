import { CheckoutPaymentPage } from '@/features/checkout/checkout-payment-page';

type CheckoutPaymentRouteProps = {
  params: Promise<{
    orderNo: string;
  }>;
};

export default async function CheckoutPaymentRoute({
  params,
}: CheckoutPaymentRouteProps) {
  const { orderNo } = await params;

  return <CheckoutPaymentPage orderNo={orderNo} />;
}
