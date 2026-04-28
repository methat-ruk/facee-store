import { StorefrontFooter } from '@/components/storefront/storefront-footer';
import { StorefrontTopbar } from '@/components/storefront/storefront-topbar';

type StorefrontShellProps = {
  children: React.ReactNode;
};

export function StorefrontShell({ children }: StorefrontShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <StorefrontTopbar />
      <div className="relative z-0 flex min-h-0 flex-1 flex-col [&>main]:flex-1">
        {children}
      </div>
      <div className="relative z-0 mt-auto">
        <StorefrontFooter />
      </div>
    </div>
  );
}
