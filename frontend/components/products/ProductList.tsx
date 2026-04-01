// Feature component — Product List Table
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
import { Edit, MoreVertical } from 'lucide-react';
import React from 'react';
import type { Product } from '@/lib/products';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onSync: (id: string) => void;
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
  isLoading,
  page = 1,
  totalPages = 1,
  onPageChange,
}: ProductListProps) {
  const columns = [
    { key: 'product', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  const renderCell = (product: Product, columnKey: string | number) => {
    const key = String(columnKey);
    switch (key) {
      case 'product':
        return (
          <User
            avatarProps={{
              src: product.image_urls?.[0] || undefined,
              fallback: '📦',
              size: 'md',
            }}
            description={product.description?.slice(0, 50)}
            name={product.name}
          />
        );

      case 'category':
        return (
          <p className="text-sm text-default-600">{product.category || '—'}</p>
        );

      case 'pricing':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">${product.base_price_usd}</p>
            <p className="text-xs text-default-500">
              {product.base_price_khr}៛
            </p>
          </div>
        );

      case 'stock':
        const isLowStock =
          product.track_inventory &&
          product.stock_qty <= product.low_stock_threshold;
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{product.stock_qty}</p>
            {isLowStock && (
              <Chip
                size="sm"
                color="warning"
                variant="flat"
                className="text-xs"
              >
                Low Stock
              </Chip>
            )}
          </div>
        );

      case 'status':
        return product.is_active ? (
          <Chip size="sm" variant="flat" color="success" className="capitalize">
            Active
          </Chip>
        ) : (
          <Chip size="sm" variant="flat" color="default" className="capitalize">
            Inactive
          </Chip>
        );

      case 'actions':
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit product">
              <button
                onClick={() => onEdit(product)}
                aria-label={`Edit ${product.name}`}
                className="text-lg text-default-400 cursor-pointer active:opacity-50 hover:text-primary transition-colors"
              >
                <Edit size={18} />
              </button>
            </Tooltip>

            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label={`More options for ${product.name}`}
                >
                  <MoreVertical size={18} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(key) => {
                  if (key === 'delete') {
                    if (confirm('Deactivate this product?')) {
                      onDelete(product.id);
                    }
                  } else if (key === 'restore') {
                    onRestore(product.id);
                  } else if (key === 'sync') {
                    onSync(product.id);
                  }
                }}
              >
                <DropdownItem
                  key="sync"
                  description="Sync with AI Assistant indexing"
                >
                  Sync to AI
                </DropdownItem>
                {product.is_active ? (
                  <DropdownItem
                    key="delete"
                    color="danger"
                    description="Mark as inactive"
                  >
                    Deactivate
                  </DropdownItem>
                ) : (
                  <DropdownItem
                    key="restore"
                    color="success"
                    description="Mark as active"
                  >
                    Restore
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
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-default-900">
            No products yet
          </h3>
          <p className="text-sm text-default-500 mt-1">
            Create your first product to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <Table 
      aria-label="Products table"
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
