// Feature component — Dashboard domain

"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import type { Order } from "@/types/orders";

const statusColorMap: Record<string, "success" | "warning" | "danger" | "default"> = {
  pending: "warning",
  confirmed: "default",
  delivering: "default",
  completed: "success",
  cancelled: "danger",
};

const paymentStatusColorMap: Record<string, "success" | "warning" | "danger" | "default"> = {
  unpaid: "danger",
  paid: "success",
  refunded: "default",
};

interface OrderDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderDetailModal({
  isOpen,
  onOpenChange,
  order,
}: OrderDetailModalProps) {
  if (!order) return null;

  const totalAmount = order.currency === "USD" 
    ? `$${parseFloat(order.total).toFixed(2)}`
    : `₱${parseFloat(order.total).toLocaleString()}`;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {order.order_no}
            </ModalHeader>
            <Divider />
            <ModalBody className="gap-6">
              {/* Order Status & Payment */}
              <div className="flex gap-4">
                <div>
                  <p className="text-small text-default-500">Order Status</p>
                  <Chip
                    color={statusColorMap[order.status] || "default"}
                    variant="flat"
                    className="capitalize mt-1"
                  >
                    {order.status}
                  </Chip>
                </div>
                <div>
                  <p className="text-small text-default-500">Payment Status</p>
                  <Chip
                    color={paymentStatusColorMap[order.payment_status] || "default"}
                    variant="flat"
                    className="capitalize mt-1"
                  >
                    {order.payment_status}
                  </Chip>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-small text-default-500">Customer Name</p>
                  <p className="font-semibold">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-small text-default-500">Phone</p>
                  <p className="font-semibold">{order.customer_phone || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-small text-default-500">Address</p>
                  <p className="font-semibold">{order.address_text}</p>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <p className="text-small font-semibold text-default-700 mb-3">Items</p>
                    <Table hideHeader aria-label="Order items">
                      <TableHeader>
                        <TableColumn>Product</TableColumn>
                        <TableColumn className="text-right">Qty</TableColumn>
                        <TableColumn className="text-right">Price</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <p className="font-semibold">{item.product_name_snapshot}</p>
                                {item.variant_snapshot && (
                                  <p className="text-small text-default-500">
                                    {JSON.stringify(item.variant_snapshot).slice(0, 50)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right">{item.price_snapshot}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Total */}
              <Divider />
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-small text-default-500">Total Amount ({order.currency})</p>
                  <p className="text-xl font-bold text-primary">{totalAmount}</p>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <>
                  <Divider />
                  <div>
                    <p className="text-small text-default-500 mb-1">Notes</p>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                </>
              )}
            </ModalBody>
            <Divider />
            <ModalFooter>
              <Button color="default" variant="bordered" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
