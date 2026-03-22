'use client';

import React, { useState } from 'react';
import { useOrders, useOrder, useCancelOrder } from '@/hooks/use-orders-queries';
import { OrderTable } from '@/components/orders/order-table';
import { OrderDetailsDrawer } from '@/components/orders/order-details-drawer';
import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react';
import { ShoppingCart } from 'lucide-react';

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { data: orders = [], isLoading } = useOrders();
  const { data: orderDetail, isLoading: isLoadingDetail } = useOrder(selectedOrderId);
  const cancelOrder = useCancelOrder();

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelOrder.mutateAsync(orderId);
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div>
          <h1>Order Manager</h1>
          <p className="text-default-500 mt-1">
            Manage your orders
          </p>
        </div>


          <OrderTable 
            orders={orders} 
            isLoading={isLoading} 
            onViewOrder={handleViewOrder}
            onCancelOrder={handleCancelOrder}
          />


      <OrderDetailsDrawer 
        order={orderDetail || null} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}
