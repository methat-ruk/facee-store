import { StorefrontShell } from '@/components/storefront/storefront-shell';

type StorefrontLayoutProps = {
  children: React.ReactNode;
};

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
