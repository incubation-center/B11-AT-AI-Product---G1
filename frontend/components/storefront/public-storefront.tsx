import { StorefrontAssistant } from '@/components/storefront/storefront-assistant';
import { EditorialLookbookTheme } from '@/components/storefront/themes/editorial-lookbook-theme';
import { HeroCategoryTilesTheme } from '@/components/storefront/themes/hero-category-tiles-theme';
import { ModernMinimalGridTheme } from '@/components/storefront/themes/modern-minimal-grid-theme';
import { getActiveProducts } from '@/components/storefront/themes/shared';
import type { StorefrontProduct, StorefrontStore } from '@/lib/storefront';
import { normalizeStorefrontTheme } from '@/lib/storefront-themes';

type PublicStorefrontProps = {
  store: StorefrontStore;
  products: StorefrontProduct[];
};

export function PublicStorefront({ store, products }: PublicStorefrontProps) {
  const productList = getActiveProducts(products);
  const selectedTheme = normalizeStorefrontTheme(store.storefrontTemplate);

  return (
    <div>
      {selectedTheme === 'modern-minimal-grid' ? (
        <ModernMinimalGridTheme store={store} products={productList} />
      ) : null}
      {selectedTheme === 'hero-category-tiles' ? (
        <HeroCategoryTilesTheme store={store} products={productList} />
      ) : null}
      {selectedTheme === 'editorial-lookbook' ? (
        <EditorialLookbookTheme store={store} products={productList} />
      ) : null}
      <StorefrontAssistant store={store} />
    </div>
  );
}
