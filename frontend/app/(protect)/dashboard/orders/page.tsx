'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useOrders,
  useOrder,
  useCancelOrder,
} from '@/hooks/use-orders-queries';
import { OrderTable } from '@/components/orders/order-table';
import { OrderDetailsDrawer } from '@/components/orders/order-details-drawer';
import type { Order } from '@/types/orders';

export default function OrdersPage() {
  const t = useTranslations('dashboard.ordersPage');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderSnapshot, setSelectedOrderSnapshot] =
    useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: orders = [], isLoading } = useOrders();
  const { data: orderDetail, isLoading: isOrderDetailLoading } =
    useOrder(selectedOrderId);
  const cancelOrder = useCancelOrder();

  const handleViewOrder = (orderId: string) => {
    const snapshot = orders.find((order) => order.id === orderId) ?? null;
    setSelectedOrderSnapshot(snapshot);
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm(t('confirmCancel'))) {
      await cancelOrder.mutateAsync(orderId);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="text-default-500 mt-1">{t('subtitle')}</p>
      </div>

      <OrderTable
        orders={orders}
        isLoading={isLoading}
        onViewOrder={handleViewOrder}
        onCancelOrder={handleCancelOrder}
      />

      <OrderDetailsDrawer
        order={orderDetail || selectedOrderSnapshot}
        isRefreshing={isOrderDetailLoading}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
