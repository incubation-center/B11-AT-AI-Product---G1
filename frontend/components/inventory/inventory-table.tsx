'use client';

import React, { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Selection,
  SortDescriptor,
} from '@heroui/react';
import { Product } from '@/lib/products';
import { cn } from '@/lib/utils';

// Sub-components
import { InventoryStatusChip } from './inventory-status-chip';
import { InventoryItemCell } from './inventory-item-cell';
import { InventoryActions } from './inventory-actions';
import { InventoryTableHeader } from './inventory-table-header';

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
  type: 'product' | 'variant';
  productId?: string;
  image?: string;
  isActive: boolean;
};

interface InventoryTableProps {
  products: Product[];
  isLoading: boolean;
  onUpdateStock: (id: string, type: 'product' | 'variant', newStock: number) => Promise<void>;
}

export function InventoryTable({ products, isLoading, onUpdateStock }: InventoryTableProps) {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "stock",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);

  // Flatten products and variants into a single inventory list
  const inventoryItems = useMemo(() => {
    const items: InventoryItem[] = [];
    
    products.forEach(product => {
      if (!product.has_variants || product.track_inventory) {
         items.push({
           id: product.id,
           name: product.name,
           category: product.category || "General",
           stock: product.stock_qty,
           threshold: product.low_stock_threshold,
           type: 'product',
           image: product.image_urls[0],
           isActive: product.is_active
         });
      }
      
      if (product.has_variants && product.variants) {
        product.variants.forEach(variant => {
          const labelParts = [variant.variant_name, variant.size, variant.color].filter(Boolean);
          const variantLabel = labelParts.length > 0 ? labelParts.join(' / ') : 'Default Variant';

          items.push({
            id: variant.id,
            name: product.name,
            category: variantLabel,
            stock: variant.stock_qty,
            threshold: product.low_stock_threshold,
            type: 'variant',
            productId: product.id,
            image: variant.image_url || product.image_urls[0],
            isActive: variant.is_active
          });
        });
      }
    });
    
    return items;
  }, [products]);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filtered = [...inventoryItems];

    if (hasSearchFilter) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.category.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
       const filterSet = Array.from(statusFilter);
       filtered = filtered.filter((item) => {
         const status = item.stock <= 0 ? "out" : item.stock <= item.threshold ? "low" : "healthy";
         return filterSet.includes(status);
       });
    }

    return filtered;
  }, [inventoryItems, filterValue, statusFilter, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: InventoryItem, b: InventoryItem) => {
      const first = a[sortDescriptor.column as keyof InventoryItem] as number | string;
      const second = b[sortDescriptor.column as keyof InventoryItem] as number | string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedItems.slice(start, end);
  }, [page, sortedItems, rowsPerPage]);

  const renderCell = React.useCallback((item: InventoryItem, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return <InventoryItemCell name={item.name} category={item.category} image={item.image} />;
      case "stock":
        const isLow = item.stock <= item.threshold;
        const isOut = item.stock <= 0;
        return (
          <div className="flex flex-col">
            <p className={cn(
              "text-bold text-sm",
              isOut ? "text-danger" : isLow ? "text-warning" : "text-default-700"
            )}>
              {item.stock}
            </p>
            <p className="text-bold text-tiny text-default-400">
              Threshold: {item.threshold}
            </p>
          </div>
        );
      case "status":
        return <InventoryStatusChip stock={item.stock} threshold={item.threshold} />;
      case "actions":
        return (
          <InventoryActions 
            name={item.name} 
            currentStock={item.stock} 
            onUpdate={(newStock) => onUpdateStock(item.id, item.type, newStock)} 
          />
        );
      default:
        return item[columnKey as keyof InventoryItem] as React.ReactNode;
    }
  }, [onUpdateStock]);

  const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value?: string) => {
    setFilterValue(value || "");
    setPage(1);
  }, []);

  const topContent = useMemo(() => {
    return (
      <InventoryTableHeader 
        filterValue={filterValue}
        onFilterChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalItems={inventoryItems.length}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    );
  }, [filterValue, onSearchChange, statusFilter, inventoryItems.length, onRowsPerPageChange]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-end items-center">
        <Pagination
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    );
  }, [page, pages]);

  return (
    <Table
      aria-label="Inventory Table"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[700px]",
      }}
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSortChange={setSortDescriptor}
    >
      <TableHeader>
        <TableColumn key="name" allowsSorting>ITEM</TableColumn>
        <TableColumn key="stock" allowsSorting>STOCK</TableColumn>
        <TableColumn key="status" allowsSorting>STATUS</TableColumn>
        <TableColumn key="actions" align="end">ACTIONS</TableColumn>
      </TableHeader>
      <TableBody emptyContent={"No items found"} items={items} isLoading={isLoading}>
        {(item: InventoryItem) => (
          <TableRow key={`${item.id}-${item.type}`}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
