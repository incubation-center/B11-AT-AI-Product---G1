// Feature component — Product Form General Step
'use client';

import { Input, Textarea } from '@heroui/react';

interface ProductFormGeneralStepProps {
  name: string;
  onNameChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  priceUsd: string;
  onPriceUsdChange: (value: string) => void;
  priceKhr: string;
  onPriceKhrChange: (value: string) => void;
  isLoading: boolean;
}

export function ProductFormGeneralStep({
  name,
  onNameChange,
  category,
  onCategoryChange,
  description,
  onDescriptionChange,
  priceUsd,
  onPriceUsdChange,
  priceKhr,
  onPriceKhrChange,
  isLoading,
}: ProductFormGeneralStepProps) {
  return (
    <div className="space-y-6">
      {/* Product Name & Category */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="product-name"
            className="text-sm font-semibold text-default-900"
          >
            Product Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="product-name"
            isClearable
            aria-label="Product name"
            placeholder="e.g. Classic White T-Shirt"
            value={name}
            onValueChange={onNameChange}
            isDisabled={isLoading}
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
            htmlFor="category"
            className="text-sm font-semibold text-default-900"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <Input
            id="category"
            isClearable
            aria-label="Category"
            placeholder="e.g. Apparel"
            value={category}
            onValueChange={onCategoryChange}
            isDisabled={isLoading}
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

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-semibold text-default-900"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          aria-label="Description"
          placeholder="Provide a detailed product description..."
          value={description}
          onValueChange={onDescriptionChange}
          isDisabled={isLoading}
          variant="bordered"
          radius="lg"
          minRows={5}
          classNames={{
            input: 'text-sm resize-none',
            label: 'text-sm',
          }}
        />
      </div>

      {/* Prices */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="price-usd"
            className="text-sm font-semibold text-default-900"
          >
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <Input
            id="price-usd"
            type="number"
            aria-label="Price in USD"
            placeholder="0.00"
            value={priceUsd}
            onValueChange={onPriceUsdChange}
            isDisabled={isLoading}
            variant="bordered"
            radius="lg"
            size="lg"
            startContent={<span className="text-default-400">$</span>}
            classNames={{
              input: 'text-sm',
              label: 'text-sm',
            }}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="price-khr"
            className="text-sm font-semibold text-default-900"
          >
            Price (KHR) <span className="text-red-500">*</span>
          </label>
          <Input
            id="price-khr"
            type="number"
            aria-label="Price in KHR"
            placeholder="0.00"
            value={priceKhr}
            onValueChange={onPriceKhrChange}
            isDisabled={isLoading}
            variant="bordered"
            radius="lg"
            size="lg"
            startContent={<span className="text-default-400">៛</span>}
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
