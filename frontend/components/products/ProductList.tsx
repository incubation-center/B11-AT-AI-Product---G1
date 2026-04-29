'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Tooltip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
} from '@heroui/react';
import { Edit, MoreVertical, Layers } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/products';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onSync: (id: string) => void;
  onManageVariants: (product: Product) => void;
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function ProductList({
  products,
  onEdit,
  onDelete,
  onRestore,
  onSync,
  onManageVariants,
  isLoading,
  page = 1,
  totalPages = 1,
  onPageChange,
}: ProductListProps) {
  const t = useTranslations('products');

  const columns = [
    { key: 'product', label: t('table.product') },
    { key: 'category', label: t('table.category') },
    { key: 'pricing', label: t('table.pricing') },
    { key: 'stock', label: t('table.stock') },
    { key: 'variants', label: t('table.variants') },
    { key: 'status', label: t('table.status') },
    { key: 'actions', label: t('table.actions') },
  ];

  const renderCell = (product: Product, columnKey: string | number) => {
    const key = String(columnKey);
    switch (key) {
      case 'product':
        return (
          <User
            avatarProps={{
              src: product.image_urls?.[0] || undefined,
              fallback: 'P',
              size: 'md',
            }}
            description={product.description?.slice(0, 50)}
            name={product.name}
          />
        );

      case 'category':
        return (
          <p className="text-sm text-default-600">{product.category || '-'}</p>
        );

      case 'pricing':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">${product.base_price_usd}</p>
            <p className="text-xs text-default-500">
              {product.base_price_khr} KHR
            </p>
          </div>
        );

      case 'stock': {
        const isLowStock =
          product.track_inventory &&
          !product.has_variants &&
          product.stock_qty <= product.low_stock_threshold;
        return (
          <div className="space-y-1">
            {product.has_variants ? (
              <p className="text-xs text-default-400 italic">
                {t('perVariant')}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium">{product.stock_qty}</p>
                {isLowStock && (
                  <Chip
                    size="sm"
                    color="warning"
                    variant="flat"
                    className="text-xs"
                  >
                    {t('lowStock')}
                  </Chip>
                )}
              </>
            )}
          </div>
        );
      }

      case 'variants': {
        if (!product.has_variants) {
          return <p className="text-xs text-default-400">-</p>;
        }
        const count = product.variants?.length ?? 0;
        return (
          <Tooltip content={t('actions.openVariantManager')}>
            <button
              onClick={() => onManageVariants(product)}
              aria-label={`${t('actions.manageVariantsFor')} ${product.name}`}
              className="group"
            >
              <Chip
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<Layers size={11} className="ml-1" />}
                className="cursor-pointer group-hover:bg-secondary-200 transition-colors"
              >
                {count} {count === 1 ? t('variant') : t('variants')}
              </Chip>
            </button>
          </Tooltip>
        );
      }

      case 'status':
        return product.is_active ? (
          <Chip size="sm" variant="flat" color="success" className="capitalize">
            {t('active')}
          </Chip>
        ) : (
          <Chip size="sm" variant="flat" color="default" className="capitalize">
            {t('inactive')}
          </Chip>
        );

      case 'actions':
        return (
          <div className="relative flex items-center gap-1">
            <Tooltip content={t('actions.editProductDetails')}>
              <button
                onClick={() => onEdit(product)}
                aria-label={`${t('actions.edit')} ${product.name}`}
                className="text-lg text-default-400 cursor-pointer active:opacity-50 hover:text-primary transition-colors p-1 rounded"
              >
                <Edit size={16} />
              </button>
            </Tooltip>

            {product.has_variants && (
              <Tooltip content={t('actions.manageVariants')}>
                <button
                  onClick={() => onManageVariants(product)}
                  aria-label={`${t('actions.manageVariantsFor')} ${product.name}`}
                  className="text-lg text-default-400 cursor-pointer active:opacity-50 hover:text-secondary transition-colors p-1 rounded"
                >
                  <Layers size={16} />
                </button>
              </Tooltip>
            )}

            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label={`${t('actions.moreOptionsFor')} ${product.name}`}
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(actionKey) => {
                  if (actionKey === 'delete') {
                    if (confirm(t('actions.confirmDeactivate'))) {
                      onDelete(product.id);
                    }
                  } else if (actionKey === 'restore') {
                    onRestore(product.id);
                  } else if (actionKey === 'sync') {
                    onSync(product.id);
                  } else if (actionKey === 'variants') {
                    onManageVariants(product);
                  }
                }}
              >
                {product.has_variants ? (
                  <DropdownItem
                    key="variants"
                    description={t('actions.variantsDesc')}
                    startContent={<Layers size={14} />}
                  >
                    {t('actions.manageVariants')}
                  </DropdownItem>
                ) : (
                  (null as unknown as React.ReactElement)
                )}
                <DropdownItem key="sync" description={t('actions.syncDesc')}>
                  {t('actions.syncToAi')}
                </DropdownItem>
                {product.is_active ? (
                  <DropdownItem
                    key="delete"
                    color="danger"
                    description={t('actions.markInactive')}
                  >
                    {t('actions.deactivate')}
                  </DropdownItem>
                ) : (
                  <DropdownItem
                    key="restore"
                    color="success"
                    description={t('actions.markActive')}
                  >
                    {t('actions.restore')}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );

      default:
        return null;
    }
  };

  const bottomContent = React.useMemo(() => {
    if (totalPages <= 1 && products.length === 0) return null;

    return (
      <div className="py-2 px-2 flex justify-end items-center">
        <Pagination
          showControls
          showShadow
          color="primary"
          variant="flat"
          page={page}
          total={totalPages}
          onChange={onPageChange}
        />
      </div>
    );
  }, [page, totalPages, onPageChange, products.length]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">P</div>
          <h3 className="text-lg font-semibold text-default-900">
            {t('empty.title')}
          </h3>
          <p className="text-sm text-default-500 mt-1">{t('empty.subtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <Table
      aria-label={t('tableAria')}
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
    >
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={products} isLoading={isLoading}>
        {(product) => (
          <TableRow key={product.id}>
            {(columnKey) => (
              <TableCell>{renderCell(product, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
