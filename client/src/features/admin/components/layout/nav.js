import {
  BarChart3,
  Boxes,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  TicketPercent,
  Users,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/brands', label: 'Brands', icon: Tag },
      { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareText },
      { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
    ],
  },
  {
    label: 'Store',
    items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const EXTRA_TITLES = [
  [/^\/admin\/products\/new$/, 'New product', '/admin/products'],
  [/^\/admin\/products\/[^/]+\/edit$/, 'Edit product', '/admin/products'],
  [/^\/admin\/orders\/[^/]+$/, 'Order details', '/admin/orders'],
];

/** Breadcrumb trail for the top bar: [{ label, to? }] */
export function crumbsFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/admin';
  for (const [re, label, parent] of EXTRA_TITLES) {
    if (re.test(path)) {
      const parentItem = NAV_ITEMS.find((i) => i.to === parent);
      return [{ label: parentItem.label, to: parent }, { label }];
    }
  }
  const item = NAV_ITEMS.find((i) => i.to === path);
  return [{ label: item?.label ?? 'Admin' }];
}
