// Feature component â€” Dashboard domain

'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Spinner,
  Link,
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';
import type { LowStockItem } from '@/types/orders';

interface LowStockProductsProps {
  items: LowStockItem[];
  isLoading: boolean;
}

export function LowStockProducts({ items, isLoading }: LowStockProductsProps) {
  const t = useTranslations('dashboard.lowStockWidget');

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-20">
          <Spinner color="primary" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card shadow="none" className="bg-content1/80 backdrop-blur-md">
      <CardHeader className="flex gap-3 px-6 py-5 border-b border-divider">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <div className="flex flex-col">
          <p className="text-lg font-semibold">{t('title')}</p>
          <p className="text-small text-default-500">
            {t('belowThreshold', { count: items.length })}
          </p>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <CardBody className="py-8 text-center">
          <p className="text-default-500">{t('allHealthy')}</p>
        </CardBody>
      ) : (
        <CardBody className="gap-0 p-0">
          {items.map((item, index) => (
            <div
              key={`${item.product_id}-${item.variant_id ?? 'base'}-${index}`}
            >
              <div className="flex items-center justify-between gap-4 p-6">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.product_name}</p>
                  {item.variant_label && (
                    <p className="text-small text-default-500">
                      {item.variant_label}
                    </p>
                  )}
                  <p className="text-small text-warning mt-1">
                    {t('stockLine', {
                      stock: item.stock_qty,
                      threshold: item.low_stock_threshold,
                    })}
                  </p>
                </div>

                <Button
                  as={Link}
                  href={`/dashboard/inventory`}
                  color="warning"
                  variant="flat"
                  size="sm"
                  className="flex-shrink-0"
                >
                  {t('restock')}
                </Button>
              </div>
              {index < items.length - 1 && <Divider className="m-0" />}
            </div>
          ))}
        </CardBody>
      )}
    </Card>
  );
}
