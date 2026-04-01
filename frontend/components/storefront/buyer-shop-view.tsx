"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Compass, CreditCard, Heart, MapPin, MessageCircle, Phone, Send, ShoppingCart, Sparkles, Star, Store, Truck, Wallet, X } from 'lucide-react';

import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { StorefrontProduct, StorefrontStore } from '@/lib/storefront';

type BuyerShopViewProps = {
	store: StorefrontStore;
	products: StorefrontProduct[];
	activeTab: 'explore' | 'favorites' | 'cart' | 'assistant';
};

type ProductCard = {
	id: string;
	subdomain: string;
	shopName: string;
	category: string;
	name: string;
	price: string;
	imageUrl: string;
	description: string;
};

type FavoriteEntry = ProductCard;

type CartEntry = ProductCard & {
	qty: number;
};

const FAVORITES_STORAGE_KEY = 'coolhat.buyer.favorites.global.entries';
const CART_STORAGE_KEY = 'coolhat.buyer.cart.global.entries';
const ASSISTANT_SESSION_STORAGE_KEY = 'coolhat.assistant.session_id';
const ASSISTANT_ANON_STORAGE_KEY = 'coolhat.assistant.anonymous_id';

function sanitizeProductDescription(description: string | null | undefined): string {
	const raw = typeof description === 'string' ? description.trim() : '';
	if (!raw) return 'Carefully selected by our store team for you.';

	// Remove FAQ section and explicit Q1/Q2... question fragments from product descriptions.
	const withoutFaqSection = raw.replace(/\bFAQs?\s*:\s*[\s\S]*$/i, '').trim();
	const withoutQuestionItems = withoutFaqSection
		.replace(/\bQ\d+\s*:\s*[^.?!]*(?:[.?!]|$)/gi, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();

	return withoutQuestionItems || 'Carefully selected by our store team for you.';
}

function buildKey(subdomain: string, productId: string) {
	return `${subdomain}:${productId}`;
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

function isProductCard(value: unknown): value is ProductCard {
	if (!value || typeof value !== 'object') return false;
	const item = value as Record<string, unknown>;
	return (
		typeof item.id === 'string' &&
		typeof item.subdomain === 'string' &&
		typeof item.shopName === 'string' &&
		(typeof item.category === 'string' || typeof item.category === 'undefined') &&
		typeof item.name === 'string' &&
		typeof item.price === 'string' &&
		typeof item.imageUrl === 'string' &&
		typeof item.description === 'string'
	);
}

function sanitizeFavoriteEntries(raw: unknown): FavoriteEntry[] {
	if (!Array.isArray(raw)) return [];
	return raw.filter(isProductCard);
}

function sanitizeCartEntries(raw: unknown): CartEntry[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((value): value is CartEntry => {
			if (!value || typeof value !== 'object') return false;
			const item = value as Record<string, unknown>;
			const qty = item.qty;
			return isProductCard(item) && typeof qty === 'number' && qty > 0;
		})
		.map((item) => ({ ...item, qty: Math.max(1, Math.floor(item.qty)) }));
}

function readFavoriteEntriesFromStorage(): FavoriteEntry[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
		if (!raw) return [];
		return sanitizeFavoriteEntries(JSON.parse(raw));
	} catch {
		return [];
	}
}

function readCartEntriesFromStorage(): CartEntry[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(CART_STORAGE_KEY);
		if (!raw) return [];
		return sanitizeCartEntries(JSON.parse(raw));
	} catch {
		return [];
	}
}

