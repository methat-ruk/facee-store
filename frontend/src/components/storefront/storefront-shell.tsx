import { StorefrontFooter } from '@/components/storefront/storefront-footer';
import { StorefrontTopbar } from '@/components/storefront/storefront-topbar';

type StorefrontShellProps = {
  children: React.ReactNode;
};

export function StorefrontShell({ children }: StorefrontShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontTopbar />
      <div className="relative z-0 flex-1">{children}</div>
      <div className="relative z-0">
        <StorefrontFooter />
      </div>
    </div>
  );
}
