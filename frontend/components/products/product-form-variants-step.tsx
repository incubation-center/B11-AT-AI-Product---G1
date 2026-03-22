// Feature component — Product Form Variants Step
'use client';

import { Checkbox } from '@heroui/react';
import { AlertCircle } from 'lucide-react';

interface ProductFormVariantsStepProps {
  hasVariants: boolean;
  onHasVariantsChange: (value: boolean) => void;
  isLoading: boolean;
}

export function ProductFormVariantsStep({
  hasVariants,
  onHasVariantsChange,
  isLoading,
}: ProductFormVariantsStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-default-50 rounded-lg p-5 border border-default-200">
        <div className="flex items-start space-x-3">
          <Checkbox
            aria-label="Product has variants"
            isSelected={hasVariants}
            onValueChange={onHasVariantsChange}
            isDisabled={isLoading}
            classNames={{
              wrapper: 'mt-1',
            }}
          />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-default-900">
              Product has variants
            </p>
            <p className="text-xs text-default-500">
              Enable this if your product comes in different colors, sizes, or
              other options.
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      {!hasVariants && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Variants</p>
            <p className="text-xs text-blue-700 mt-1">
              You can manage variants after creating the product. Add colors,
              sizes, or other options to increase sales options.
            </p>
          </div>
        </div>
      )}

      {hasVariants && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Variants Enabled
            </p>
            <p className="text-xs text-amber-700 mt-1">
              You can add multiple variants (colors, sizes, etc.) for this
              product after creation. Each variant can have its own price and
              stock level.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
