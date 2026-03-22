import { getOwnerFlowState } from '@/lib/auth-server';
import ProductManager from '@/components/products/ProductManager';

export default async function ProductsPage() {
  await getOwnerFlowState();

  return (
    <>
      <div className="flex flex-col gap-6">
        <ProductManager />
      </div>
    </>
  );
}
