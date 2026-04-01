import { ShopsUsabilityMock } from '@/components/storefront/shops-usability-mock';
import { getShopsDirectoryData } from '@/lib/shops-directory-data';

export default async function BrowseShopsPage() {
  const { stores, products, categories } = await getShopsDirectoryData();

  return (
    <ShopsUsabilityMock
      stores={stores}
      allProducts={products}
      categories={categories}
    />
  );
}
