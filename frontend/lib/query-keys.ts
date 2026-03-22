export const queryKeys = {
  products: ['products'] as const,
  productList: (params?: {
    page_size?: number;
    include_inactive?: boolean;
    q?: string;
  }) => [...queryKeys.products, 'list', params ?? {}] as const,
  subdomainPreview: (shopName: string) =>
    ['subdomain-preview', shopName] as const,
  orders: ['orders'] as const,
  dashboardOrders: () => [...queryKeys.orders, 'dashboard'] as const,
  metrics: ['metrics'] as const,
  dashboardMetrics: (dateRange?: string) =>
    [...queryKeys.metrics, 'dashboard', dateRange ?? 'weekly'] as const,
  inventory: ['inventory'] as const,
  lowStockItems: () => [...queryKeys.inventory, 'low-stock'] as const,
};
