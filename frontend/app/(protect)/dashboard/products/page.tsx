import { getOwnerFlowState } from "@/lib/auth-server";
import ProductManager from "@/components/products/ProductManager";

export default async function ProductsPage() {
  await getOwnerFlowState();

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dashboard-ink)]">Products</h1>
          <p className="mb-4 text-sm text-[var(--dashboard-muted)]">
            Manage your store&apos;s products and inventory.
          </p>
        </div>

        <ProductManager />
      </div>
    </>
  );
}
