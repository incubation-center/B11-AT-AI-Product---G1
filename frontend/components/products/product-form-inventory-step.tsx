// Feature component — Product Form Inventory Step
'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('products.form.inventory');
  return (
    <div className="space-y-6">
      {/* Track Inventory Toggle */}
      <div className="bg-default-50 rounded-lg p-5 border border-default-200">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="track-inventory"
            aria-label={t('enableTrackingAria')}
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
              {t('trackInventory')}
            </label>
            <p className="text-xs text-default-500">
              {t('trackInventoryHelp')}
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
            {t('currentStock')} <span className="text-red-500">*</span>
          </label>
          <Input
            id="stock-qty"
            type="number"
            aria-label={t('currentStockAria')}
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
            {t('lowStockThreshold')} <span className="text-red-500">*</span>
          </label>
          <Input
            id="low-stock-threshold"
            type="number"
            aria-label={t('lowStockThresholdAria')}
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
