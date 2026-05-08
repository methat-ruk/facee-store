import { AdminCustomerDetailPage } from '@/features/admin-customers/admin-customer-detail-page';

type AdminCustomerDetailRouteProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function AdminCustomerDetailRoute({
  params,
}: AdminCustomerDetailRouteProps) {
  const { customerId } = await params;

  return <AdminCustomerDetailPage customerId={customerId} />;
}