export function BuyerShopView({ store, products, activeTab }: BuyerShopViewProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentTab, setCurrentTab] = useState<'explore' | 'favorites' | 'cart' | 'assistant'>(activeTab);
	const [globalChatOpen, setGlobalChatOpen] = useState(false);
	const [globalChatInput, setGlobalChatInput] = useState('');
	const [assistantSessionId, setAssistantSessionId] = useState<string | null>(null);
	const [assistantAnonymousId, setAssistantAnonymousId] = useState<string | null>(null);
	const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
	const [showAddressModal, setShowAddressModal] = useState(false);
	const contentScrollRef = useRef<HTMLElement | null>(null);
	const [favoriteEntries, setFavoriteEntries] = useState<FavoriteEntry[]>(() => readFavoriteEntriesFromStorage());
	const [cartEntries, setCartEntries] = useState<CartEntry[]>(() => readCartEntriesFromStorage());

	useEffect(() => {
		window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteEntries));
	}, [favoriteEntries]);

	useEffect(() => {
		window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartEntries));
	}, [cartEntries]);

	useEffect(() => {
		setCurrentTab(activeTab);
	}, [activeTab]);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const storedSession = window.localStorage.getItem(ASSISTANT_SESSION_STORAGE_KEY);
		if (storedSession?.trim()) {
			setAssistantSessionId(storedSession.trim());
		}

		const storedAnonymousId = window.localStorage.getItem(ASSISTANT_ANON_STORAGE_KEY);
		if (storedAnonymousId?.trim()) {
			setAssistantAnonymousId(storedAnonymousId.trim());
			return;
		}

		const createdAnonymousId =
			typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
				? crypto.randomUUID()
				: `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		window.localStorage.setItem(ASSISTANT_ANON_STORAGE_KEY, createdAnonymousId);
		setAssistantAnonymousId(createdAnonymousId);
	}, []);

	const handleAssistantSessionUpdate = (sessionId: string | null) => {
		setAssistantSessionId(sessionId);
		if (typeof window === 'undefined') return;
		if (sessionId?.trim()) {
			window.localStorage.setItem(ASSISTANT_SESSION_STORAGE_KEY, sessionId);
		} else {
			window.localStorage.removeItem(ASSISTANT_SESSION_STORAGE_KEY);
		}
	};

	useEffect(() => {
		const syncGlobalState = () => {
			setFavoriteEntries(readFavoriteEntriesFromStorage());
			setCartEntries(readCartEntriesFromStorage());
		};

		const onStorage = (event: StorageEvent) => {
			if (event.key === FAVORITES_STORAGE_KEY || event.key === CART_STORAGE_KEY) {
				syncGlobalState();
			}
		};

		window.addEventListener('storage', onStorage);
		window.addEventListener('focus', syncGlobalState);
		document.addEventListener('visibilitychange', syncGlobalState);

		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('focus', syncGlobalState);
			document.removeEventListener('visibilitychange', syncGlobalState);
		};
	}, []);

	const productCards = useMemo<ProductCard[]>(
		() =>
			products
				.filter((item) => item.isActive)
				.map((item) => ({
					id: item.id,
					subdomain: store.subdomain,
					shopName: store.shopName,
					category: item.category ?? store.shopType ?? 'General',
					name: item.name,
					price: item.basePriceUsd ? `$${Number(item.basePriceUsd).toFixed(2)}` : '$0.00',
					imageUrl: item.imageUrls[0] ?? store.bannerUrl ?? store.logoUrl ?? '',
					description: sanitizeProductDescription(item.description),
				})),
		[products, store.bannerUrl, store.logoUrl, store.shopName, store.shopType, store.subdomain],
	);


	const featured = productCards.find((product) => product.id === selectedProductId) ?? productCards[0] ?? {
		id: 'fallback',
		subdomain: store.subdomain,
		shopName: store.shopName,
		category: store.shopType ?? 'General',
		name: 'Featured Product',
		price: '$0.00',
		imageUrl: store.bannerUrl ?? store.logoUrl ?? '',
		description: 'This shop is setting up products. Check back soon.',
	};

	const favoriteProducts = favoriteEntries;

	const cartProducts = cartEntries;
	const cartTotal = cartProducts.reduce((sum, item) => {
		const price = Number(item.price.replace('$', ''));
		return sum + (Number.isFinite(price) ? price * item.qty : 0);
	}, 0);

	const favoriteKeys = useMemo(
		() => new Set(favoriteEntries.map((item) => buildKey(item.subdomain, item.id))),
		[favoriteEntries],
	);

	const onToggleFavorite = (product: ProductCard) => {
		const key = buildKey(product.subdomain, product.id);
		setFavoriteEntries((prev) => {
			const exists = prev.some((item) => buildKey(item.subdomain, item.id) === key);
			if (exists) return prev.filter((item) => buildKey(item.subdomain, item.id) !== key);
			return [product, ...prev];
		});
	};

	const onAddToCart = (product: ProductCard) => {
		const key = buildKey(product.subdomain, product.id);
		setCartEntries((prev) => {
			const index = prev.findIndex((item) => buildKey(item.subdomain, item.id) === key);
			if (index === -1) return [{ ...product, qty: 1 }, ...prev];
			const next = [...prev];
			next[index] = { ...next[index], qty: next[index].qty + 1 };
			return next;
		});
	};

	const onRemoveFromCart = (product: ProductCard) => {
		const key = buildKey(product.subdomain, product.id);
		setCartEntries((prev) => prev.filter((item) => buildKey(item.subdomain, item.id) !== key));
	};

	const onSelectProduct = (product: ProductCard) => {
		contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
		setSelectedProductId(product.id);
	};

	const shopDescription =
		store.description?.trim() ||
		`Premium ${store.shopType.toLowerCase()} products curated for quality and trust.`;
	const shopLocation = store.addressText?.trim() || 'Phnom Penh, Cambodia';
	const shopCategoryLabel = (store.shopType || 'General').replaceAll('_', ' ');

	const links = [
		{
			key: 'explore',
			label: 'Browse Products',
			href: '#',
			icon: <Compass className="size-4 flex-shrink-0 text-slate-700" />,
		},
		{
			key: 'favorites',
			label: 'Favorites',
			href: '#',
			icon: <Heart className="size-4 flex-shrink-0 text-slate-700" />,
		},
		{
			key: 'cart',
			label: 'Cart',
			href: '#',
			icon: <ShoppingCart className="size-4 flex-shrink-0 text-slate-700" />,
		},
		{
			key: 'assistant',
			label: 'AI Concierge',
			href: '#',
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
								{sidebarOpen ? <p className="text-sm font-semibold">CoolHat AI</p> : null}
							</div>

							<div className="space-y-2">
								{links.map((link) => {
									const isActive = currentTab === link.key;
									return (
										<SidebarLink
											key={link.key}
											onClick={(event) => {
												event.preventDefault();
												setCurrentTab(link.key);
											}}
											link={{ label: link.label, href: link.href, icon: link.icon }}
											active={isActive}
											className={cn(
												'border border-transparent bg-white/70 backdrop-blur-sm',
												isActive
													? 'border-[#002e6b]/20 bg-[#002e6b] text-white shadow-[0_10px_20px_rgba(0,46,107,0.22)] hover:bg-[#002e6b]'
													: 'text-slate-800 hover:border-[#cfe0ff] hover:bg-[#f5f9ff]'
											)}
										/>
									);
								})}
							</div>

							<div className="mt-6 border-t border-slate-200 pt-4">
								<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
									Shops
								</p>
								<div className="mt-3 grid grid-cols-2 gap-2">
									<Link href={`/shops/${store.subdomain}`} title={`Visit ${store.shopName}`} className="group relative h-16 overflow-hidden rounded-lg border border-slate-200">
										{store.bannerUrl || store.logoUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={store.bannerUrl || store.logoUrl || ''}
												alt={store.shopName}
												className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
											/>
										) : (
											<div className="h-full w-full bg-[linear-gradient(120deg,#e9f1ff,#fff4df)]" />
										)}
										<div className="absolute inset-0 bg-black/35" />
										<div className="absolute inset-x-2 bottom-2">
											<p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
												{store.shopName}
											</p>
											<p className="line-clamp-1 text-[10px] text-white/85">
												Category: {shopCategoryLabel}
											</p>
										</div>
									</Link>
								</div>
							</div>
						</div>
					</SidebarBody>
				</Sidebar>

				<section
					ref={contentScrollRef}
					className={cn(
						'min-w-0 flex-1 pr-1',
						currentTab === 'assistant'
							? 'h-[calc(100dvh-1.5rem)] overflow-hidden'
							: 'max-h-[calc(100dvh-1.5rem)] overflow-y-auto',
					)}
				>
					<div className={cn('space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(0,46,107,0.08)] md:p-6', currentTab === 'assistant' && 'flex h-full min-h-0 flex-col')}>
						{currentTab === 'explore' ? (
							<div className="relative overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[radial-gradient(circle_at_88%_72%,rgba(78,145,214,0.18),transparent_36%),linear-gradient(135deg,#eef5ff_0%,#ffffff_40%,#fff6e8_100%)] p-5 text-[#002e6b] shadow-[0_18px_45px_rgba(0,46,107,0.15)] md:p-8">
								<div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#d7e7ff] blur-3xl" />
								<div className="pointer-events-none absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-[#ffe8cc]/70 blur-2xl" />
								<div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
									<div className="flex items-start gap-4 md:gap-5">
										<div className="flex h-[78px] w-[78px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/90 bg-gradient-to-br from-white to-[#f0f8ff] text-4xl font-bold text-[#002e6b] shadow-lg md:h-[94px] md:w-[94px]">
											{store.logoUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={store.logoUrl} alt={store.shopName} className="h-full w-full object-cover" />
											) : (
												<span className="uppercase">{store.shopName.slice(0, 1)}</span>
											)}
										</div>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<h1 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">{store.shopName}</h1>
												<span className="inline-flex items-center gap-1 rounded-full bg-[#ecf4ff] px-2.5 py-1 text-xs font-semibold text-[#002e6b] border border-[#002e6b]/10">
													<CheckCircle2 className="size-3.5" /> Verified
												</span>
											</div>
											<p className="mt-2 max-w-4xl line-clamp-2 text-sm leading-7 text-slate-600 md:text-base">{shopDescription}</p>
											<div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
												<span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {shopLocation}</span>
												<span>•</span>
												<span>Joined {store.shopType}</span>
											</div>
										</div>
									</div>
									<Link
										href="/shops"
										className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-lg font-semibold text-[#002e6b] shadow-md transition hover:bg-slate-100 md:min-w-[190px]"
									>
										Back
									</Link>
								</div>
							</div>
						) : null}
						{currentTab === 'explore' ? (
							<ExplorePanel
								store={store}
								featured={featured}
								popular={productCards}
								favoriteKeys={favoriteKeys}
								onToggleFavorite={onToggleFavorite}
								onAddToCart={onAddToCart}
								onSelectProduct={onSelectProduct}
								assistantSessionId={assistantSessionId}
								assistantAnonymousId={assistantAnonymousId}
								onAssistantSessionUpdate={handleAssistantSessionUpdate}
								showAddressModal={showAddressModal}
								onOpenAddressModal={() => setShowAddressModal(true)}
								onCloseAddressModal={() => setShowAddressModal(false)}
								cartEntries={cartEntries}
								setCartEntries={setCartEntries}
							/>
						) : null}

						{currentTab === 'favorites' ? (
							<FavoritesPanel
								items={favoriteProducts}
								onToggleFavorite={onToggleFavorite}
								favoriteKeys={favoriteKeys}
								onAddToCart={onAddToCart}
								onSelectProduct={onSelectProduct}
							/>
						) : null}

						{currentTab === 'cart' ? (
							<CartPanel items={cartProducts} total={cartTotal} onRemoveFromCart={onRemoveFromCart} onClearCart={() => setCartEntries([])} />
						) : null}

						{currentTab === 'assistant' ? <GlobalAssistantWorkspace /> : null}
					</div>
				</section>
			</div>

			{currentTab === 'favorites' || currentTab === 'cart' ? (
				<div className="fixed bottom-4 right-4 z-40">
					<GlobalQueryChatWidget
						open={globalChatOpen}
						onToggle={() => setGlobalChatOpen((value) => !value)}
						onClose={() => setGlobalChatOpen(false)}
						value={globalChatInput}
						onChange={setGlobalChatInput}
					/>
				</div>
			) : null}
		</main>
	);
}

function GlobalAssistantWorkspace() {
	const [input, setInput] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [messages, setMessages] = useState<Array<{ id: string; role: 'assistant' | 'user'; content: string; suggestedShops?: Array<{ shopName: string; subdomain: string; storeUrl: string; matchedProducts: string[] }> }>>([
		{
			id: 'global-assistant-welcome',
			role: 'assistant',
			content: 'Ask me anything across all shops. I can suggest products and where to buy them.',
		},
	]);

	const onSend = async () => {
		const question = input.trim();
		if (!question || isSending) return;

		setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: question }]);
		setInput('');
		setIsSending(true);

		try {
			const response = await fetch('/api/storefront/assistant/global', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question }),
			});

			const payload = (await response.json().catch(() => ({}))) as {
				answer?: string;
				message?: string;
				suggested_shops?: Array<{ shopName: string; subdomain: string; storeUrl: string; matchedProducts: string[] }>;
			};

			if (!response.ok) {
				throw new Error(payload.message || 'Unable to get assistant response right now.');
			}

			const answer =
				typeof payload.answer === 'string' && payload.answer.trim()
					? payload.answer.trim()
					: 'I could not find enough context. Please try rephrasing your question.';

			setMessages((prev) => [
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
			setMessages((prev) => [...prev, { id: `assistant-error-${Date.now()}`, role: 'assistant', content: errorMessage }]);
		} finally {
			setIsSending(false);
		}
	};

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
							onClick={() => setInput(prompt)}
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
								value={input}
								onChange={(event) => setInput(event.target.value)}
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
								disabled={!input.trim() || isSending}
								className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#002e6b,#1a4f8f)] text-white transition hover:bg-[#003d8f] disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Send global question"
								title="Send global question"
							>
								<Send className="size-4" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function ExplorePanel({
	store,
	featured,
	popular,
	favoriteKeys,
	onToggleFavorite,
	onAddToCart,
	onSelectProduct,
	assistantSessionId,
	assistantAnonymousId,
	onAssistantSessionUpdate,
	showAddressModal,
	onOpenAddressModal,
	onCloseAddressModal,
	cartEntries,
	setCartEntries,
}: {
	store: StorefrontStore;
	featured: ProductCard;
	popular: ProductCard[];
	favoriteKeys: Set<string>;
	onToggleFavorite: (product: ProductCard) => void;
	onAddToCart: (product: ProductCard) => void;
	onSelectProduct: (product: ProductCard) => void;
	assistantSessionId: string | null;
	assistantAnonymousId: string | null;
	onAssistantSessionUpdate: (sessionId: string | null) => void;
	showAddressModal: boolean;
	onOpenAddressModal: () => void;
	onCloseAddressModal: () => void;
	cartEntries: CartEntry[];
	setCartEntries: (entries: CartEntry[]) => void;
}) {
	const [featuredQty, setFeaturedQty] = useState(1);
	const [isProductChatOpen, setIsProductChatOpen] = useState(false);
	const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
	const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState('+855');
	const [deliveryLocation, setDeliveryLocation] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<'aba' | 'cod'>('aba');
	const [isPlacingOrder, setIsPlacingOrder] = useState(false);
	const [isAskingProductAssistant, setIsAskingProductAssistant] = useState(false);
	const [placedOrders, setPlacedOrders] = useState<Array<{ shopName: string; orderId: string; orderNo?: string; items: CartEntry[]; total: number }>>([]);
	const [productChatInput, setProductChatInput] = useState('');
	const [productChatMessages, setProductChatMessages] = useState<Array<{ id: string; role: 'assistant' | 'user'; content: string }>>([
		{
			id: 'product-assistant-welcome',
			role: 'assistant',
			content: `Ask me anything about ${featured.name} in ${store.shopName}.`,
		},
	]);
	const moreFromStore = popular.slice(0, 1);
	const recommended = popular.slice(1, 2);
	const unitPrice = Number(featured.price.replace('$', '')) || 0;
	const orderTotal = (unitPrice * featuredQty).toFixed(2);

	const handleAddFeaturedToCart = () => {
		for (let i = 0; i < featuredQty; i++) {
			onAddToCart(featured);
		}
		setFeaturedQty(1);
	};

	const handleSendProductQuestion = async () => {
		const question = productChatInput.trim();
		if (!question) return;

		const userMessage = {
			id: `user-${Date.now()}`,
			role: 'user' as const,
			content: question,
		};

		setProductChatMessages((prev) => [...prev, userMessage]);
		setProductChatInput('');
		setIsAskingProductAssistant(true);

		try {
			const response = await fetch('/api/storefront/assistant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subdomain: store.subdomain,
					question,
					session_id: assistantSessionId ?? undefined,
					anonymous_id: assistantAnonymousId ?? undefined,
				}),
			});

			const payload = (await response.json().catch(() => ({}))) as {
				session_id?: string;
				answer?: string;
				message?: string;
			};

			if (!response.ok) {
				throw new Error(payload.message || 'Unable to get assistant response right now.');
			}

			if (typeof payload.session_id === 'string' && payload.session_id.trim()) {
				onAssistantSessionUpdate(payload.session_id);
			}

			const answer =
				typeof payload.answer === 'string' && payload.answer.trim()
					? payload.answer.trim()
					: 'I could not find enough context. Please try rephrasing your question.';

			setProductChatMessages((prev) => [
				...prev,
				{
					id: `assistant-${Date.now()}`,
					role: 'assistant',
					content: answer,
				},
			]);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unable to reach assistant.';
			setProductChatMessages((prev) => [
				...prev,
				{
					id: `assistant-error-${Date.now()}`,
					role: 'assistant',
					content: errorMessage,
				},
			]);
		} finally {
			setIsAskingProductAssistant(false);
		}
	};

	const handlePlaceOrder = async () => {
		if (!phoneNumber.trim() || !deliveryLocation.trim()) return;
		
		setIsPlacingOrder(true);
		try {
			// Group cart items by subdomain/shop
			const itemsByShop: Record<string, CartEntry[]> = cartEntries.reduce((acc: Record<string, CartEntry[]>, item: CartEntry) => {
				if (!acc[item.subdomain]) {
					acc[item.subdomain] = [];
				}
				acc[item.subdomain].push(item);
				return acc;
			}, {});

			// If no cart items, add the featured item for single checkout
			if (Object.keys(itemsByShop).length === 0) {
				const shopKey = featured.subdomain;
				itemsByShop[shopKey] = [{ ...featured, qty: featuredQty }];
			}

			const results: Array<{ shopName: string; orderId: string; orderNo?: string; items: CartEntry[]; total: number; success: boolean; error?: string }> = [];

			// Process checkout for each shop
			for (const [subdomain, items] of Object.entries(itemsByShop)) {
				const shopItem = items[0];
				const shopName = shopItem.shopName;

				// Calculate total for this shop
				const shopTotal = items.reduce((sum: number, item: CartEntry) => {
					const price = Number(item.price.replace('$', ''));
					return sum + (Number.isFinite(price) ? price * item.qty : 0);
				}, 0);

				// Prepare checkout payload
				const checkoutPayload = {
					customer_name: phoneNumber.trim().split(' ')[0] || 'Customer', // Use first part of phone as name for now
					customer_phone: phoneNumber.trim(),
					address_text: deliveryLocation.trim(),
					payment_method: paymentMethod === 'aba' ? 'aba_transfer' : 'cod',
					currency: 'USD',
					items: items.map((item: CartEntry) => ({
						product_id: item.id,
						qty: item.qty,
					})),
				};

				try {
					// Construct API URL for this shop's subdomain
					const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
					const response = await fetch(buildCheckoutUrl(apiBase, subdomain), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(checkoutPayload),
					});

					if (!response.ok) {
						const error = await response.json().catch(() => ({}));
						throw new Error(error.message || `Checkout failed for ${shopName}`);
					}

					const data = await response.json();
					results.push({
						shopName,
						orderId: data.order?.id || `order-${Date.now()}`,
						orderNo: data.order?.orderNo,
						items,
						total: shopTotal,
						success: true,
					});
				} catch (error) {
					results.push({
						shopName,
						orderId: `failed-${Date.now()}`,
						items,
						total: shopTotal,
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error occurred',
					});
				}
			}

			// Check if all orders succeeded
			const successfulOrders = results.filter((r) => r.success);
			const failedOrders = results.filter((r) => !r.success);

			if (successfulOrders.length > 0) {
				setPlacedOrders(successfulOrders);
				
				// Clear cart on success
				if (successfulOrders.length === Object.keys(itemsByShop).length) {
					setCartEntries([]);
				}

				setIsBuyNowOpen(false);
				setIsOrderSuccessOpen(true);
				setDeliveryLocation('');
				setPhoneNumber('+855');

				if (failedOrders.length > 0) {
					console.warn('Some orders failed:', failedOrders);
				}
			} else {
				alert('Unable to place orders. Please try again.');
			}
		} catch (error) {
			console.error('Checkout error:', error);
			alert('An error occurred during checkout. Please try again.');
		} finally {
			setIsPlacingOrder(false);
		}
	};

	return (
			<div className="space-y-7">
				<div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
					<div className="space-y-3">
					<div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
						{featured.imageUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={featured.imageUrl} alt={featured.name} className="h-full w-full object-cover" />
						) : (
							<div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500">No image</div>
						)}
					</div>
						<div>
							<p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
								Quick Preview
							</p>
							<div className="grid grid-cols-4 gap-2">
								{[featured, ...popular.slice(1, 4)].map((item) => (
									<div key={`${item.id}-thumb`} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
										<div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
											{item.imageUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
											) : (
												<div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
											)}
										</div>
										<p className="mt-1 line-clamp-1 text-[10px] font-medium text-slate-600">
											{item.name}
										</p>
									</div>
								))}
							</div>
						</div>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<span className="rounded-full bg-[#ecf4ff] px-3 py-1 text-xs font-semibold text-[#002e6b]">{store.shopType}</span>
						<span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600">English</span>
					</div>
					<h1 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold text-slate-900">{featured.name}</h1>
					<div className="flex items-center gap-2 text-sm text-slate-500">
						<Star className="size-4 fill-[#f5b301] text-[#f5b301]" />
						<span>4.8</span>
						<span>342 ratings</span>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-4">
					<div className="flex items-center gap-2">
						<Truck className="size-5 text-[#002e6b]" />
						<p className="text-sm font-semibold text-slate-900"><strong>Shipping</strong></p>
					</div>
					<p className="mt-2 text-sm text-slate-600">Calculated at checkout. Add your address to see shipping options and costs.</p>
					<button
						type="button"
						onClick={onOpenAddressModal}
						className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#002e6b] hover:underline"
					>
						<MapPin className="size-4" />
						Add address for shipping details
					</button>
					</div>

					<p className="text-3xl font-semibold text-[#002e6b]">{featured.price}</p>
					<p className="text-sm leading-6 text-slate-600">{featured.description}</p>

					<div className="space-y-3">
						<div>
							<p className="mb-3 text-sm font-semibold text-slate-900">Quantity</p>
							<div className="flex items-center gap-4">
								<div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white">
									<button
										type="button"
										onClick={() => setFeaturedQty(Math.max(1, featuredQty - 1))}
										className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 transition"
									>
										-
									</button>
									<span className="w-8 text-center font-semibold text-slate-900">{featuredQty}</span>
									<button
										type="button"
										onClick={() => setFeaturedQty(featuredQty + 1)}
										className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100 transition"
									>
										+
									</button>
								</div>
								<p className="text-xs text-slate-500">in stock</p>
							</div>
						</div>

						<button type="button" onClick={handleAddFeaturedToCart} className="w-full rounded-lg bg-[#002e6b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#003d8f] transition">Add to cart</button>
						<button type="button" onClick={() => setIsBuyNowOpen(true)} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition">Buy now</button>
						<button
							type="button"
							onClick={() => setIsProductChatOpen((current) => !current)}
							className="mx-auto w-[92%] sm:w-[85%] rounded-xl border border-[#002e6b]/20 bg-[linear-gradient(135deg,#002e6b,#1f4f88)] px-4 py-3 text-left text-white shadow-[0_16px_38px_rgba(0,46,107,0.32)] hover:from-[#003d8f] hover:to-[#2a5fb8] transition"
						>
							<span className="flex items-center justify-between">
								<span className="inline-flex items-center gap-2 text-sm font-semibold">
									<MessageCircle className="size-4" />
									{isProductChatOpen ? 'Hide AI Shopping Help' : 'Get AI Shopping Help'}
								</span>
								<span className="inline-flex h-2 w-2 rounded-full bg-[#9ed0ff] animate-pulse" />
							</span>
							<span className="mt-1 block text-xs text-white/80">Ask details about price, stock, delivery, and sizes.</span>
						</button>
					</div>
					</div>
			</div>

			<SectionList title={`More from ${store.shopName}`} items={moreFromStore} favoriteKeys={favoriteKeys} onToggleFavorite={onToggleFavorite} onAddToCart={onAddToCart} onSelectProduct={onSelectProduct} />
			<SectionList title="Recommended Products" items={recommended} favoriteKeys={favoriteKeys} onToggleFavorite={onToggleFavorite} onAddToCart={onAddToCart} onSelectProduct={onSelectProduct} />
			<SectionList title="Popular Products" items={popular} favoriteKeys={favoriteKeys} onToggleFavorite={onToggleFavorite} onAddToCart={onAddToCart} onSelectProduct={onSelectProduct} showViewAll />

			{isProductChatOpen ? (
				<div className="fixed bottom-20 right-5 z-40 flex h-[min(72vh,640px)] w-[min(calc(100vw-2rem),390px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
					<div className="flex items-center justify-between border-b border-slate-200 bg-[#002e6b] px-5 py-4 text-white">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Product Assistant</p>
							<p className="mt-1 text-lg font-semibold">{featured.name}</p>
							<p className="mt-1 text-sm text-white/75">Ask about this item in {store.shopName}</p>
						</div>
						<button
							type="button"
							onClick={() => setIsProductChatOpen(false)}
							className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition"
							aria-label="Close product assistant"
							title="Close product assistant"
						>
							<X className="size-4" />
						</button>
					</div>

					<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-4">
						{productChatMessages.slice(-8).map((message) => (
							<div
								key={message.id}
								className={cn(
									'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6',
									message.role === 'user'
										? 'ml-auto bg-[#002e6b] text-white'
										: 'bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]',
								)}
							>
								{message.content}
							</div>
						))}
					</div>

					<div className="border-t border-slate-200 bg-white px-4 py-4">
						<div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
							<textarea
								value={productChatInput}
								onChange={(event) => setProductChatInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' && !event.shiftKey) {
										event.preventDefault();
										handleSendProductQuestion();
									}
								}}
								placeholder="Ask about this product..."
								className="min-h-[56px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-900 caret-[#002e6b] outline-none placeholder:text-slate-400"
							/>
							<button
								type="button"
								onClick={handleSendProductQuestion}
								disabled={!productChatInput.trim() || isAskingProductAssistant}
								aria-label="Send product question"
								title="Send product question"
								className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#002e6b] text-white hover:bg-[#003d8f] disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Send className="size-4" />
							</button>
						</div>
					</div>
				</div>
			) : null}

			{isBuyNowOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
					<div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
						<button
							type="button"
							onClick={() => setIsBuyNowOpen(false)}
							className="absolute right-5 top-5 text-slate-400 transition hover:text-slate-600"
							aria-label="Close checkout"
							title="Close checkout"
						>
							<X className="size-5" />
						</button>

						<div className="p-6 sm:p-8">
							<h2 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold text-slate-900">
								{cartEntries.length > 0 ? 'Complete Your Orders' : 'Complete Your Order'}
							</h2>

							{cartEntries.length > 0 && (
								<div className="mt-4 rounded-lg border border-[#cfe0ff] bg-[#f9fbff] p-3">
									<p className="text-sm font-semibold text-[#002e6b]">
										📦 {(() => {
											const shops = new Set(cartEntries.map(item => item.subdomain));
											return `Ordering from ${shops.size} ${shops.size === 1 ? 'store' : 'stores'}`;
										})()}
									</p>
									<div className="mt-2 flex flex-wrap gap-2">
										{Array.from(new Set(cartEntries.map((item: CartEntry) => item.shopName))).map((shopName: string) => (
											<span key={shopName} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#002e6b] border border-[#cfe0ff]">
																{shopName as string}
											</span>
										))}
									</div>
								</div>
							)}

							{cartEntries.length === 0 && (
								<div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
									<p className="text-sm font-semibold text-slate-900">Order from</p>
									<div className="mt-3 flex items-center gap-3">
										<div className="h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-white">
											{featured.imageUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={featured.imageUrl} alt={featured.name} className="h-full w-full object-cover" />
											) : null}
										</div>
										<div className="min-w-0 flex-1">
											<p className="line-clamp-1 text-lg font-semibold text-slate-900">{featured.name}</p>
											<p className="text-sm text-slate-500">Qty: {featuredQty} x {featured.price}</p>
										</div>
										<p className="text-2xl font-semibold text-[#002e6b]">${orderTotal}</p>
									</div>
								</div>
							)}

							<p className="mt-5 text-sm text-slate-500">No account needed. Just provide your contact details to complete the order.</p>

							<div className="mt-4 space-y-4">
								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-900">Phone Number <span className="text-[#c61c2f]">*</span></label>
									<div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 focus-within:border-[#002e6b] focus-within:bg-white transition">
										<Phone className="size-4 text-slate-400" />
										<input
											type="tel"
											value={phoneNumber}
											onChange={(event) => setPhoneNumber(event.target.value)}
											placeholder="+855 12 345 678"
											className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
										/>
									</div>
									<p className="mt-1 text-xs text-slate-500">We&apos;ll call you to confirm your order</p>
								</div>

								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-900">Delivery Location <span className="text-[#c61c2f]">*</span></label>
									<div className="flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 focus-within:border-[#002e6b] focus-within:bg-white transition">
										<MapPin className="mt-1 size-4 text-slate-400" />
										<textarea
											value={deliveryLocation}
											onChange={(event) => setDeliveryLocation(event.target.value)}
											placeholder="Enter your delivery address or Google Maps link"
											className="h-20 w-full resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
										/>
									</div>
									<p className="mt-1 text-xs text-slate-500">Paste a Google Maps link or describe your location</p>
								</div>

								<div>
									<label className="mb-2 block text-sm font-semibold text-slate-900">Payment Method <span className="text-[#c61c2f]">*</span></label>
									<div className="grid grid-cols-2 gap-3">
										<button
											type="button"
											onClick={() => setPaymentMethod('aba')}
											className={cn(
												'rounded-xl border p-3 text-left transition',
												paymentMethod === 'aba' ? 'border-[#002e6b] bg-[#ecf4ff]' : 'border-slate-200 bg-white hover:bg-slate-50',
											)}
										>
											<p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><Wallet className="size-4" /> ABA Bank</p>
											<p className="mt-1 text-xs text-slate-500">Pay via ABA Mobile or KHQR</p>
										</button>
										<button
											type="button"
											onClick={() => setPaymentMethod('cod')}
											className={cn(
												'rounded-xl border p-3 text-left transition',
												paymentMethod === 'cod' ? 'border-[#002e6b] bg-[#ecf4ff]' : 'border-slate-200 bg-white hover:bg-slate-50',
											)}
										>
											<p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><CreditCard className="size-4" /> Cash on Delivery</p>
											<p className="mt-1 text-xs text-slate-500">Pay when you receive</p>
										</button>
									</div>
								</div>

								<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
									<p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><CheckCircle2 className="size-4 text-[#002e6b]" /> Payment Process</p>
									<ul className="mt-2 space-y-1 text-xs text-slate-600">
										<li>Seller will contact you to confirm the order.</li>
										<li>Follow payment instructions after confirmation.</li>
										<li>Share payment confirmation with the seller.</li>
									</ul>
								</div>

								<button
									type="button"
									onClick={handlePlaceOrder}
									disabled={!phoneNumber.trim() || !deliveryLocation.trim() || isPlacingOrder}
									className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f] disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isPlacingOrder ? (
										<>
											<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											Processing...
										</>
									) : (
										<>
											<ShoppingCart className="size-4" />
											Place Order
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			) : null}

			{isOrderSuccessOpen ? (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
					<div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
						<div className="p-6 sm:p-8">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ecf4ff]">
								<CheckCircle2 className="size-8 text-[#002e6b]" />
							</div>
							<h3 className="mt-4 text-center font-[family:var(--font-dashboard-display)] text-2xl font-semibold text-slate-900">
								{placedOrders.length === 1 ? 'Order placed successfully' : `${placedOrders.length} orders placed successfully`}
							</h3>
							<p className="mt-2 text-center text-sm text-slate-500">
								{placedOrders.length === 1 
									? 'Your order has been submitted. Sellers will contact you soon.' 
									: 'All your orders have been submitted. Sellers will contact you soon.'}
							</p>

							<div className="mt-6 space-y-4">
								{placedOrders.map((order, idx) => (
									<div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
										<div className="flex items-start justify-between gap-3 mb-3">
											<div>
												<p className="text-sm font-semibold text-slate-900">{order.shopName}</p>
												{order.orderNo && <p className="text-xs text-slate-500 mt-1">Order: {order.orderNo}</p>}
											</div>
											<p className="text-lg font-semibold text-[#002e6b]">${order.total.toFixed(2)}</p>
										</div>
										
										<div className="space-y-2 text-sm border-t border-slate-200 pt-3">
											{order.items.map((item, itemIdx) => (
												<div key={itemIdx} className="flex items-center justify-between">
													<div className="min-w-0 flex-1">
														<p className="line-clamp-1 text-sm text-slate-700">{item.name}</p>
														<p className="text-xs text-slate-500">Qty: {item.qty}</p>
													</div>
													<p className="text-sm font-medium text-slate-900 ml-2">${(Number(item.price.replace('$', '')) * item.qty).toFixed(2)}</p>
												</div>
											))}
										</div>
									</div>
								))}
							</div>

							<div className="mt-6 rounded-lg border border-slate-200 bg-[#ecf4ff] p-4">
								<p className="text-sm font-semibold text-[#002e6b]">What happens next?</p>
								<ul className="mt-2 space-y-2 text-xs text-slate-600">
									<li className="flex items-start gap-2">
										<span className="text-[#002e6b] font-bold mt-0.5">✓</span>
										<span>Sellers will contact you at {phoneNumber} to confirm</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-[#002e6b] font-bold mt-0.5">✓</span>
										<span>Delivery to: {deliveryLocation.substring(0, 50)}...</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-[#002e6b] font-bold mt-0.5">✓</span>
										<span>Payment: {paymentMethod === 'aba' ? 'ABA Bank Transfer' : 'Cash on Delivery'}</span>
									</li>
								</ul>
							</div>

							<button
								type="button"
								onClick={() => {
									setIsOrderSuccessOpen(false);
									setPlacedOrders([]);
									setPhoneNumber('+855');
									setDeliveryLocation('');
								}}
								className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f]"
							>
								Continue shopping
							</button>
						</div>
					</div>
				</div>
			) : null}

			{showAddressModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
						<button
							type="button"
							onClick={onCloseAddressModal}
							className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
						>
							<span className="text-2xl">×</span>
						</button>

						<div className="p-6 sm:p-8">
							<h2 className="font-[family:var(--font-dashboard-display)] text-2xl font-bold text-slate-900">Add Your Address</h2>
							<p className="mt-2 text-sm text-slate-500">Save your delivery information for faster checkout next time</p>

							<div className="mt-6 space-y-4">
								{/* Address Label */}
								<div>
									<label className="block text-sm font-semibold text-slate-900 mb-2">
										Address Label <span className="text-[#c61c2f]">*</span>
									</label>
									<input
										type="text"
										placeholder="Choose a label to identify this address"
										className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#002e6b] focus:bg-white focus:outline-none transition"
									/>
								</div>

								{/* Phone Number */}
								<div>
									<label className="block text-sm font-semibold text-slate-900 mb-2">
										Phone Number <span className="text-[#c61c2f]">*</span>
									</label>
									<div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 focus-within:border-[#002e6b] focus-within:bg-white transition">
										<span className="text-slate-400">📱</span>
										<input
											type="tel"
											placeholder="+855 12 345 678"
											className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
										/>
									</div>
									<p className="mt-1 text-xs text-slate-500">We&apos;ll call you to confirm your order</p>
								</div>

								{/* Delivery Address */}
								<div>
									<label className="block text-sm font-semibold text-slate-900 mb-2">
										Delivery Address <span className="text-[#c61c2f]">*</span>
									</label>
									<textarea
										placeholder="Enter your full delivery address or Google Maps link"
										className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#002e6b] focus:bg-white focus:outline-none transition resize-none h-20"
									/>
									<p className="mt-2 text-xs text-slate-600 bg-[#fffbeb] border border-[#fed7aa] rounded-lg p-2.5">
										<span className="font-semibold">💡 Tip:</span> Paste a Google Maps link or describe your location with landmarks
									</p>
									<p className="mt-2 text-xs text-slate-500">Example: Street 271, Sangkat Toul Tum Poung 1, Khan Chamkar Mon, Phnom Penh</p>
								</div>

								{/* Delivery Information */}
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
										<span>🛡️</span> Delivery Information:
									</p>
									<ul className="mt-2 space-y-2 text-xs text-slate-600">
										<li className="flex items-start gap-2">
											<span className="text-[#002e6b] font-bold mt-0.5">•</span>
											<span>Your address will be saved for future orders</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-[#002e6b] font-bold mt-0.5">•</span>
											<span>You can update or delete it anytime</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-[#002e6b] font-bold mt-0.5">•</span>
											<span>Your information is stored securely</span>
										</li>
									</ul>
								</div>

								{/* Save Button */}
								<button
									type="button"
									className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#003d8f] transition"
								>
									<span>💾</span>
									Save Address
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function GlobalQueryChatWidget({
	open,
	onToggle,
	onClose,
	value,
	onChange,
}: {
	open: boolean;
	onToggle: () => void;
	onClose: () => void;
	value: string;
	onChange: (value: string) => void;
}) {
	const [isSending, setIsSending] = useState(false);
	const [messages, setMessages] = useState<Array<{ id: string; role: 'assistant' | 'user'; content: string; suggestedShops?: Array<{ shopName: string; subdomain: string; storeUrl: string; matchedProducts: string[] }> }>>([
		{
			id: 'global-assistant-welcome',
			role: 'assistant',
			content: 'Ask me what to buy, compare items, or recommend from your cart and favorites.',
		},
	]);
	const AI_WIDGET_GUIDE_SEEN_KEY = 'coolhat.ai.widget.guide.seen';
	const [showGuide, setShowGuide] = useState(() => {
		if (typeof window === 'undefined') return false;
		return window.localStorage.getItem(AI_WIDGET_GUIDE_SEEN_KEY) !== '1';
	});
	const guidePrompts = ['Find a good deal under $20', 'Compare two similar products', 'Recommend a gift set'];

	const dismissGuide = () => {
		setShowGuide(false);
		window.localStorage.setItem(AI_WIDGET_GUIDE_SEEN_KEY, '1');
	};

	const sendGlobalQuestion = async () => {
		const question = value.trim();
		if (!question || isSending) return;

		setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: question }]);
		onChange('');
		setIsSending(true);

		try {
			const response = await fetch('/api/storefront/assistant/global', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question,
				}),
			});

			const payload = (await response.json().catch(() => ({}))) as {
				answer?: string;
				message?: string;
				suggested_shops?: Array<{ shopName: string; subdomain: string; storeUrl: string; matchedProducts: string[] }>;
			};

			if (!response.ok) {
				throw new Error(payload.message || 'Unable to get assistant response right now.');
			}

			const answer =
				typeof payload.answer === 'string' && payload.answer.trim()
					? payload.answer.trim()
					: 'I could not find enough context. Please try rephrasing your question.';

			setMessages((prev) => [
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
			setMessages((prev) => [...prev, { id: `assistant-error-${Date.now()}`, role: 'assistant', content: errorMessage }]);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="pointer-events-auto flex flex-col items-end gap-2">
			{open ? (
				<div className="h-[min(70vh,34rem)] w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-[1.6rem] border border-[#b8ceef] bg-white shadow-[0_20px_48px_rgba(2,6,23,0.28)]">
					<div className="bg-[#002e6b] px-4 py-3 text-white">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9ec4ff]">
									Global Assistant
								</p>
								<p className="mt-1 text-lg font-semibold leading-tight">Shop Chat</p>
								<p className="mt-1 text-xs text-white/85">Ask about products from your favorites and cart.</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
								aria-label="Close global assistant"
								title="Close global assistant"
							>
								<X className="size-4" />
							</button>
						</div>
					</div>

					<div className="flex h-[calc(100%-6.2rem)] flex-col bg-[#f3f4f6]">
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
						<div className="border-t border-slate-200 bg-white px-3 py-3">
							<div className="rounded-2xl border border-[#cfdaea] bg-[#f8fafc] p-2.5">
								<div className="flex items-center gap-2 rounded-xl bg-transparent px-2">
									<input
										value={value}
										onChange={(event) => onChange(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === 'Enter') {
												event.preventDefault();
												sendGlobalQuestion();
											}
										}}
										placeholder="Ask about products..."
										className="h-10 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
									/>
									<button
										type="button"
										onClick={sendGlobalQuestion}
										disabled={!value.trim() || isSending}
										className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7b96bb] text-white transition hover:bg-[#6584ad]"
										aria-label="Send global query"
										title="Send global query"
									>
										<Send className="size-4" />
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
				className="group relative inline-flex items-center gap-2 rounded-full border border-[#8fb0e6] bg-gradient-to-r from-[#002e6b] to-[#0b4ea8] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,46,107,0.45)] transition hover:from-[#003d8f] hover:to-[#2363b8]"
			>
				<span className="absolute -right-1 -bottom-1 inline-flex h-4 w-4">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8de9b2] opacity-70" />
					<span className="relative inline-flex h-4 w-4 rounded-full bg-[#7ed8a2]" />
				</span>
				<MessageCircle className="size-4" />
				Open Global AI
			</button>
		</div>
	);
}

function FavoritesPanel({
	items,
	favoriteKeys,
	onToggleFavorite,
	onAddToCart,
	onSelectProduct,
}: {
	items: ProductCard[];
	favoriteKeys: Set<string>;
	onToggleFavorite: (product: ProductCard) => void;
	onAddToCart: (product: ProductCard) => void;
	onSelectProduct: (product: ProductCard) => void;
}) {
	const interactedShops = Array.from(
		items.reduce(
			(acc, item) => {
				if (!acc.has(item.subdomain)) {
					acc.set(item.subdomain, {
						subdomain: item.subdomain,
						shopName: item.shopName,
						category: item.category || 'General',
						imageUrl: item.imageUrl,
					});
				}
				return acc;
			},
			new Map<string, { subdomain: string; shopName: string; category: string; imageUrl: string }>(),
		).values(),
	).slice(0, 3);

	if (items.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-[#c6d9ff] bg-[#f9fbff] px-6 py-16 text-center">
				<h2 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold text-slate-900">No favorites yet</h2>
				<p className="mt-2 text-sm text-slate-500">Start browsing products and click heart to save favorites.</p>
			</div>
		);
	}

	return (
		<section>
			<div className="mb-5 overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[linear-gradient(120deg,#eef5ff_0%,#ffffff_52%,#fff7e8_100%)] px-4 py-4 shadow-[0_14px_30px_rgba(0,46,107,0.10)] md:px-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h1 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold leading-tight text-slate-900">Favorites</h1>
					<div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
						<span className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1.5 text-[#17427a]">{items.length} items</span>
						<span className="rounded-full border border-[#ffe3bf] bg-[#fff7ec] px-3 py-1.5 text-[#8f5b1f]">{interactedShops.length} shops</span>
					</div>
				</div>
			</div>

			<div className="mb-3 flex items-center gap-2">
				<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ecf4ff] text-[#002e6b]">
					<Store className="size-3.5" />
				</div>
				<div>
					<p className="text-2xl font-semibold text-slate-900">Visited Shops</p>
					<p className="text-xs text-slate-500">{interactedShops.length} shops</p>
				</div>
			</div>

			<div className="mb-7 grid gap-4 md:grid-cols-3">
				{interactedShops.map((shop) => (
					<article key={shop.subdomain} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_22px_rgba(0,46,107,0.1)]">
						<div className="h-24 bg-slate-100">
							{shop.imageUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={shop.imageUrl} alt={shop.shopName} className="h-full w-full object-cover" />
							) : (
								<div className="h-full w-full bg-[linear-gradient(120deg,#e9f1ff,#fff4df)]" />
							)}
						</div>
						<div className="space-y-2 p-3">
							<p className="text-sm font-semibold text-slate-900">{shop.shopName}</p>
							<p className="text-xs text-slate-500">{shop.category.replaceAll('_', ' ')}</p>
							<Link href={`/shops/${shop.subdomain}`} className="inline-flex rounded-full bg-[#002e6b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#003d8f]">
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
					<p className="text-xs text-slate-500">{items.length} items you love</p>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{items.map((item) => {
					const key = buildKey(item.subdomain, item.id);
					const isFavorite = favoriteKeys.has(key);
					return (
						<article key={`${item.subdomain}-${item.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(0,46,107,0.08)]">
							<div className="relative aspect-[4/3] bg-slate-100">
								{item.imageUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
								) : null}
								<button
									type="button"
									onClick={() => onToggleFavorite(item)}
									aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
									title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
									className={cn(
										'absolute right-2 top-2 z-10 rounded-full border p-2 backdrop-blur transition',
										isFavorite
											? 'border-rose-200 bg-rose-50 text-rose-600'
											: 'border-white/80 bg-white/90 text-slate-600 hover:bg-white',
									)}
								>
									<Heart className={cn('size-4', isFavorite && 'fill-current')} />
								</button>
							</div>

							<div className="space-y-2 p-3">
								<div className="rounded-xl border border-[#d6e6ff] bg-[linear-gradient(135deg,#f7fbff,#eef5ff)] px-2.5 py-2">
									<p className="line-clamp-1 text-xs font-semibold text-[#17427a]">{item.shopName || 'Unknown Shop'}</p>
								</div>
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item.category || 'General'}</span>
								</div>
								<h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name}</h3>
								<p className="text-sm font-semibold text-[#002e6b]">{item.price}</p>
								<div className="flex items-center gap-2">
									<button type="button" onClick={() => onAddToCart(item)} className="inline-flex rounded-lg bg-[#002e6b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003d8f]">Add to Cart</button>
									<button type="button" onClick={() => onSelectProduct(item)} className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">View Details</button>
								</div>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}

