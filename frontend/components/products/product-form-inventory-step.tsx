// Feature component — Product Form Inventory Step
'use client';

import { Input, Checkbox } from '@heroui/react';

interface ProductFormInventoryStepProps {
  trackInventory: boolean;
  onTrackInventoryChange: (value: boolean) => void;
  stock: string;
  onStockChange: (value: string) => void;
  lowStock: string;
  onLowStockChange: (value: string) => void;
  isLoading: boolean;
}

export function ProductFormInventoryStep({
  trackInventory,
  onTrackInventoryChange,
  stock,
  onStockChange,
  lowStock,
  onLowStockChange,
  isLoading,
}: ProductFormInventoryStepProps) {
  return (
    <div className="space-y-6">
      {/* Track Inventory Toggle */}
      <div className="bg-default-50 rounded-lg p-5 border border-default-200">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="track-inventory"
            aria-label="Enable inventory tracking"
            isSelected={trackInventory}
            onValueChange={onTrackInventoryChange}
            isDisabled={isLoading}
            classNames={{
              wrapper: 'mt-1',
            }}
          />
          <div className="space-y-1 flex-1">
            <label
              htmlFor="track-inventory"
              className="text-sm font-semibold text-default-900 cursor-pointer"
            >
              Track Inventory
            </label>
            <p className="text-xs text-default-500">
              Enable inventory tracking to monitor stock levels and receive
              low-stock alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Stock Fields */}
      <div
        className={`grid gap-6 md:grid-cols-2 transition-opacity duration-200 ${
          !trackInventory ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <div className="space-y-2">
          <label
            htmlFor="stock-qty"
            className="text-sm font-semibold text-default-900"
          >
            Current Stock <span className="text-red-500">*</span>
          </label>
          <Input
            id="stock-qty"
            type="number"
            aria-label="Current Stock"
            min="0"
            placeholder="0"
            value={stock}
            onValueChange={onStockChange}
            isDisabled={isLoading || !trackInventory}
            variant="bordered"
            radius="lg"
            size="lg"
            classNames={{
              input: 'text-sm',
              label: 'text-sm',
            }}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="low-stock-threshold"
            className="text-sm font-semibold text-default-900"
          >
            Low Stock Threshold <span className="text-red-500">*</span>
          </label>
          <Input
            id="low-stock-threshold"
            type="number"
            aria-label="Low Stock Threshold"
            min="0"
            placeholder="5"
            value={lowStock}
            onValueChange={onLowStockChange}
            isDisabled={isLoading || !trackInventory}
            variant="bordered"
            radius="lg"
            size="lg"
            classNames={{
              input: 'text-sm',
              label: 'text-sm',
            }}
          />
        </div>
      </div>
    </div>
  );
}
