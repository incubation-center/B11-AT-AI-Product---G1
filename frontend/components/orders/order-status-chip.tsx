'use client';

import React from 'react';
import { Chip } from '@heroui/react';
import type { OrderStatus, PaymentStatus } from '@/types/orders';

interface OrderStatusChipProps {
  status: OrderStatus;
}

const statusColorMap: Record<OrderStatus, "default" | "primary" | "secondary" | "success" | "warning" | "danger" | undefined> = {
  pending: "warning",
  confirmed: "primary",
  delivering: "secondary",
  completed: "success",
  cancelled: "danger",
};

export const OrderStatusChip = ({ status }: OrderStatusChipProps) => {
  return (
    <Chip 
      color={statusColorMap[status]} 
      variant="flat" 
      size="sm" 
      className="capitalize"
    >
      {status}
    </Chip>
  );
};

interface PaymentStatusChipProps {
  status: PaymentStatus;
}

const paymentStatusColorMap: Record<PaymentStatus, "default" | "primary" | "secondary" | "success" | "warning" | "danger" | undefined> = {
  unpaid: "danger",
  paid: "success",
  refunded: "warning",
};

export const PaymentStatusChip = ({ status }: PaymentStatusChipProps) => {
  return (
    <Chip 
      color={paymentStatusColorMap[status]} 
      variant="dot" 
      size="sm" 
      className="capitalize"
    >
      {status}
    </Chip>
  );
};
