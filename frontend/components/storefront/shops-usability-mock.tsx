'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  CreditCard,
  Heart,
  MapPin,
  Phone,
  ShoppingCart,
  Sparkles,
  Store,
  LogIn,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';

import type { PublicStoreSummary } from '@/lib/storefront';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { DirectoryProduct } from '@/lib/shops-directory-data';

type ShopsUsabilityMockProps = {
  stores: PublicStoreSummary[];
  allProducts: DirectoryProduct[];
  categories: string[];
  initialTab?: TabKey;
};

type TabKey = 'explore' | 'favorites' | 'cart' | 'assistant';

type SuggestedShop = {
  shopName: string;
  subdomain: string;
  storeUrl: string;
  matchedProducts: string[];
};

type GlobalAssistantMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  suggestedShops?: SuggestedShop[];
};

const FAVORITES_STORAGE_KEY = 'coolhat.buyer.favorites.global';
const FAVORITES_STORAGE_ENTRIES_KEY = 'coolhat.buyer.favorites.global.entries';
const CART_STORAGE_ENTRIES_KEY = 'coolhat.buyer.cart.global.entries';

type MockCartEntry = {
  id: string;
  subdomain: string;
  shopName: string;
  category: string;
  name: string;
  price: string;
  imageUrl: string;
  qty: number;
};

function buildFavoriteKey(product: DirectoryProduct) {
  return `${product.subdomain}:${product.id}`;
}

function sanitizeFavoriteKeys(raw: unknown) {
  if (!Array.isArray(raw)) return new Set<string>();
  const keys = raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.includes(':'));
  return new Set(keys);
}

function sanitizeFavoriteKeysFromEntries(raw: unknown) {
  if (!Array.isArray(raw)) return new Set<string>();
  const keys = raw
    .filter((value): value is { id: string; subdomain: string } => {
      if (!value || typeof value !== 'object') return false;
      const item = value as Record<string, unknown>;
      return typeof item.id === 'string' && typeof item.subdomain === 'string';
    })
    .map((value) => buildFavoriteKey({ id: value.id, subdomain: value.subdomain } as DirectoryProduct));
  return new Set(keys);
}

function sanitizeCartEntries(raw: unknown): MockCartEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((value): value is MockCartEntry => {
      if (!value || typeof value !== 'object') return false;
      const item = value as Record<string, unknown>;
      return (
        typeof item.id === 'string' &&
        typeof item.subdomain === 'string' &&
        typeof item.shopName === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'string' &&
        typeof item.imageUrl === 'string' &&
        typeof item.qty === 'number' &&
        item.qty > 0
      );
    })
    .map((item) => ({
      ...item,
      category: item.category || 'General',
      qty: Math.max(1, Math.floor(item.qty)),
    }));
}

function buildCheckoutUrl(apiBase: string, subdomain: string): string {
  const url = new URL('/checkout', apiBase);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    url.hostname = `${subdomain}.localhost`;
    return url.toString();
  }
  url.hostname = `${subdomain}.${url.hostname}`;
  return url.toString();
}

