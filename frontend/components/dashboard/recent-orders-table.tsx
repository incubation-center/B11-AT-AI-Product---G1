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
  Card,
  CardBody,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('dashboard.recentOrders');

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl bg-content1">
        <Spinner color="primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-content1 p-6 text-center text-default-500">
        {t('empty')}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {orders.slice(0, 10).map((order) => (
          <Card
            key={order.id}
            isPressable
            shadow="none"
            className="w-full border border-default-200 bg-content1 text-left"
            onPress={() => onOrderClick(order)}
          >
            <CardBody className="gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-small font-semibold">
                    {order.order_no}
                  </p>
                  <p className="truncate text-sm font-semibold">
                    {order.customer_name}
                  </p>
                  <p className="text-small text-default-500">
                    {order.customer_phone || t('naPhone')}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {order.currency === 'USD'
                    ? `$${parseFloat(order.total).toFixed(2)}`
                    : `₱${parseFloat(order.total).toLocaleString()}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Chip
                    color={statusColorMap[order.status] || 'default'}
                    variant="flat"
                    size="sm"
                    className="capitalize"
                  >
                    {order.status}
                  </Chip>
                  <Chip
                    color={
                      paymentStatusColorMap[order.payment_status] || 'default'
                    }
                    variant="flat"
                    size="sm"
                    className="capitalize"
                  >
                    {order.payment_status}
                  </Chip>
                </div>
                <span className="text-small text-default-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="hidden w-full overflow-x-auto md:block">
        <div className="min-w-[760px]">
          <Table aria-label={t('tableAria')}>
            <TableHeader>
              <TableColumn>{t('orderNo')}</TableColumn>
              <TableColumn>{t('customer')}</TableColumn>
              <TableColumn>{t('amount')}</TableColumn>
              <TableColumn>{t('status')}</TableColumn>
              <TableColumn>{t('payment')}</TableColumn>
              <TableColumn>{t('date')}</TableColumn>
            </TableHeader>
            <TableBody>
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
                        {order.customer_phone || t('naPhone')}
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
                      color={
                        paymentStatusColorMap[order.payment_status] || 'default'
                      }
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
        </div>
      </div>
    </>
  );
}
