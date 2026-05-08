import {
  BoxIcon,
  ChartColumnBigIcon,
  PackageSearchIcon,
  Settings2Icon,
  ShoppingBagIcon,
  UsersIcon,
} from 'lucide-react';

export const adminNavItems = [
  {
    labelKey: 'overview',
    href: '/admin',
    icon: ChartColumnBigIcon,
    disabled: false,
  },
  {
    labelKey: 'orders',
    href: '/admin/orders',
    icon: ShoppingBagIcon,
    disabled: false,
  },
  {
    labelKey: 'products',
    href: '/admin/products',
    icon: BoxIcon,
    disabled: false,
  },
  {
    labelKey: 'customers',
    href: '/admin/customers',
    icon: UsersIcon,
    disabled: false,
  },
  {
    labelKey: 'inventory',
    href: '/admin/inventory',
    icon: PackageSearchIcon,
    disabled: true,
  },
  {
    labelKey: 'settings',
    href: '/admin/settings',
    icon: Settings2Icon,
    disabled: true,
  },
] as const;
