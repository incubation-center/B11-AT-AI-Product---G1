// Feature component — Product Manager
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Spinner,
  Switch,
} from '@heroui/react';
import { Plus, Search } from 'lucide-react';
import type { Product } from '@/lib/products';
import {
  useProducts,
  useDeactivateProduct,
  useRestoreProduct,
  useSyncProductToRag,
} from '@/hooks/use-products-queries';
import { ProductList } from './ProductList';
import { ProductFormDialog } from './ProductFormDialog';
import { ProductVariantDrawer } from './ProductVariantDrawer';

export default function ProductManager() {
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Variant Drawer State
  const [isVariantDrawerOpen, setIsVariantDrawerOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const pageSize = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const { data, isLoading, error, refetch } = useProducts({
    q: debouncedSearch,
    page,
    page_size: pageSize,
    include_inactive: showInactive,
  });

  const deactivateMutation = useDeactivateProduct();
  const restoreMutation = useRestoreProduct();
  const syncMutation = useSyncProductToRag();

  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleManageVariants = (product: Product) => {
    setVariantProduct(product);
    setIsVariantDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deactivateMutation.mutateAsync(id);
      refetch?.();
    } catch (err: unknown) {
      const error = err as Error;
      alert('Failed to deactivate product: ' + error.message);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      refetch?.();
    } catch (err: unknown) {
      const error = err as Error;
      alert('Failed to restore product: ' + error.message);
    }
  };

  const handleSync = async (id: string) => {
    try {
      await syncMutation.mutateAsync(id);
      alert('Product synced to AI assistant successfully!');
    } catch (err: unknown) {
      const error = err as Error;
      alert('Failed to sync product: ' + error.message);
    }
  };

  const handleSaved = () => {
    setIsDialogOpen(false);
    refetch?.();
  };

  const handleVariantsUpdated = () => {
    refetch?.();
  };

  const response = data || { data: [], total: 0, totalPages: 1 };
  const products = response.data;

  return (
    <main className="flex flex-col gap-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Product Manager</h1>
          <p className="text-default-500 mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={handleCreateNew}
          className="w-full sm:w-auto"
        >
          Add Product
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card shadow="sm" className="bg-danger-50 border border-danger-200">
          <CardBody>
            <p className="text-sm text-danger-700">
              {error instanceof Error
                ? error.message
                : 'Failed to load products'}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-md">
          <Input
            isClearable
            aria-label="Search products by name or category"
            placeholder="Search products..."
            startContent={<Search size={18} className="text-default-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            classNames={{
              input: 'text-sm',
              inputWrapper: 'h-10',
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-default-500">Show Inactive</span>
          <Switch
            size="sm"
            isSelected={showInactive}
            onValueChange={(val) => {
              setShowInactive(val);
              setPage(1);
            }}
            aria-label="Toggle inactive products"
          />
        </div>
      </div>

      {/* Products Table */}
      {isLoading && !products.length ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner color="primary" label="Loading products..." />
        </div>
      ) : (
        <div className="space-y-4">
          <ProductList
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onSync={handleSync}
            onManageVariants={handleManageVariants}
            isLoading={isLoading}
            page={page}
            totalPages={response.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Product Edit Dialog */}
      {isDialogOpen && (
        <ProductFormDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={editingProduct}
          onSaved={handleSaved}
        />
      )}

      {/* Variant Manager Drawer */}
      <ProductVariantDrawer
        product={variantProduct}
        isOpen={isVariantDrawerOpen}
        onOpenChange={(open) => {
          setIsVariantDrawerOpen(open);
          if (!open) setVariantProduct(null);
        }}
        onProductUpdated={handleVariantsUpdated}
      />
    </main>
  );
}
