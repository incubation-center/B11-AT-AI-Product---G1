'use client';

import { useState, useEffect } from 'react';
import { Button, Divider } from '@heroui/react';
import {
  AlertTriangle,
  BarChart3,
  ExternalLink,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';

import { DateRangeFilter } from '@/components/dashboard/date-range-filter';
import { MetricCard } from '@/components/dashboard/metric-card';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { OrderDetailModal } from '@/components/dashboard/order-detail-modal';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';

import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useDashboardOrders } from '@/hooks/use-dashboard-orders';
import { useLowStockItems } from '@/hooks/use-low-stock-products';
import { getTenantStatus } from '@/lib/auth';
import type { Order } from '@/types/orders';

export default function DashboardContent() {
  const metrics = useDashboardMetrics();
  const orders = useDashboardOrders();
  const lowStock = useLowStockItems();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreUrl = async () => {
      try {
        const response = await getTenantStatus();
        if (response?.tenant?.storeUrl) {
          setStoreUrl(response.tenant.storeUrl);
        }
      } catch (error) {
        console.error('Failed to fetch tenant status:', error);
      }
    };

    fetchStoreUrl();
  }, []);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  const handleRefreshAll = () => {
    metrics.refetch();
    orders.refetch();
    lowStock.refetch();
  };

  return (
    <main className="flex flex-col gap-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-default-500 mt-1">
            Welcome back! Here&apos;s your store overview.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {storeUrl && (
            <Button
              isIconOnly
              className="flex-1 sm:flex-initial"
              color="primary"
              variant="flat"
              as="a"
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit your store"
            >
              <ExternalLink className="h-5 w-5" />
            </Button>
          )}
          <Button
            isIconOnly
            variant="flat"
            onPress={handleRefreshAll}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Key Metrics</h2>
          <DateRangeFilter
            selectedRange={metrics.dateRange}
            onRangeChange={metrics.setDateRange}
          />
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            label={`Revenue (USD) - ${metrics.dateRange === 'daily' ? 'Today' : metrics.dateRange === 'weekly' ? 'This Week' : 'This Month'}`}
            value={`$${(metrics.metrics?.totalRevenue.usd || 0).toLocaleString(
              'en-US',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}`}
            isLoading={metrics.isLoading}
          />

          <MetricCard
            icon={<ShoppingCart className="h-5 w-5 text-secondary" />}
            label={`Orders - ${metrics.dateRange === 'daily' ? 'Today' : metrics.dateRange === 'weekly' ? 'This Week' : 'This Month'}`}
            value={metrics.metrics?.orderCount || 0}
            isLoading={metrics.isLoading}
          />

          <MetricCard
            icon={<AlertTriangle className="h-5 w-5 text-warning" />}
            label="Low Stock Alert"
            value={metrics.metrics?.lowStockCount || 0}
            isLoading={metrics.isLoading}
          />
        </div>
      </div>

      <Divider />

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Orders - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <RecentOrdersTable
            orders={orders.orders}
            isLoading={orders.isLoading}
            onOrderClick={handleOrderClick}
          />
        </div>

        {/* Low Stock Items - Takes 1 column */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Inventory Status</h2>
          <LowStockProducts
            items={lowStock.items}
            isLoading={lowStock.isLoading}
          />
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isOrderDetailOpen}
        onOpenChange={setIsOrderDetailOpen}
        order={selectedOrder}
      />
    </main>
  );
}