export function ShopsUsabilityMock({
  stores,
  allProducts,
  categories,
  initialTab = 'explore',
}: ShopsUsabilityMockProps) {
  void categories;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllShops, setShowAllShops] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [queryOpen, setQueryOpen] = useState(false);
  const [isGlobalAssistantSending, setIsGlobalAssistantSending] = useState(false);
  const [globalAssistantMessages, setGlobalAssistantMessages] = useState<GlobalAssistantMessage[]>([
    {
      id: 'global-assistant-welcome',
      role: 'assistant',
      content: 'Ask me anything about products, prices, and shops in CoolHat.',
    },
  ]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set<string>());
  const [cartEntries, setCartEntries] = useState<MockCartEntry[]>([]);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    try {
      const entryRaw = window.localStorage.getItem(FAVORITES_STORAGE_ENTRIES_KEY);
      if (entryRaw) {
        const fromEntries = sanitizeFavoriteKeysFromEntries(JSON.parse(entryRaw));
        if (fromEntries.size > 0) {
          setFavoriteKeys(fromEntries);
        } else {
          const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
          if (raw) setFavoriteKeys(sanitizeFavoriteKeys(JSON.parse(raw)));
        }
      } else {
        const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (raw) setFavoriteKeys(sanitizeFavoriteKeys(JSON.parse(raw)));
      }

      const cartRaw = window.localStorage.getItem(CART_STORAGE_ENTRIES_KEY);
      if (cartRaw) setCartEntries(sanitizeCartEntries(JSON.parse(cartRaw)));
    } catch {
      // Keep empty defaults if storage payload is malformed.
    } finally {
      setHasHydratedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteKeys)));
  }, [favoriteKeys, hasHydratedStorage]);

  const favoriteEntriesForStorage = useMemo(
    () =>
      allProducts
        .filter((product) => favoriteKeys.has(buildFavoriteKey(product)))
        .map((product) => ({
          id: product.id,
          subdomain: product.subdomain,
          shopName: product.shopName,
          name: product.name,
          price: product.basePriceUsd ? `$${Number(product.basePriceUsd).toFixed(2)}` : '$0.00',
          imageUrl: product.imageUrls[0] ?? '',
          description: '',
        })),
    [allProducts, favoriteKeys],
  );

  useEffect(() => {
    if (!hasHydratedStorage) return;
    window.localStorage.setItem(
      FAVORITES_STORAGE_ENTRIES_KEY,
      JSON.stringify(favoriteEntriesForStorage),
    );
  }, [favoriteEntriesForStorage, hasHydratedStorage]);

  useEffect(() => {
    if (!hasHydratedStorage) return;
    window.localStorage.setItem(CART_STORAGE_ENTRIES_KEY, JSON.stringify(cartEntries));
  }, [cartEntries, hasHydratedStorage]);

  const mockFavorites = useMemo(
    () => allProducts.filter((product) => favoriteKeys.has(buildFavoriteKey(product))),
    [allProducts, favoriteKeys],
  );
  const mockCart = useMemo(
    () => cartEntries,
    [cartEntries],
  );

  const shopTiles = useMemo(
    () =>
      stores.map((shop) => ({
        id: shop.id,
        subdomain: shop.subdomain,
        name: shop.shopName,
        category: shop.shopType.replaceAll('_', ' '),
        imageUrl: shop.bannerUrl || shop.logoUrl || '',
      })),
    [stores],
  );

  const visibleShops = showAllShops ? shopTiles : shopTiles.slice(0, 4);
  const totalShops = shopTiles.length;

  const mockSubtotal = mockCart.reduce((sum, item) => {
    const parsed = Number(item.price.replace('$', ''));
    return sum + (Number.isNaN(parsed) ? 0 : parsed * item.qty);
  }, 0);

  const followedShops = useMemo(() => stores.slice(0, 3), [stores]);

  const onToggleFavorite = (product: DirectoryProduct) => {
    const key = buildFavoriteKey(product);
    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const onAddToCart = (product: DirectoryProduct) => {
    const key = `${product.subdomain}:${product.id}`;
    const price = product.basePriceUsd
      ? `$${Number(product.basePriceUsd).toFixed(2)}`
      : '$0.00';

    setCartEntries((prev) => {
      const index = prev.findIndex((item) => `${item.subdomain}:${item.id}` === key);
      if (index === -1) {
        return [
          {
            id: product.id,
            subdomain: product.subdomain,
            shopName: product.shopName,
            category: product.category ?? 'General',
            name: product.name,
            price,
            imageUrl: product.imageUrls[0] ?? '',
            qty: 1,
          },
          ...prev,
        ];
      }

      const next = [...prev];
      next[index] = { ...next[index], qty: next[index].qty + 1 };
      return next;
    });
  };

  const sendGlobalAssistantQuestion = async () => {
    const question = queryText.trim();
    if (!question || isGlobalAssistantSending) return;

    setGlobalAssistantMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: question },
    ]);
    setQueryText('');
    setIsGlobalAssistantSending(true);

    try {
      const response = await fetch('/api/storefront/assistant/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        answer?: string;
        message?: string;
        suggested_shops?: SuggestedShop[];
      };

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to get assistant response right now.');
      }

      const answer =
        typeof payload.answer === 'string' && payload.answer.trim()
          ? payload.answer.trim()
          : 'I could not find enough context. Please try rephrasing your question.';

      setGlobalAssistantMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answer,
          suggestedShops: payload.suggested_shops ?? [],
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to reach assistant.';
      setGlobalAssistantMessages((prev) => [
        ...prev,
        { id: `assistant-error-${Date.now()}`, role: 'assistant', content: errorMessage },
      ]);
    } finally {
      setIsGlobalAssistantSending(false);
    }
  };

  const sidebarLinks = [
    {
      key: 'explore',
      label: 'Browse Products',
      icon: <Compass className="size-4 flex-shrink-0 text-slate-700" />,
    },
    {
      key: 'favorites',
      label: 'Favorites',
      icon: <Heart className="size-4 flex-shrink-0 text-slate-700" />,
    },
    {
      key: 'cart',
      label: 'Cart',
      icon: <ShoppingCart className="size-4 flex-shrink-0 text-slate-700" />,
    },
    {
      key: 'assistant',
      label: 'AI Concierge',
      icon: <Sparkles className="size-4 flex-shrink-0 text-slate-700" />,
    },
  ] as const;

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_#fff3da,_#fff_36%,_#edf4ff)] px-3 py-3 text-[#002e6b] md:px-4 md:py-4">
      <div className="mx-auto flex w-full max-w-none items-start gap-4">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody className="h-[calc(100vh-1.5rem)] justify-between gap-6 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_16px_45px_rgba(0,46,107,0.12)] md:sticky md:top-3 md:h-[calc(100vh-1.5rem)] md:border-r-0 md:bg-white/95 md:px-3 md:py-3">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <div className="mb-5 flex items-center gap-2 px-1">
                <div className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <Image
                    src="/logo.svg"
                    alt="Coolhat logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                {sidebarOpen ? (
                  <div>
                    <p className="text-sm font-semibold">CoolHat AI</p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                {sidebarLinks.map((link) => {
                  const isActive = activeTab === link.key;
                  return (
                    <SidebarLink
                      key={link.key}
                      onClick={(event) => {
                        event.preventDefault();
                        setActiveTab(link.key);
                      }}
                      link={{ label: link.label, href: '#', icon: link.icon }}
                      active={isActive}
                      className={cn(
                        'border border-transparent bg-white/70 backdrop-blur-sm',
                        isActive
                          ? 'border-[#002e6b]/20 bg-[#002e6b] text-white shadow-[0_10px_20px_rgba(0,46,107,0.22)] hover:bg-[#002e6b]'
                          : 'text-slate-800 hover:border-[#cfe0ff] hover:bg-[#f5f9ff]',
                      )}
                    />
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {sidebarOpen ? 'Shops' : 'S'}
                  </p>
                  <div className={cn('mt-3 grid gap-2', sidebarOpen ? 'grid-cols-2' : 'grid-cols-1')}>
                    {visibleShops.map((shop) => (
                      <Link
                        key={shop.id}
                        href={`/shops/${shop.subdomain}`}
                        title={`Visit ${shop.name}`}
                        className={cn(
                          'group relative overflow-hidden rounded-lg border border-slate-200',
                          sidebarOpen ? 'h-16' : 'h-14',
                        )}
                      >
                        {shop.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={shop.imageUrl}
                            alt={shop.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-[linear-gradient(120deg,#e9f1ff,#fff4df)]" />
                        )}
                        <div className="absolute inset-0 bg-black/35" />
                        {sidebarOpen ? (
                          <div className="absolute inset-x-2 bottom-2">
                            <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                              {shop.name}
                            </p>
                            <p className="line-clamp-1 text-[10px] text-white/85">
                              Category: {shop.category}
                            </p>
                          </div>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                  {totalShops > 4 && sidebarOpen ? (
                    <button
                      type="button"
                      onClick={() => setShowAllShops((value) => !value)}
                      className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#002e6b] hover:bg-[#002e6b]/5"
                    >
                      {showAllShops ? 'Show less shops' : 'Show more shops'}
                    </button>
                  ) : null}
                </div>
            </div>
          </SidebarBody>
        </Sidebar>

        <section
          className={cn(
            'min-w-0 flex-1 pr-1',
            activeTab === 'assistant'
              ? 'h-[calc(100dvh-1.5rem)] overflow-hidden'
              : 'max-h-[calc(100dvh-1.5rem)] overflow-y-auto',
          )}
        >
          <div className={cn('relative', activeTab !== 'assistant' && 'pb-28', activeTab === 'assistant' && 'h-full')}>
            {activeTab === 'explore' ? (
              <ExploreView
                stores={stores}
                allProducts={allProducts}
                favoriteKeys={favoriteKeys}
                onToggleFavorite={onToggleFavorite}
                onAddToCart={onAddToCart}
                onOpenAuth={() => setShowAuthDialog(true)}
              />
            ) : null}
            {activeTab === 'favorites' ? (
              <FavoritesView
                mockFavorites={mockFavorites}
                followedShops={followedShops}
                favoriteKeys={favoriteKeys}
                onToggleFavorite={onToggleFavorite}
                onAddToCart={onAddToCart}
                onBrowseProducts={() => setActiveTab('explore')}
              />
            ) : null}
            {activeTab === 'cart' ? (
              <CartView
                mockCart={mockCart}
                mockSubtotal={mockSubtotal}
                onRemoveItem={(itemKey) => setCartEntries((prev) => prev.filter((item) => `${item.subdomain}:${item.id}` !== itemKey))}
                onClearCart={() => setCartEntries([])}
              />
            ) : null}
            {activeTab === 'assistant' ? (
              <GlobalAssistantWorkspace
                messages={globalAssistantMessages}
                value={queryText}
                onChange={setQueryText}
                onSend={sendGlobalAssistantQuestion}
                isSending={isGlobalAssistantSending}
              />
            ) : null}
          </div>
        </section>

        {activeTab !== 'assistant' ? (
          <div className="fixed bottom-3 right-3 z-40 lg:bottom-5 lg:right-6">
            <QueryChatWidget
              open={queryOpen}
              onToggle={() => setQueryOpen((value) => !value)}
              onClose={() => setQueryOpen(false)}
              value={queryText}
              onChange={(value) => setQueryText(value)}
              messages={globalAssistantMessages}
              isSending={isGlobalAssistantSending}
              onSend={sendGlobalAssistantQuestion}
            />
          </div>
        ) : null}
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#002e6b]">
              Ready to create your store?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <p className="text-sm text-slate-600">
              Sign in to access an existing store or create a new one. Start selling with Coolhat today!
            </p>

            <div className="grid gap-3">
              <Link
                href="/sign-in"
                className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#c61c2f] to-[#a01625] text-white font-semibold text-sm text-center transition hover:shadow-lg"
                onClick={() => setShowAuthDialog(false)}
              >
                Sign In to Your Store
              </Link>

              <Link
                href="/sign-up"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-[#002e6b] bg-white text-[#002e6b] font-semibold text-sm text-center transition hover:bg-[#f0f6ff]"
                onClick={() => setShowAuthDialog(false)}
              >
                Create New Store
              </Link>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">or</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Continue browsing products as a buyer below.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function GlobalAssistantWorkspace({
  messages,
  value,
  onChange,
  onSend,
  isSending,
}: {
  messages: GlobalAssistantMessage[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const quickPrompts = [
    'Show affordable skincare under $30',
    'Compare beginner camera options',
    'Best-selling makeup from trusted shops',
    'Suggest gift products for under $50',
  ];

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_35px_rgba(0,46,107,0.10)]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#dbe9ff] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-10 h-44 w-44 rounded-full bg-[#ffe9cc] blur-3xl" />

      <div className="relative border-b border-slate-200 bg-[linear-gradient(120deg,#eef5ff,#ffffff)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full border border-[#bfd6ff] bg-[#f3f8ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3f69a5]">
              <Sparkles className="size-3" /> Global Assistant
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#002e6b]">CoolHat AI Workspace</h2>
            <p className="mt-1 text-sm text-slate-600">Find products from every shop in one chat.</p>
          </div>
          <p className="rounded-full border border-[#d7e5ff] bg-white px-3 py-1 text-xs font-semibold text-[#2f5a98]">Live suggestions</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onChange(prompt)}
              className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1.5 text-xs font-semibold text-[#17427a] transition hover:bg-[#f3f8ff]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fc_100%)] p-4 sm:p-5">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            {messages.length === 1 ? (
              <div className="mb-2 rounded-2xl border border-[#d7e5ff] bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
                Try: budget, product type, or preferred brand.
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6',
                  message.role === 'user'
                    ? 'ml-auto bg-[linear-gradient(145deg,#002e6b,#1a4f8f)] text-white shadow-[0_12px_28px_rgba(0,46,107,0.28)]'
                    : 'border border-slate-200 bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)]',
                )}
              >
                <p className={cn('mb-1 text-[11px] font-semibold uppercase tracking-[0.08em]', message.role === 'user' ? 'text-white/75' : 'text-[#4f6e9e]')}>
                  {message.role === 'user' ? 'You' : 'CoolHat AI'}
                </p>
                {message.content}
                {message.role === 'assistant' && (message.suggestedShops?.length ?? 0) > 0 ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-[#d9e7ff] bg-[#f7fbff] p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Suggested Shops</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestedShops?.map((shop) => (
                        <Link
                          key={`${message.id}-${shop.subdomain}`}
                          href={shop.storeUrl}
                          className="inline-flex items-center rounded-full border border-[#cfe0ff] bg-[#eef5ff] px-2.5 py-1 text-xs font-semibold text-[#17427a] transition hover:-translate-y-[1px] hover:bg-[#e2edff]"
                        >
                          {shop.shopName}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {isSending ? (
              <div className="max-w-[70%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <div className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#7b96bb]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#7b96bb] [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#7b96bb] [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
          <div className="mx-auto max-w-4xl rounded-2xl border border-[#c7d9f4] bg-[linear-gradient(145deg,#f8fbff,#f5f8fd)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-end gap-2">
              <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Ask for product ideas, prices, or where to buy..."
                className="min-h-[54px] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={onSend}
                disabled={!value.trim() || isSending}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#002e6b,#1a4f8f)] text-white transition hover:bg-[#003d8f] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send global question"
                title="Send global question"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QueryChatWidget({
  open,
  onToggle,
  onClose,
  value,
  onChange,
  messages,
  isSending,
  onSend,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  messages: GlobalAssistantMessage[];
  isSending: boolean;
  onSend: () => void;
}) {
  const AI_WIDGET_GUIDE_SEEN_KEY = 'coolhat.ai.widget.guide.seen';
  const [showGuide, setShowGuide] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(AI_WIDGET_GUIDE_SEEN_KEY) !== '1';
  });
  const guidePrompts = [
    'Find a good deal under $20',
    'Compare two similar products',
    'Recommend a gift set',
  ];

  const dismissGuide = () => {
    setShowGuide(false);
    window.localStorage.setItem(AI_WIDGET_GUIDE_SEEN_KEY, '1');
  };

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {open ? (
        <div className="h-[min(78vh,42rem)] w-[min(25.5rem,calc(100vw-0.75rem))] overflow-hidden rounded-[1.8rem] border border-[#b8ceef] bg-white shadow-[0_24px_55px_rgba(2,6,23,0.32)]">
          <div className="bg-[#002e6b] px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9ec4ff]">
                  Product Assistant
                </p>
                <p className="mt-1 text-[1.35rem] font-semibold leading-tight">
                  All Shops Assistant
                </p>
                <p className="mt-1 text-sm text-white/85">
                  Ask about products across all shops.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
                aria-label="Close assistant"
                title="Close assistant"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(100%-7rem)] flex-col bg-[#f3f4f6]">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                {showGuide ? (
                  <div className="rounded-2xl border border-[#d6e5ff] bg-[linear-gradient(140deg,#ffffff,#f3f8ff)] p-3 shadow-sm animate-[pulse_2.8s_ease-in-out_infinite]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4d73a8]"><Sparkles className="size-3" /> Quick AI Guide</p>
                        <p className="mt-1 text-sm font-semibold text-[#103b72]">Try one prompt to start</p>
                        <p className="mt-1 text-xs text-slate-600">Ask, refine, and open suggested shops in one flow.</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-full border border-[#d8e6ff] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#285287]">1. Ask</span>
                          <span className="rounded-full border border-[#d8e6ff] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#285287]">2. Refine</span>
                          <span className="rounded-full border border-[#d8e6ff] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#285287]">3. Visit Shop</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={dismissGuide}
                        className="rounded-full border border-[#c8daf8] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#27548f] hover:bg-[#f2f7ff]"
                      >
                        Got it
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {guidePrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => onChange(prompt)}
                          className="rounded-full border border-[#cfe0ff] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#17427a] transition hover:-translate-y-[1px] hover:bg-[#eef5ff]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {messages.slice(-8).map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6',
                      message.role === 'user'
                        ? 'ml-auto bg-[#002e6b] text-white'
                        : 'bg-white text-slate-700 shadow-sm',
                    )}
                  >
                    {message.content}
                    {message.role === 'assistant' && (message.suggestedShops?.length ?? 0) > 0 ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Suggested Shops</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedShops?.map((shop) => (
                            <Link
                              key={`${message.id}-${shop.subdomain}`}
                              href={shop.storeUrl}
                              className="inline-flex items-center rounded-full border border-[#cfe0ff] bg-[#eef5ff] px-2.5 py-1 text-xs font-semibold text-[#17427a] hover:bg-[#e2edff]"
                            >
                              {shop.shopName}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-3 py-4">
              <div className="rounded-2xl border border-[#cfdaea] bg-[#f8fafc] p-2.5">
                <div className="flex items-center gap-2 rounded-xl bg-transparent px-2">
                <input
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder="Ask about this product..."
                  className="h-11 w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!value.trim() || isSending}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7b96bb] text-white transition hover:bg-[#6584ad]"
                  aria-label="Send product query"
                >
                  <ArrowRight className="size-4" />
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        className="group relative inline-flex items-center gap-2 rounded-full border border-[#8fb0e6] bg-gradient-to-r from-[#002e6b] to-[#0b4ea8] px-4 py-3 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(0,46,107,0.45)] ring-4 ring-[#cfe0ff]/60 transition hover:scale-[1.03] hover:from-[#003d8f] hover:to-[#2363b8]"
      >
        <span className="absolute -right-1 -bottom-1 inline-flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8de9b2] opacity-70" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-[#7ed8a2]" />
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
          <Sparkles className="size-4" />
        </span>
        Get AI Shopping Help
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#a6f4c5] shadow-[0_0_0_4px_rgba(166,244,197,0.25)]" />
      </button>
    </div>
  );
}

function ExploreView({
  stores,
  allProducts,
  favoriteKeys,
  onToggleFavorite,
  onAddToCart,
  onOpenAuth,
}: {
  stores: PublicStoreSummary[];
  allProducts: DirectoryProduct[];
  favoriteKeys: Set<string>;
  onToggleFavorite: (product: DirectoryProduct) => void;
  onAddToCart: (product: DirectoryProduct) => void;
  onOpenAuth: () => void;
}) {
  const fallbackHeroTiles = [
    { id: 'fallback-1', label: 'Shop Tile 1', imageUrl: '/shop5.jpg' },
    { id: 'fallback-2', label: 'Shop Tile 2', imageUrl: '/shop3.webp' },
    { id: 'fallback-3', label: 'Shop Tile 3', imageUrl: '/channel.png' },
    { id: 'fallback-4', label: 'Shop Tile 4', imageUrl: '/pka.jpg' },
    { id: 'fallback-5', label: 'Shop Tile 5', imageUrl: '/weyoung.jpg' },
    { id: 'fallback-6', label: 'Shop Tile 6', imageUrl: '/Bare.jpg' },
  ];

  const heroTilesBase = stores
    .map((store) => {
      const productImage = allProducts.find(
        (product) => product.subdomain === store.subdomain && product.imageUrls[0],
      )?.imageUrls[0];

      return {
        id: store.id,
        label: store.shopName,
        imageUrl: store.logoUrl || store.bannerUrl || productImage || '',
      };
    })
    .filter((tile) => Boolean(tile.imageUrl));

  const productTiles = allProducts
    .filter((product) => Boolean(product.imageUrls[0]))
    .map((product) => ({
      id: `product-${product.id}`,
      label: product.name,
      imageUrl: product.imageUrls[0],
    }));

  const mergedTiles = [...heroTilesBase, ...productTiles, ...fallbackHeroTiles];
  const uniqueTiles = mergedTiles.filter(
    (tile, index) => mergedTiles.findIndex((item) => item.imageUrl === tile.imageUrl) === index,
  );
  const heroTiles = uniqueTiles.slice(0, 15);
  const floatingTiles = heroTiles.slice(0, 15);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const visibleProducts = showAllProducts ? allProducts : allProducts.slice(0, 8);
  const totalProducts = allProducts.length;

  return (
    <>
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_26px_rgba(0,46,107,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-[family:var(--font-dashboard-display)] text-2xl font-semibold text-[#002e6b]">
            Browse Products
          </h1>
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#002e6b] to-[#003d8f] text-white font-semibold text-xs transition-all hover:shadow-lg hover:scale-105"
          >
            <LogIn className="size-3.5" />
            View Store
          </button>
        </div>
      </div>

      <div className="relative mb-5 overflow-hidden rounded-[2rem] border border-[#cfe0ff] bg-[radial-gradient(circle_at_20%_18%,#f6f9ff_0%,#e9f2ff_42%,#dceaff_100%)] px-4 py-8 shadow-[0_24px_56px_rgba(0,46,107,0.18)] md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-white/55 blur-3xl" />
        <div className="pointer-events-none absolute -right-14 -bottom-16 h-48 w-48 rounded-full bg-[#d8e7ff]/70 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-white/62 via-white/35 to-transparent backdrop-blur-[7px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/74 via-white/35 to-transparent" />

        <div className="relative h-[360px] md:h-[440px]">
          {floatingTiles.map((tile, index) => {
            const popupPresets = [
              'left-[4%] top-[64%] h-12 w-12 md:h-16 md:w-16 animate-[slide-popup-1_18s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[14%] top-[72%] h-12 w-12 md:h-14 md:w-14 animate-[slide-popup-2_20s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[24%] top-[66%] h-14 w-14 md:h-[4.5rem] md:w-[4.5rem] animate-[slide-popup-3_16s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[34%] top-[76%] h-12 w-12 md:h-14 md:w-14 animate-[slide-popup-4_21s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[44%] top-[64%] h-14 w-14 md:h-[4.75rem] md:w-[4.75rem] animate-[slide-popup-1_17s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[54%] top-[75%] h-12 w-12 md:h-14 md:w-14 animate-[slide-popup-2_18s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[64%] top-[66%] h-14 w-14 md:h-[4.5rem] md:w-[4.5rem] animate-[slide-popup-3_20s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[74%] top-[76%] h-12 w-12 md:h-14 md:w-14 animate-[slide-popup-4_19s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[84%] top-[64%] h-14 w-14 md:h-[4.75rem] md:w-[4.75rem] animate-[slide-popup-1_22s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[9%] top-[84%] h-11 w-11 md:h-12 md:w-12 animate-[slide-popup-2_16s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[28%] top-[86%] h-11 w-11 md:h-12 md:w-12 animate-[slide-popup-3_18s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[46%] top-[84%] h-11 w-11 md:h-12 md:w-12 animate-[slide-popup-4_17s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[62%] top-[87%] h-11 w-11 md:h-12 md:w-12 animate-[slide-popup-1_21s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[78%] top-[86%] h-11 w-11 md:h-12 md:w-12 animate-[slide-popup-2_18s_cubic-bezier(0.35,0,0.2,1)_infinite]',
              'left-[90%] top-[83%] h-11 w-11 md:h-12 md:w-12 animate-[slide-popup-3_19s_cubic-bezier(0.35,0,0.2,1)_infinite]',
            ];

            const delayPresets = [
              '[animation-delay:0ms]',
              '[animation-delay:140ms]',
              '[animation-delay:280ms]',
              '[animation-delay:420ms]',
              '[animation-delay:560ms]',
              '[animation-delay:700ms]',
              '[animation-delay:840ms]',
              '[animation-delay:980ms]',
              '[animation-delay:1120ms]',
              '[animation-delay:1260ms]',
              '[animation-delay:1400ms]',
              '[animation-delay:1540ms]',
              '[animation-delay:1680ms]',
              '[animation-delay:1820ms]',
              '[animation-delay:1960ms]',
            ];

            return (
              <div
                key={`${tile.id}-popup-${index}`}
                className={`absolute z-10 overflow-hidden rounded-2xl border border-white/85 bg-white/80 shadow-[0_14px_30px_rgba(2,6,23,0.20)] backdrop-blur-md transition duration-300 hover:scale-[1.05] ${popupPresets[index % popupPresets.length]} ${delayPresets[index % delayPresets.length]}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tile.imageUrl}
                  alt={tile.label}
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}

          <div className="absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 items-center justify-center">
            <div className="rounded-3xl border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(241,247,255,0.68))] px-7 py-4 shadow-[0_20px_42px_rgba(0,46,107,0.16)] backdrop-blur-md animate-[hero-breathe_8s_ease-in-out_infinite] md:px-10 md:py-5">
              <h2 className="text-center font-[family:var(--font-dashboard-display)] text-6xl font-semibold tracking-[-0.02em] text-[#002e6b] drop-shadow-[0_8px_18px_rgba(0,46,107,0.12)] md:text-8xl">
                coolhat
              </h2>
              <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4f8f] md:text-sm">
                Discover what is trending
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-popup-1 {
          0% { transform: translate3d(50px, 0, 0) rotate(0deg) scale(1); opacity: 0.88; }
          50% { transform: translate3d(-24px, -8px, 0) rotate(-1deg) scale(1.01); opacity: 1; }
          100% { transform: translate3d(-95px, -2px, 0) rotate(0deg) scale(1); opacity: 0.9; }
        }

        @keyframes slide-popup-2 {
          0% { transform: translate3d(56px, 0, 0) rotate(0deg) scale(1); opacity: 0.86; }
          50% { transform: translate3d(-20px, -5px, 0) rotate(1deg) scale(1.01); opacity: 1; }
          100% { transform: translate3d(-102px, -1px, 0) rotate(0deg) scale(1); opacity: 0.9; }
        }

        @keyframes slide-popup-3 {
          0% { transform: translate3d(44px, 0, 0) rotate(0deg) scale(1); opacity: 0.9; }
          50% { transform: translate3d(-26px, -9px, 0) rotate(-1deg) scale(1.01); opacity: 1; }
          100% { transform: translate3d(-88px, -3px, 0) rotate(0deg) scale(1); opacity: 0.88; }
        }

        @keyframes slide-popup-4 {
          0% { transform: translate3d(60px, 0, 0) rotate(0deg) scale(1); opacity: 0.9; }
          50% { transform: translate3d(-18px, -6px, 0) rotate(1deg) scale(1.01); opacity: 1; }
          100% { transform: translate3d(-110px, -2px, 0) rotate(0deg) scale(1); opacity: 0.87; }
        }

        @keyframes hero-breathe {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -2px, 0) scale(1.01); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
      `}</style>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family:var(--font-dashboard-display)] text-4xl font-semibold text-[#002e6b]">
            Shops
          </h2>
          <span className="text-sm font-semibold text-[#c61c2f]">View All</span>
        </div>

        {stores.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-semibold">No public shops found yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Once merchants publish stores, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stores.map((store) => (
              <article
                key={store.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(0,46,107,0.12)]"
              >
                <div className="relative h-32 bg-slate-100">
                  {store.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.bannerUrl}
                      alt={store.shopName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[linear-gradient(120deg,#e9f1ff,#fff4df)]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

                  <div className="absolute left-3 top-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.22)]">
                    {store.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={store.logoUrl}
                        alt={`${store.shopName} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold uppercase text-[#002e6b]">
                        {store.shopName.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#002e6b]">
                    Brand Shop
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{store.shopName}</h3>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      {store.shopType.replaceAll('_', ' ')}
                    </p>
                  </div>

                  <p className="line-clamp-2 min-h-[2.25rem] text-xs leading-5 text-slate-600">
                    {store.description ??
                      'Discover signature products and new arrivals from this shop.'}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-500">{store.subdomain}</span>
                    <Link
                      href={`/shops/${store.subdomain}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#002e6b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#003d8f]"
                    >
                      Visit <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-[family:var(--font-dashboard-display)] text-4xl font-semibold text-[#002e6b]">
            All Products
          </h2>
        </div>
        <ProductGrid
          products={visibleProducts}
          favoriteKeys={favoriteKeys}
          onToggleFavorite={onToggleFavorite}
          onAddToCart={onAddToCart}
        />
        {totalProducts > 8 ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllProducts((value) => !value)}
              className="rounded-full border border-[#002e6b]/30 px-4 py-2 text-xs font-semibold text-[#002e6b] transition hover:bg-[#002e6b]/5"
            >
              {showAllProducts ? 'Show less' : 'View more'}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function FavoritesView({
  mockFavorites,
  followedShops,
  favoriteKeys,
  onToggleFavorite,
  onAddToCart,
  onBrowseProducts,
}: {
  mockFavorites: DirectoryProduct[];
  followedShops: PublicStoreSummary[];
  favoriteKeys: Set<string>;
  onToggleFavorite: (product: DirectoryProduct) => void;
  onAddToCart: (product: DirectoryProduct) => void;
  onBrowseProducts: () => void;
}) {
  if (mockFavorites.length === 0) {
    return (
      <>
        <div className="mb-5 overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[linear-gradient(120deg,#eef5ff_0%,#ffffff_52%,#fff7e8_100%)] px-4 py-4 shadow-[0_14px_30px_rgba(0,46,107,0.10)] md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold leading-tight text-slate-900">
              Favorites
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1.5 text-[#17427a]">
                {mockFavorites.length} items
              </span>
              <span className="rounded-full border border-[#ffe3bf] bg-[#fff7ec] px-3 py-1.5 text-[#8f5b1f]">
                {followedShops.length} shops
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="rounded-xl border border-dashed border-[#c6d9ff] bg-[#f9fbff] px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Heart className="size-6" />
            </div>
            <h3 className="text-3xl font-semibold text-slate-900">No favorites yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Start browsing products and click the heart icon to save your favorites.
            </p>
            <button
              type="button"
              onClick={onBrowseProducts}
              className="mt-6 rounded-xl bg-[#002e6b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003d8f]"
            >
              Browse Products
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-5 overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[linear-gradient(120deg,#eef5ff_0%,#ffffff_52%,#fff7e8_100%)] px-4 py-4 shadow-[0_14px_30px_rgba(0,46,107,0.10)] md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold leading-tight text-slate-900">
            Favorites
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1.5 text-[#17427a]">
              {mockFavorites.length} items
            </span>
            <span className="rounded-full border border-[#ffe3bf] bg-[#fff7ec] px-3 py-1.5 text-[#8f5b1f]">
              {followedShops.length} shops
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ecf4ff] text-[#002e6b]">
          <Store className="size-3.5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">Visited Shops</p>
          <p className="text-xs text-slate-500">
            {followedShops.length} shops
          </p>
        </div>
      </div>

      <div className="mb-7 grid gap-4 md:grid-cols-3">
        {followedShops.map((shop) => (
          <article
            key={shop.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_22px_rgba(0,46,107,0.1)]"
          >
            <div className="h-24 bg-slate-100">
              {shop.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.bannerUrl}
                  alt={shop.shopName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[linear-gradient(120deg,#e9f1ff,#fff4df)]" />
              )}
            </div>
            <div className="space-y-2 p-3">
              <p className="text-sm font-semibold text-slate-900">{shop.shopName}</p>
              <p className="text-xs text-slate-500">{shop.shopType.replaceAll('_', ' ')}</p>
              <Link
                href={`/shops/${shop.subdomain}`}
                className="inline-flex rounded-full bg-[#002e6b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#003d8f]"
              >
                Visit Shop
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ecf4ff] text-[#002e6b]">
          <Heart className="size-3.5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">Saved Items</p>
          <p className="text-xs text-slate-500">{mockFavorites.length} items you love</p>
        </div>
      </div>

      <ProductGrid
        products={mockFavorites}
        favoriteKeys={favoriteKeys}
        onToggleFavorite={onToggleFavorite}
        onAddToCart={onAddToCart}
      />
    </>
  );
}

function CartView({
  mockCart,
  mockSubtotal,
  onRemoveItem,
  onClearCart,
}: {
  mockCart: MockCartEntry[];
  mockSubtotal: number;
  onRemoveItem: (itemKey: string) => void;
  onClearCart: () => void;
}) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+855');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'aba' | 'cod'>('aba');
  const [placedOrders, setPlacedOrders] = useState<Array<{ shopName: string; orderNo?: string; total: number }>>([]);

  const byShop = mockCart.reduce<Record<string, MockCartEntry[]>>((acc, item) => {
    if (!acc[item.shopName]) acc[item.shopName] = [];
    acc[item.shopName].push(item);
    return acc;
  }, {});

  const totalItems = mockCart.reduce((sum, item) => sum + item.qty, 0);
  const shipping = 2;

  const onCheckout = async () => {
    if (!customerName.trim() || !phoneNumber.trim() || !deliveryLocation.trim()) return;

    setIsPlacingOrder(true);
    try {
      const results: Array<{ shopName: string; orderNo?: string; total: number; success: boolean }> = [];

      for (const [shopName, entries] of Object.entries(byShop)) {
        const subdomain = entries[0]?.subdomain;
        if (!subdomain) continue;

        const shopTotal = entries.reduce((sum, item) => {
          const price = Number(item.price.replace('$', '')) || 0;
          return sum + price * item.qty;
        }, 0);

        const payload = {
          customer_name: customerName.trim(),
          customer_phone: phoneNumber.trim(),
          address_text: deliveryLocation.trim(),
          payment_method: paymentMethod === 'aba' ? 'aba_transfer' : 'cod',
          currency: 'USD',
          items: entries.map((item) => ({ product_id: item.id, qty: item.qty })),
        };

        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          const response = await fetch(buildCheckoutUrl(apiBase, subdomain), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Checkout failed for ${shopName}`);
          }

          const data = await response.json();
          results.push({
            shopName,
            orderNo: data?.order?.orderNo,
            total: shopTotal,
            success: true,
          });
        } catch (error) {
          console.error('[checkout] failed for shop', { shopName, error });
          results.push({ shopName, total: shopTotal, success: false });
        }
      }

      const successful = results.filter((item) => item.success);
      if (successful.length === 0) {
        alert('Checkout failed. Please try again.');
        return;
      }

      setPlacedOrders(successful);
      onClearCart();
      setIsCheckoutOpen(false);
      setIsSuccessOpen(true);
      setCustomerName('');
      setDeliveryLocation('');
      setPhoneNumber('+855');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (mockCart.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[radial-gradient(circle_at_top_right,_#edf4ff,_#f9fbff_55%,_#fff_100%)] px-6 py-14 text-center shadow-[0_16px_40px_rgba(0,46,107,0.10)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#dce9ff] blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-14 h-32 w-32 rounded-full bg-[#ffe7c9] blur-2xl opacity-60" />
        <div className="relative mx-auto max-w-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cfe0ff] bg-white shadow-sm">
            <ShoppingCart className="size-7 text-[#002e6b]" />
          </div>
          <h2 className="mt-5 font-[family:var(--font-dashboard-display)] text-3xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-slate-600">Products from all shops will appear here in one unified checkout.</p>
          <Link href="/shops" className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#002e6b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003d8f]">
            Explore all shops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_26px_rgba(0,46,107,0.08)]">
        <h1 className="font-[family:var(--font-dashboard-display)] text-2xl font-semibold text-[#002e6b]">Cart</h1>
        <p className="mt-1 text-xs text-slate-500">One checkout for products from one or many stores.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-3">
          {Object.entries(byShop).map(([shopName, entries]) => {
            const shopSubtotal = entries.reduce((sum, item) => {
              const price = Number(item.price.replace('$', '')) || 0;
              return sum + price * item.qty;
            }, 0);
            return (
              <article key={shopName} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(0,46,107,0.08)]">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{shopName}</p>
                    <p className="text-xs text-slate-500">{entries.length} item{entries.length > 1 ? 's' : ''}</p>
                  </div>
                  <Link href={`/shops/${entries[0].subdomain}`} className="text-xs font-semibold text-[#002e6b] hover:underline">View Store</Link>
                </div>

                <div className="space-y-3">
                  {entries.map((item) => (
                    <div key={`${item.subdomain}:${item.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.price} each • Qty {item.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#002e6b]">${((Number(item.price.replace('$', '')) || 0) * item.qty).toFixed(2)}</p>
                        <button type="button" onClick={() => onRemoveItem(`${item.subdomain}:${item.id}`)} className="mt-1 text-xs font-semibold text-[#c61c2f] hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3 text-right">
                  <span className="text-sm font-semibold text-[#002e6b]">Store Total: ${shopSubtotal.toFixed(2)}</span>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="relative self-start overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[radial-gradient(circle_at_top_right,_#edf4ff,_#ffffff_45%,_#f8fbff_100%)] p-5 shadow-[0_18px_48px_rgba(0,46,107,0.16)] lg:sticky lg:top-4 lg:min-h-[460px]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#dce9ff] blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-slate-900">Order Summary</p>
              <span className="rounded-full bg-[#ecf4ff] px-2.5 py-1 text-xs font-semibold text-[#002e6b]">{totalItems} items</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">From {Object.keys(byShop).length} store{Object.keys(byShop).length > 1 ? 's' : ''}</p>

            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900">${mockSubtotal.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Shipping</span><span className="font-semibold text-slate-900">${shipping.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Tax</span><span className="font-semibold text-slate-900">At checkout</span></div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-semibold text-[#002e6b]"><span>Total</span><span>${(mockSubtotal + shipping).toFixed(2)}</span></div>
            </div>

            <button type="button" onClick={() => setIsCheckoutOpen(true)} className="mt-4 w-full rounded-xl bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f]">Proceed to Checkout</button>
          </div>
        </aside>
      </div>

      {isCheckoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <button type="button" onClick={() => setIsCheckoutOpen(false)} className="absolute right-5 top-5 text-slate-400 transition hover:text-slate-600" aria-label="Close checkout" title="Close checkout">
              <X className="size-5" />
            </button>

            <div className="p-6 sm:p-8">
              <h2 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold text-slate-900">Complete Your Orders</h2>
              <p className="mt-2 text-sm text-slate-500">Single checkout for {Object.keys(byShop).length} store{Object.keys(byShop).length > 1 ? 's' : ''}.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Full Name <span className="text-[#c61c2f]">*</span></label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#002e6b] focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Phone Number <span className="text-[#c61c2f]">*</span></label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 focus-within:border-[#002e6b] focus-within:bg-white transition">
                    <Phone className="size-4 text-slate-400" />
                    <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+855 12 345 678" className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Delivery Location <span className="text-[#c61c2f]">*</span></label>
                  <div className="flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 focus-within:border-[#002e6b] focus-within:bg-white transition">
                    <MapPin className="mt-1 size-4 text-slate-400" />
                    <textarea value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} placeholder="Enter your delivery address or Google Maps link" className="h-20 w-full resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Payment Method <span className="text-[#c61c2f]">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPaymentMethod('aba')} className={cn('rounded-xl border p-3 text-left transition', paymentMethod === 'aba' ? 'border-[#002e6b] bg-[#ecf4ff]' : 'border-slate-200 bg-white hover:bg-slate-50')}>
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><Wallet className="size-4" /> ABA Bank</p>
                    </button>
                    <button type="button" onClick={() => setPaymentMethod('cod')} className={cn('rounded-xl border p-3 text-left transition', paymentMethod === 'cod' ? 'border-[#002e6b] bg-[#ecf4ff]' : 'border-slate-200 bg-white hover:bg-slate-50')}>
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><CreditCard className="size-4" /> Cash on Delivery</p>
                    </button>
                  </div>
                </div>

                <button type="button" onClick={onCheckout} disabled={!customerName.trim() || !phoneNumber.trim() || !deliveryLocation.trim() || isPlacingOrder} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f] disabled:cursor-not-allowed disabled:opacity-50">
                  {isPlacingOrder ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <ShoppingCart className="size-4" />}
                  {isPlacingOrder ? 'Placing Orders...' : 'Place Orders'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSuccessOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ecf4ff]">
              <CheckCircle2 className="size-8 text-[#002e6b]" />
            </div>
            <h3 className="mt-4 text-center font-[family:var(--font-dashboard-display)] text-2xl font-semibold text-slate-900">Orders placed successfully</h3>
            <p className="mt-2 text-center text-sm text-slate-500">Your global checkout is complete. Sellers will contact you soon.</p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Created Orders</p>
              <div className="mt-2 space-y-2">
                {placedOrders.map((order) => (
                  <div key={`${order.shopName}-${order.orderNo ?? 'na'}`} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{order.shopName}</p>
                      {order.orderNo ? <p className="text-xs text-slate-500">{order.orderNo}</p> : null}
                    </div>
                    <p className="font-semibold text-[#002e6b]">${order.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setIsSuccessOpen(false)} className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f]">
              Continue shopping
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProductGrid({
  products,
  badgeLabel,
  favoriteKeys,
  onToggleFavorite,
  onAddToCart,
}: {
  products: DirectoryProduct[];
  badgeLabel?: string;
  favoriteKeys?: Set<string>;
  onToggleFavorite?: (product: DirectoryProduct) => void;
  onAddToCart?: (product: DirectoryProduct) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No products available yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => {
        const favoriteKey = buildFavoriteKey(product);
        const isFavorite = favoriteKeys?.has(favoriteKey) ?? false;

        return (
          <article
            key={`${product.subdomain}-${product.id}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(0,46,107,0.08)]"
          >
            <div className="relative aspect-[4/3] bg-slate-100">
              {onToggleFavorite ? (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(product)}
                  className={`absolute right-2 top-2 z-10 rounded-full border p-2 backdrop-blur transition ${
                    isFavorite
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-white/80 bg-white/90 text-slate-600 hover:bg-white'
                  }`}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`size-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              ) : null}
              <Link
                href={`/shops/${product.subdomain}`}
                aria-label={`View details for ${product.name}`}
                className="block h-full w-full"
              >
                {product.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </Link>
            </div>
            <div className="space-y-2 p-3">
              <div className="rounded-xl border border-[#d6e6ff] bg-[linear-gradient(135deg,#f7fbff,#eef5ff)] px-2.5 py-2">
                <p className="line-clamp-1 text-xs font-semibold text-[#17427a]">
                  {product.shopName || 'Unknown Shop'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {product.category
                    ? product.category.replaceAll('_', ' ')
                    : 'General'}
                </span>
              </div>
              <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{product.name}</h3>
              <p className="text-sm font-semibold text-[#002e6b]">
                {product.basePriceUsd
                  ? `$${Number(product.basePriceUsd).toFixed(2)}`
                  : '$0.00'}
              </p>
              <div className="flex items-center justify-between">
                {badgeLabel ? (
                  <span className="rounded-full bg-[#c61c2f]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c61c2f]">
                    {badgeLabel}
                  </span>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => onAddToCart?.(product)}
                  className="inline-flex rounded-lg bg-[#002e6b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003d8f]"
                >
                  Add
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
