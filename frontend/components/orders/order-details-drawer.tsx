'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  ScrollShadow,
  Card,
  CardBody,
  Select,
  SelectItem,
} from '@heroui/react';
import { MapPin, Phone, User, Calendar, CreditCard, ShoppingBag, AlertCircle, SlidersHorizontal } from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus, OrderItem } from '@/types/orders';
import { OrderStatusChip, PaymentStatusChip } from './order-status-chip';
import { useUpdateOrderStatus, useUpdateOrderPayment } from '@/hooks/use-orders-queries';

interface OrderDetailsDrawerProps {
  order: (Order & { items: OrderItem[]; payments: any[] }) | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Delivering', value: 'delivering' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const paymentStatusOptions = [
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Paid', value: 'paid' },
  { label: 'Refunded', value: 'refunded' },
];

export const OrderDetailsDrawer = ({ order, isOpen, onClose }: OrderDetailsDrawerProps) => {
  const updateStatus = useUpdateOrderStatus();
  const updatePayment = useUpdateOrderPayment();

  if (!order) return null;

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ id: order.id, status });
  };

  const handlePaymentChange = (payment_status: string) => {
    updatePayment.mutate({ id: order.id, payment_status });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl" 
      scrollBehavior="inside"
      placement="center"
      classNames={{
        base: "max-w-[800px]",
        header: "border-b border-default-100",
        footer: "border-t border-default-100",
      }}
    >
      <ModalContent>
        {(handleClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-lg">Order {order.order_no}</span>
                <div className="flex gap-2">
                  <OrderStatusChip status={order.status} />
                  <PaymentStatusChip status={order.payment_status} />
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Customer & Order Info */}
                <div className="flex flex-col gap-6">
                  <section>
                    <h3 className="text-sm font-semibold text-default-500 mb-3 flex items-center gap-2">
                      <User size={16} /> Customer Information
                    </h3>
                    <div className="space-y-1">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-default-400 flex items-center gap-2">
                        <Phone size={14} /> {order.customer_phone || 'N/A'}
                      </p>
                      <p className="text-sm text-default-400 flex items-start gap-2 max-w-xs">
                        <MapPin size={14} className="mt-1 flex-shrink-0" /> 
                        <span>{order.address_text}</span>
                      </p>
                      {order.google_map_url && (
                        <a 
                          href={order.google_map_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-xs flex items-center gap-1 hover:underline mt-1"
                        >
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-default-500 mb-3 flex items-center gap-2">
                      <Calendar size={16} /> Order Details
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-default-400">
                        Date: {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-default-400">
                        Method: <span className="uppercase">{order.payment_method.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-default-500 mb-3 flex items-center gap-2">
                      <SlidersHorizontal size={16} /> Management
                    </h3>
                    <div className="flex flex-col gap-3">
                      <Select
                        label="Update Status"
                        size="sm"
                        selectedKeys={[order.status]}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        isLoading={updateStatus.isPending}
                      >
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Update Payment"
                        size="sm"
                        selectedKeys={[order.payment_status]}
                        onChange={(e) => handlePaymentChange(e.target.value)}
                        isLoading={updatePayment.isPending}
                      >
                        {paymentStatusOptions.map((opt) => (
                          <SelectItem key={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </section>
                </div>

                {/* Right Column: Order Items */}
                <div className="flex flex-col gap-6">
                  <section>
                    <h3 className="text-sm font-semibold text-default-500 mb-3 flex items-center gap-2">
                      <ShoppingBag size={16} /> Items ({order.items?.length || 0})
                    </h3>
                    <ScrollShadow className="max-h-[300px]">
                      <div className="flex flex-col gap-3">
                        {order.items?.map((item: OrderItem) => (
                          <Card key={item.id} shadow="none" className="bg-default-50">
                            <CardBody className="py-2 px-3">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="text-sm font-medium leading-tight">
                                    {item.product_name_snapshot}
                                  </p>
                                  {item.variant_snapshot && (
                                    <p className="text-xs text-default-400">
                                      {typeof item.variant_snapshot === 'object' && 'size' in item.variant_snapshot ? (item.variant_snapshot.size as React.ReactNode) : ''} {typeof item.variant_snapshot === 'object' && 'color' in item.variant_snapshot ? (item.variant_snapshot.color as React.ReactNode) : ''}
                                    </p>
                                  )}
                                  <p className="text-xs text-default-400 mt-1">
                                    {item.qty} x ${item.price_snapshot}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold">
                                  ${item.line_total}
                                </p>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </ScrollShadow>
                    
                    <Divider className="my-4" />
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-default-400">Subtotal</span>
                        <span>{order.total} {order.currency}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mt-2">
                        <span>Total</span>
                        <span>{order.total} {order.currency}</span>
                      </div>
                    </div>
                  </section>

                  {order.notes && (
                    <section>
                      <h3 className="text-sm font-semibold text-default-500 mb-2 flex items-center gap-2">
                        <AlertCircle size={16} /> Notes
                      </h3>
                      <p className="text-sm bg-warning-50 text-warning-700 p-3 rounded-medium border border-warning-200">
                        {order.notes}
                      </p>
                    </section>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