function CartPanel({
	items,
	total,
	onRemoveFromCart,
	onClearCart,
}: {
	items: CartEntry[];
	total: number;
	onRemoveFromCart: (product: ProductCard) => void;
	onClearCart: () => void;
}) {
	const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
	const [isPlacingOrder, setIsPlacingOrder] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState('+855');
	const [deliveryLocation, setDeliveryLocation] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<'aba' | 'cod'>('aba');
	const [placedOrders, setPlacedOrders] = useState<Array<{ shopName: string; orderId: string; orderNo?: string; items: CartEntry[]; total: number }>>([]);
	const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);

	if (items.length === 0) {
		return (
			<div className="relative overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[radial-gradient(circle_at_top_right,_#edf4ff,_#f9fbff_55%,_#fff_100%)] px-6 py-14 text-center shadow-[0_16px_40px_rgba(0,46,107,0.10)]">
				<div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#dce9ff] blur-3xl" />
				<div className="pointer-events-none absolute -left-12 -bottom-14 h-32 w-32 rounded-full bg-[#ffe7c9] blur-2xl opacity-60" />
				<div className="relative mx-auto max-w-xl">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cfe0ff] bg-white shadow-sm">
						<ShoppingCart className="size-7 text-[#002e6b]" />
					</div>
					<h2 className="mt-5 font-[family:var(--font-dashboard-display)] text-3xl font-semibold text-slate-900">Your cart is empty</h2>
					<p className="mt-2 text-sm text-slate-600">Start adding products you like. Your cart works across all CoolHat shops.</p>
					<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
						<span className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1 text-xs font-semibold text-[#002e6b]">Cart</span>
						<span className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1 text-xs font-semibold text-[#002e6b]">Fast checkout</span>
						<span className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1 text-xs font-semibold text-[#002e6b]">Saved address</span>
					</div>
					<Link href="/shops" className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#002e6b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003d8f]">
						Explore all shops
					</Link>
				</div>
			</div>
		);
	}

	const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
	const shipping = 2;
	const grandTotal = total + shipping;
	const perShop = items.reduce<Record<string, { qty: number; subtotal: number }>>((acc, item) => {
		const itemPrice = Number(item.price.replace('$', '')) || 0;
		if (!acc[item.shopName]) {
			acc[item.shopName] = { qty: 0, subtotal: 0 };
		}
		acc[item.shopName].qty += item.qty;
		acc[item.shopName].subtotal += itemPrice * item.qty;
		return acc;
	}, {});

	const handleCartCheckout = async () => {
		if (!phoneNumber.trim() || !deliveryLocation.trim()) return;

		setIsPlacingOrder(true);
		try {
			const itemsByShop: Record<string, CartEntry[]> = items.reduce((acc: Record<string, CartEntry[]>, item: CartEntry) => {
				if (!acc[item.subdomain]) acc[item.subdomain] = [];
				acc[item.subdomain].push(item);
				return acc;
			}, {});

			const results: Array<{ shopName: string; orderId: string; orderNo?: string; items: CartEntry[]; total: number; success: boolean; error?: string }> = [];

			for (const [subdomain, shopItems] of Object.entries(itemsByShop)) {
				const shopName = shopItems[0].shopName;
				const shopTotal = shopItems.reduce((sum: number, item: CartEntry) => {
					const price = Number(item.price.replace('$', '')) || 0;
					return sum + price * item.qty;
				}, 0);

				const checkoutPayload = {
					customer_name: phoneNumber.trim().split(' ')[0] || 'Customer',
					customer_phone: phoneNumber.trim(),
					address_text: deliveryLocation.trim(),
					payment_method: paymentMethod === 'aba' ? 'aba_transfer' : 'cod',
					currency: 'USD',
					items: shopItems.map((item: CartEntry) => ({ product_id: item.id, qty: item.qty })),
				};

				try {
					const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
					const response = await fetch(buildCheckoutUrl(apiBase, subdomain), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(checkoutPayload),
					});

					if (!response.ok) {
						const error = await response.json().catch(() => ({}));
						throw new Error(error.message || `Checkout failed for ${shopName}`);
					}

					const data = await response.json();
					results.push({
						shopName,
						orderId: data.order?.id || `order-${Date.now()}`,
						orderNo: data.order?.orderNo,
						items: shopItems,
						total: shopTotal,
						success: true,
					});
				} catch (error) {
					results.push({
						shopName,
						orderId: `failed-${Date.now()}`,
						items: shopItems,
						total: shopTotal,
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error occurred',
					});
				}
			}

			const successfulOrders = results.filter((r) => r.success);
			if (successfulOrders.length === 0) {
				alert('Unable to place orders. Please try again.');
				return;
			}

			setPlacedOrders(successfulOrders);
			onClearCart();
			setIsCheckoutOpen(false);
			setIsOrderSuccessOpen(true);
		} catch (error) {
			console.error('Cart checkout error:', error);
			alert('An error occurred during checkout. Please try again.');
		} finally {
			setIsPlacingOrder(false);
		}
	};

	return (
		<>
		<div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
			<div className="space-y-3">
				{Object.entries(perShop).map(([shopName]) => {
					const shopItems = items.filter((item) => item.shopName === shopName);
					const shopSubtotal = shopItems.reduce((sum, item) => {
						const price = Number(item.price.replace('$', '')) || 0;
						return sum + price * item.qty;
					}, 0);
					return (
						<article key={shopName} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(0,46,107,0.08)]">
							<div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
								<div>
									<p className="text-base font-semibold text-slate-900">{shopName}</p>
									<p className="text-xs text-slate-500">{shopItems.length} item{shopItems.length > 1 ? 's' : ''} • ${shopSubtotal.toFixed(2)}</p>
								</div>
								<Link href={`/shops/${shopItems[0].subdomain}`} className="text-xs font-semibold text-[#002e6b] hover:underline">
									View Store
								</Link>
							</div>

							<div className="space-y-3">
								{shopItems.map((item) => (
									<div key={`${item.subdomain}-${item.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
										<div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white">
											{item.imageUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
											) : null}
										</div>
										<div className="min-w-0 flex-1">
											<p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name}</p>
											<div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
												<span>{item.price} each</span>
												<span className="rounded-full bg-white px-2 py-0.5">Qty {item.qty}</span>
											</div>
										</div>
										<div className="text-right">
											<p className="text-sm font-semibold text-[#002e6b]">${((Number(item.price.replace('$', '')) || 0) * item.qty).toFixed(2)}</p>
											<button type="button" onClick={() => onRemoveFromCart(item)} className="mt-1 text-xs font-semibold text-[#c61c2f] hover:underline">Remove</button>
										</div>
									</div>
								))}
							</div>
						</article>
					);
				})}
			</div>

			<aside className="relative self-start overflow-hidden rounded-2xl border border-[#cfe0ff] bg-[radial-gradient(circle_at_top_right,_#edf4ff,_#ffffff_45%,_#f8fbff_100%)] p-5 shadow-[0_18px_48px_rgba(0,46,107,0.16)] lg:sticky lg:top-4 lg:min-h-[520px]">
				<div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#dce9ff] blur-3xl" />
				<div className="relative flex h-full flex-col">
					<div className="flex items-center justify-between">
						<p className="text-xl font-semibold text-slate-900">Order Summary</p>
						<span className="rounded-full bg-[#ecf4ff] px-2.5 py-1 text-xs font-semibold text-[#002e6b]">{totalItems} items</span>
					</div>

					<div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
						<div className="flex items-center justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900">${total.toFixed(2)}</span></div>
						<div className="flex items-center justify-between"><span>Shipping</span><span className="font-semibold text-slate-900">${shipping.toFixed(2)}</span></div>
						<div className="flex items-center justify-between"><span>Tax</span><span className="font-semibold text-slate-900">At checkout</span></div>
						<div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-semibold text-[#002e6b]"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
					</div>

					<button type="button" onClick={() => setIsCheckoutOpen(true)} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f]">
						Proceed to Checkout
					</button>

					<div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Shipping from stores</p>
						<div className="mt-3 space-y-3">
							{Object.entries(perShop).map(([shopName, info]) => (
								<div key={shopName} className="flex items-start justify-between gap-3 text-sm">
									<div>
										<p className="font-semibold text-slate-900">{shopName}</p>
										<p className="text-xs text-slate-500">{info.qty} item{info.qty > 1 ? 's' : ''}</p>
									</div>
									<p className="font-semibold text-[#002e6b]">${info.subtotal.toFixed(2)}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</aside>
		</div>

		{isCheckoutOpen ? (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
				<div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
					<button type="button" onClick={() => setIsCheckoutOpen(false)} className="absolute right-5 top-5 text-slate-400 transition hover:text-slate-600" aria-label="Close checkout" title="Close checkout">
						<X className="size-5" />
					</button>

					<div className="p-6 sm:p-8">
						<h2 className="font-[family:var(--font-dashboard-display)] text-3xl font-semibold text-slate-900">Complete Your Orders</h2>
						<div className="mt-4 rounded-lg border border-[#cfe0ff] bg-[#f9fbff] p-3">
							<p className="text-sm font-semibold text-[#002e6b]">📦 Ordering from {Object.keys(perShop).length} store{Object.keys(perShop).length > 1 ? 's' : ''}</p>
						</div>

						<div className="mt-5 space-y-4">
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

							<button type="button" onClick={handleCartCheckout} disabled={!phoneNumber.trim() || !deliveryLocation.trim() || isPlacingOrder} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f] disabled:cursor-not-allowed disabled:opacity-50">
								{isPlacingOrder ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <ShoppingCart className="size-4" />}
								{isPlacingOrder ? 'Processing...' : 'Place Orders'}
							</button>
						</div>
					</div>
				</div>
			</div>
		) : null}

		{isOrderSuccessOpen ? (
			<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
				<div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:p-8">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ecf4ff]"><CheckCircle2 className="size-8 text-[#002e6b]" /></div>
					<h3 className="mt-4 text-center font-[family:var(--font-dashboard-display)] text-2xl font-semibold text-slate-900">{placedOrders.length} order{placedOrders.length > 1 ? 's' : ''} placed successfully</h3>
					<div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
						{placedOrders.map((order) => (
							<div key={order.orderId} className="flex items-center justify-between text-sm">
								<div>
									<p className="font-semibold text-slate-900">{order.shopName}</p>
									{order.orderNo ? <p className="text-xs text-slate-500">{order.orderNo}</p> : null}
								</div>
								<span className="font-semibold text-[#002e6b]">${order.total.toFixed(2)}</span>
							</div>
						))}
					</div>
					<button type="button" onClick={() => { setIsOrderSuccessOpen(false); setPlacedOrders([]); setPhoneNumber('+855'); setDeliveryLocation(''); }} className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#002e6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003d8f]">Continue shopping</button>
				</div>
			</div>
		) : null}
		</>
	);
}

function SectionList({
	title,
	items,
	favoriteKeys,
	onToggleFavorite,
	onAddToCart,
	onSelectProduct,
	showViewAll,
}: {
	title: string;
	items: ProductCard[];
	favoriteKeys: Set<string>;
	onToggleFavorite: (product: ProductCard) => void;
	onAddToCart: (product: ProductCard) => void;
	onSelectProduct: (product: ProductCard) => void;
	showViewAll?: boolean;
}) {
	if (items.length === 0) return null;

	return (
		<section>
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
				{showViewAll ? <span className="text-xs font-semibold text-[#002e6b]">View All</span> : null}
			</div>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{items.map((item) => {
					const key = buildKey(item.subdomain, item.id);
					const isFavorite = favoriteKeys.has(key);
					return (
						<article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
							<div className="relative aspect-[4/3] bg-slate-100">
								{item.imageUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
								) : null}
								<button
									type="button"
									onClick={() => onToggleFavorite(item)}
									aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
									title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
									className={cn(
										'absolute right-2 top-2 rounded-full border p-2 backdrop-blur transition',
										isFavorite
											? 'border-rose-200 bg-rose-50 text-rose-600'
											: 'border-white/80 bg-white/90 text-slate-600 hover:bg-white',
									)}
								>
									<Heart className={cn('size-4', isFavorite && 'fill-current')} />
								</button>
							</div>
							<div className="space-y-1.5 p-3">
								<p className="line-clamp-1 text-xs font-semibold text-slate-900">{item.name}</p>
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item.category || 'General'}</span>
								</div>
								<p className="text-sm font-semibold text-[#002e6b]">{item.price}</p>
							<div className="flex items-center gap-2">
									<button type="button" onClick={() => onAddToCart(item)} className="inline-flex rounded-lg bg-[#002e6b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003d8f]">Add to Cart</button>
									<button type="button" onClick={() => onSelectProduct(item)} className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">View Details</button>
								</div>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}
