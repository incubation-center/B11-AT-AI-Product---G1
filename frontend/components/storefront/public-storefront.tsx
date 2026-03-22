import type { StorefrontProduct, StorefrontStore } from '@/lib/storefront';
import { StorefrontAssistant } from '@/components/storefront/storefront-assistant';

type PublicStorefrontProps = {
  store: StorefrontStore;
  products: StorefrontProduct[];
};

function ProductCard({ product }: { product: StorefrontProduct }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
      <div className="aspect-[4/3] bg-slate-100">
        {product.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrls[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c61c2f]">
            {product.category ?? storeDefaultCategory(product)}
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            {product.name}
          </h3>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
          {product.description ?? 'This product is available in store now.'}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-[#002e6b]">
              {product.basePriceUsd
                ? `$${product.basePriceUsd}`
                : 'Ask for price'}
            </p>
            <p className="text-xs text-slate-500">Stock: {product.stockQty}</p>
          </div>
          <button className="rounded-full bg-[#002e6b] px-4 py-2 text-sm font-medium text-white">
            View Product
          </button>
        </div>
      </div>
    </article>
  );
}

function storeDefaultCategory(product: StorefrontProduct) {
  return product.hasVariants ? 'Variants' : 'Featured';
}

function BoutiqueEditorial({ store, products }: PublicStorefrontProps) {
  const featured = products[0];

  return (
    <div className="min-h-screen bg-[#f7f3ee] text-[#1c1b1a]">
      <section className="grid min-h-[72vh] gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <div className="flex flex-col justify-between rounded-[36px] bg-[#fffaf4] p-8 shadow-[0_30px_90px_rgba(60,47,30,0.12)]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#c61c2f]">
              {store.shopType}
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] text-[#002e6b] lg:text-7xl">
                {store.shopName}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                {store.description ??
                  'A curated storefront designed around your best products and buyer conversations.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-10">
            <a
              href="#products"
              className="rounded-full bg-[#002e6b] px-6 py-3 text-sm font-semibold text-white"
            >
              Shop Products
            </a>
            {store.googleMapUrl ? (
              <a
                href={store.googleMapUrl}
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Visit Store
              </a>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-[36px] bg-[#002e6b]">
          {featured?.imageUrls[0] || store.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured?.imageUrls[0] ?? store.bannerUrl ?? ''}
              alt={featured?.name ?? store.shopName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top,_#0b66c2,_#002e6b_70%)] p-10 text-white">
              <div className="max-w-sm space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                  Featured Story
                </p>
                <h2 className="text-3xl font-semibold">
                  {featured?.name ?? 'Curated for your buyers'}
                </h2>
                <p className="text-sm leading-7 text-white/75">
                  {featured?.description ??
                    'Your selected storefront theme is live. Next step is wiring the buyer assistant directly into this store.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="products" className="px-6 pb-14 lg:px-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c61c2f]">
              Collection
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[#002e6b]">
              Storefront Products
            </h2>
          </div>
          <p className="text-sm text-slate-500">{products.length} products</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <StorefrontAssistant store={store} />
    </div>
  );
}

function MarketGrid({ store, products }: PublicStorefrontProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <section className="border-b border-slate-200 bg-white px-6 py-6 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c61c2f]">
              {store.shopType}
            </p>
            <h1 className="text-4xl font-semibold text-[#002e6b] lg:text-5xl">
              {store.shopName}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              {store.description ??
                'Browse all active products from this shop in a fast, product-first grid.'}
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-3">
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Products
              </p>
              <p className="mt-2 text-3xl font-semibold">{products.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Template
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Market Grid
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-12">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <StorefrontAssistant store={store} />
    </div>
  );
}

function CatalogFlow({ store, products }: PublicStorefrontProps) {
  const featured = products.slice(0, 3);
  const rest = products.slice(3);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_24%)] text-slate-900">
      <section className="px-6 py-12 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c61c2f]">
              {store.shopType}
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] text-[#002e6b] lg:text-6xl">
              {store.shopName}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              {store.description ??
                'A flexible catalog storefront for stores with mixed product ranges and practical buyer journeys.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#featured"
                className="rounded-full bg-[#002e6b] px-5 py-3 text-sm font-semibold text-white"
              >
                Explore Featured
              </a>
              <a
                href="#catalog"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Full Catalog
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {featured.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <div className="aspect-square bg-slate-100">
                  {product.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <h2 className="text-base font-semibold">{product.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.basePriceUsd
                      ? `$${product.basePriceUsd}`
                      : 'Ask for price'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="px-6 pb-14 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(rest.length > 0 ? rest : products).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <StorefrontAssistant store={store} />
    </div>
  );
}

export function PublicStorefront({ store, products }: PublicStorefrontProps) {
  const productList = products.filter((product) => product.isActive);

  if (store.storefrontTemplate === 'market-grid') {
    return <MarketGrid store={store} products={productList} />;
  }

  if (store.storefrontTemplate === 'catalog-flow') {
    return <CatalogFlow store={store} products={productList} />;
  }

  return <BoutiqueEditorial store={store} products={productList} />;
}
