'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  useProducts,
  useUpdateProductStock,
  useUpdateVariantStock,
} from '@/hooks/use-products-queries';
import { InventoryTable } from '@/components/inventory/inventory-table';

export default function InventoryPage() {
  const t = useTranslations('dashboard.inventoryPage');
  const { data, isLoading } = useProducts({ page_size: 100 }); // Fetch a larger batch for inventory
  const updateProductStock = useUpdateProductStock();
  const updateVariantStock = useUpdateVariantStock();

  const handleUpdateStock = async (
    id: string,
    type: 'product' | 'variant',
    newStock: number,
  ) => {
    try {
      if (type === 'product') {
        await updateProductStock.mutateAsync({ id, qty: newStock });
      } else {
        await updateVariantStock.mutateAsync({ id, qty: newStock });
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert(t('updateStockFailed'));
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>{t('title')}</h1>
          <p className="text-default-500 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <InventoryTable
          products={data?.data || []}
          isLoading={isLoading}
          onUpdateStock={handleUpdateStock}
        />
      </div>
    </div>
  );
}
