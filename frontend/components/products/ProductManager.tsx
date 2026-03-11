"use client";

import { useState, useEffect } from "react";
import {
  listProducts,
  deactivateProduct,
  type Product,
} from "@/lib/products";
import { ProductList } from "./ProductList";
import { ProductFormDialog } from "./ProductFormDialog";

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await listProducts({ page_size: 50 });
      if (res && res.data) {
        setProducts(res.data);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      await deactivateProduct(id);
      fetchProducts();
    } catch (err: unknown) {
      const error = err as Error;
      alert("Failed to delete product: " + error.message);
    }
  };

  if (loading && products.length === 0) {
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

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <ProductList
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {isDialogOpen && (
        <ProductFormDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={editingProduct}
          onSaved={fetchProducts}
        />
      )}
    </div>
  );
}

