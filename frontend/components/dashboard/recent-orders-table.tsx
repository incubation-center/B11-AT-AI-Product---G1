// Feature component — Dashboard domain

'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from '@heroui/react';
import type { Order } from '@/types/orders';

const statusColorMap: Record<
  string,
  'success' | 'warning' | 'danger' | 'default'
> = {
  pending: 'warning',
  confirmed: 'default',
  delivering: 'default',
  completed: 'success',
  cancelled: 'danger',
};

const paymentStatusColorMap: Record<
  string,
  'success' | 'warning' | 'danger' | 'default'
> = {
  unpaid: 'danger',
  paid: 'success',
  refunded: 'default',
};

interface RecentOrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onOrderClick: (order: Order) => void;
}

export function RecentOrdersTable({
  orders,
  isLoading,
  onOrderClick,
}: RecentOrdersTableProps) {
  return (
    <Table aria-label="Recent orders table">
      <TableHeader>
        <TableColumn>Order #</TableColumn>
        <TableColumn>Customer</TableColumn>
        <TableColumn>Amount</TableColumn>
        <TableColumn>Status</TableColumn>
        <TableColumn>Payment</TableColumn>
        <TableColumn>Date</TableColumn>
      </TableHeader>
      <TableBody
        emptyContent={isLoading ? 'Loading...' : 'No orders found'}
        isLoading={isLoading}
        loadingContent={<Spinner color="primary" />}
      >
        {orders.slice(0, 10).map((order) => (
          <TableRow
            key={order.id}
            onClick={() => onOrderClick(order)}
            className="hover:bg-content2 cursor-pointer transition-colors"
          >
            <TableCell className="font-mono text-small font-semibold">
              {order.order_no}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-small text-default-500">
                  {order.customer_phone || 'N/A'}
                </p>
              </div>
            </TableCell>
            <TableCell className="font-semibold">
              {order.currency === 'USD'
                ? `$${parseFloat(order.total).toFixed(2)}`
                : `₱${parseFloat(order.total).toLocaleString()}`}
            </TableCell>
            <TableCell>
              <Chip
                color={statusColorMap[order.status] || 'default'}
                variant="flat"
                size="sm"
                className="capitalize"
              >
                {order.status}
              </Chip>
            </TableCell>
            <TableCell>
              <Chip
                color={paymentStatusColorMap[order.payment_status] || 'default'}
                variant="flat"
                size="sm"
                className="capitalize"
              >
                {order.payment_status}
              </Chip>
            </TableCell>
            <TableCell className="text-small text-default-500">
              {new Date(order.created_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
