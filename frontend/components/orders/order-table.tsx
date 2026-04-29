'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Search, MoreVertical, Eye, Trash2 } from 'lucide-react';
import type { Order } from '@/types/orders';
import { OrderStatusChip, PaymentStatusChip } from './order-status-chip';

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  onViewOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const OrderTable = ({
  orders,
  isLoading,
  onViewOrder,
  onCancelOrder,
}: OrderTableProps) => {
  const t = useTranslations('orders');
  const [filterValue, setFilterValue] = useState('');
  const columns = [
    { name: t('orderNo'), uid: 'order_no' },
    { name: t('customer'), uid: 'customer_name' },
    { name: t('date'), uid: 'created_at' },
    { name: t('total'), uid: 'total' },
    { name: t('status'), uid: 'status' },
    { name: t('payment'), uid: 'payment_status' },
    { name: t('actions'), uid: 'actions' },
  ];

  const filteredItems = useMemo(() => {
    let filtered = [...orders];
    if (filterValue) {
      filtered = filtered.filter(
        (order) =>
          order.order_no.toLowerCase().includes(filterValue.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }
    return filtered;
  }, [orders, filterValue]);

  const renderCell = React.useCallback(
    (order: Order, columnKey: React.Key) => {
      const cellValue = order[columnKey as keyof Order];

      switch (columnKey) {
        case 'order_no':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">{order.order_no}</p>
            </div>
          );
        case 'customer_name':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">
                {order.customer_name}
              </p>
              <p className="text-bold text-tiny capitalize text-default-400">
                {order.customer_phone || t('noPhone')}
              </p>
            </div>
          );
        case 'created_at':
          return (
            <p className="text-sm">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          );
        case 'total':
          return (
            <p className="text-sm font-semibold">
              {order.total} {order.currency}
            </p>
          );
        case 'status':
          return <OrderStatusChip status={order.status} />;
        case 'payment_status':
          return <PaymentStatusChip status={order.payment_status} />;
        case 'actions':
          return (
            <div
              className="relative flex justify-end items-center gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <MoreVertical className="text-default-300" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label={t('actionsAria')}>
                  <DropdownItem
                    key="view"
                    startContent={<Eye size={16} />}
                    onPress={() => onViewOrder(order.id)}
                  >
                    {t('viewDetails')}
                  </DropdownItem>
                  <DropdownItem
                    key="cancel"
                    startContent={<Trash2 size={16} />}
                    color="danger"
                    className="text-danger"
                    onPress={() => onCancelOrder(order.id)}
                    isDisabled={
                      order.status === 'cancelled' ||
                      order.status === 'completed'
                    }
                  >
                    {t('cancelOrder')}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return cellValue as React.ReactNode;
      }
    },
    [onViewOrder, onCancelOrder, t],
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder={t('searchPlaceholder')}
            startContent={<Search size={18} />}
            value={filterValue}
            onClear={() => setFilterValue('')}
            onValueChange={setFilterValue}
          />
        </div>
      </div>
    );
  }, [filterValue, t]);

  return (
    <Table
      aria-label={t('tableAria')}
      topContent={topContent}
      topContentPlacement="outside"
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === 'actions' ? 'center' : 'start'}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={filteredItems}
        isLoading={isLoading}
        emptyContent={t('empty')}
      >
        {(item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer"
            onClick={() => onViewOrder(item.id)}
          >
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
