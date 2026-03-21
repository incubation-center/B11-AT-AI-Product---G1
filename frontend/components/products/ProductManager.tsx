"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { useProducts, useDeactivateProduct } from "@/hooks/use-products-queries";
import { ProductList } from "./ProductList";
import { ProductFormDialog } from "./ProductFormDialog";

export default function ProductManager() {
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Queries
  const { data, isLoading, error } = useProducts({ page_size: 50 });
  const deactivateMutation = useDeactivateProduct();

  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    try {
      await deactivateMutation.mutateAsync(id);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Failed to delete product: " + error.message);
    }
  };

  if (isLoading && !data?.data) {
    return <div className="p-4 text-sm text-[var(--dashboard-muted)]">Loading products...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Create Button */}
      <div className="flex items-center justify-between rounded-[22px] border border-[var(--dashboard-border)] bg-white p-4">
        <h2 className="text-xl font-semibold text-[var(--dashboard-ink)]">Products Manager</h2>
        <button
          onClick={handleCreateNew}
          className="rounded-full bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center gap-2"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error instanceof Error ? error.message : "Failed to load products"}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <ProductList
          products={data?.data || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {isDialogOpen && (
        <ProductFormDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={editingProduct}
          onSaved={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}

