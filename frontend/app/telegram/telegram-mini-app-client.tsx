"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const STORAGE_KEY = "coolhat.telegramMiniAppToken";

type Dashboard = {
  tenant: {
    id: string;
    shopName: string;
    shopType: string;
    description: string | null;
    addressText: string | null;
    googleMapUrl: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    subdomain: string;
    isActive: boolean;
    storeUrl: string;
  };
  stats: {
    products: { total: number; active: number };
    orders: { total: number; pending: number; confirmed: number; paid: number };
    lowStock: number;
  };
  recentProducts: Array<{ id: string; name: string; basePriceUsd: string; stockQty: number; isActive: boolean }>;
  recentOrders: Array<{ id: string; orderNo: string; status: string; paymentStatus: string; total: string; currency: string }>;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  description?: string | null;
  basePriceUsd: string;
  basePriceKhr: string;
  trackInventory?: boolean;
  stockQty: number;
  lowStockThreshold: number;
  hasVariants?: boolean;
  imageUrls: string[];
  isActive: boolean;
};

type Order = {
  id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string;
  currency: string;
  customerName: string;
  items?: Array<{ id: string; productNameSnapshot: string; qty: number; lineTotal: string }>;
};

type StoreForm = {
  shop_name: string;
  shop_type: string;
  description: string;
  address_text: string;
  google_map_url: string;
  logo_url: string;
  banner_url: string;
  is_active: boolean;
};

type ProductForm = {
  id: string | null;
  name: string;
  category: string;
  description: string;
  base_price_usd: string;
  base_price_khr: string;
  stock_qty: string;
  low_stock_threshold: string;
  image_urls: string;
  track_inventory: boolean;
  has_variants: boolean;
  is_active: boolean;
};

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message ?? "Request failed");
  return data as T;
}

function blankProduct(): ProductForm {
  return {
    id: null,
    name: "",
    category: "",
    description: "",
    base_price_usd: "0",
    base_price_khr: "0",
    stock_qty: "0",
    low_stock_threshold: "5",
    image_urls: "",
    track_inventory: true,
    has_variants: false,
    is_active: true,
  };
}

export default function TelegramMiniAppClient() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("screen") ?? "dashboard");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Connecting to Telegram...");
  const [manualInitData, setManualInitData] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [storeForm, setStoreForm] = useState<StoreForm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>(blankProduct());
  const [productImage, setProductImage] = useState<File | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [storeAsset, setStoreAsset] = useState<File | null>(null);
  const [storeAssetType, setStoreAssetType] = useState<"logo" | "banner">("logo");
  const [isPending, startTransition] = useTransition();

  async function tryTelegramInitData(attempts = 12): Promise<string> {
    for (let index = 0; index < attempts; index += 1) {
      const initData = window.Telegram?.WebApp?.initData?.trim() || "";
      if (initData) {
        return initData;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    return "";
  }

  async function connectFromTelegram() {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) {
      setToken(existing);
      return;
    }

    setStatus("Waiting for Telegram session...");
    const initData = await tryTelegramInitData();
    if (!initData) {
      setStatus("Open this from Telegram or paste initData below for testing.");
      return;
    }

    await createSession(initData);
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      void connectFromTelegram();
    };
    document.body.appendChild(script);

    if (window.Telegram?.WebApp) {
      void connectFromTelegram();
    }

    return () => {
      document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadAll(token);
  }, [token]);

  async function createSession(initData: string) {
    try {
      const res = await fetch(`${API_URL}/telegram/miniapp/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Unable to create session");
      sessionStorage.setItem(STORAGE_KEY, data.session.token);
      setToken(data.session.token);
      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
      setStatus("Connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to connect");
    }
  }

  async function loadAll(nextToken: string) {
    try {
      setStatus("Loading dashboard...");
      const bootstrap = await api<Dashboard>("/telegram/miniapp/bootstrap", nextToken);
      const productData = await api<{ data: Product[] }>("/telegram/miniapp/products?include_inactive=true&page_size=12", nextToken);
      const orderData = await api<{ orders: Order[] }>("/telegram/miniapp/orders", nextToken);
      setDashboard(bootstrap);
      setStoreForm({
        shop_name: bootstrap.tenant.shopName,
        shop_type: bootstrap.tenant.shopType,
        description: bootstrap.tenant.description ?? "",
        address_text: bootstrap.tenant.addressText ?? "",
        google_map_url: bootstrap.tenant.googleMapUrl ?? "",
        logo_url: bootstrap.tenant.logoUrl ?? "",
        banner_url: bootstrap.tenant.bannerUrl ?? "",
        is_active: bootstrap.tenant.isActive,
      });
      setProducts(productData.data);
      setOrders(orderData.orders);
      setStatus("Ready");
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEY);
      setToken("");
      setStatus(error instanceof Error ? error.message : "Unable to load dashboard");
    }
  }

  async function refreshProducts() {
    if (!token) return;
    const productData = await api<{ data: Product[] }>("/telegram/miniapp/products?include_inactive=true&page_size=12", token);
    setProducts(productData.data);
  }

  async function refreshOrders() {
    if (!token) return;
    const orderData = await api<{ orders: Order[] }>("/telegram/miniapp/orders", token);
    setOrders(orderData.orders);
  }

  async function refreshDashboard() {
    if (!token) return;
    const bootstrap = await api<Dashboard>("/telegram/miniapp/bootstrap", token);
    setDashboard(bootstrap);
    setStoreForm({
      shop_name: bootstrap.tenant.shopName,
      shop_type: bootstrap.tenant.shopType,
      description: bootstrap.tenant.description ?? "",
      address_text: bootstrap.tenant.addressText ?? "",
      google_map_url: bootstrap.tenant.googleMapUrl ?? "",
      logo_url: bootstrap.tenant.logoUrl ?? "",
      banner_url: bootstrap.tenant.bannerUrl ?? "",
      is_active: bootstrap.tenant.isActive,
    });
  }

  async function saveStore() {
    if (!token || !storeForm) return;
    startTransition(async () => {
      setStatus("Saving store...");
      await api("/telegram/miniapp/tenant", token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeForm),
      });
      await refreshDashboard();
      setStatus("Store updated");
    });
  }

  async function uploadStoreAsset() {
    if (!token || !storeAsset) return;
    const form = new FormData();
    form.set("type", storeAssetType);
    form.set("file", storeAsset);
    setStatus(`Uploading ${storeAssetType}...`);
    const payload = await api<{ upload: { publicUrl: string } }>("/telegram/miniapp/tenant/assets", token, {
      method: "POST",
      body: form,
    });
    setStoreForm((current) =>
      current
        ? {
            ...current,
            [storeAssetType === "logo" ? "logo_url" : "banner_url"]: payload.upload.publicUrl,
          }
        : current
    );
    setStoreAsset(null);
    setStatus(`${storeAssetType} uploaded`);
  }

  async function saveProduct() {
    if (!token) return;
    const payload = {
      ...productForm,
      image_urls: productForm.image_urls
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    startTransition(async () => {
      setStatus(productForm.id ? "Updating product..." : "Creating product...");
      const endpoint = productForm.id ? `/telegram/miniapp/products/${productForm.id}` : "/telegram/miniapp/products";
      const method = productForm.id ? "PATCH" : "POST";
      const result = await api<{ product: Product }>(endpoint, token, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setProductForm({
        id: result.product.id,
        name: result.product.name,
        category: result.product.category ?? "",
        description: result.product.description ?? "",
        base_price_usd: result.product.basePriceUsd,
        base_price_khr: result.product.basePriceKhr,
        stock_qty: String(result.product.stockQty),
        low_stock_threshold: String(result.product.lowStockThreshold),
        image_urls: result.product.imageUrls.join(", "),
        track_inventory: result.product.trackInventory ?? true,
        has_variants: result.product.hasVariants ?? false,
        is_active: result.product.isActive,
      });
      await refreshProducts();
      await refreshDashboard();
      setStatus(productForm.id ? "Product updated" : "Product created");
    });
  }

  async function uploadProductImage() {
    if (!token || !productForm.id || !productImage) return;
    const form = new FormData();
    form.set("file", productImage);
    setStatus("Uploading product image...");
    const result = await api<{ image_urls: string[] }>(`/telegram/miniapp/products/${productForm.id}/images`, token, {
      method: "POST",
      body: form,
    });
    setProductForm((current) => ({ ...current, image_urls: result.image_urls.join(", ") }));
    setProductImage(null);
    await refreshProducts();
    setStatus("Product image uploaded");
  }

  async function deactivateProduct() {
    if (!token || !productForm.id) return;
    setStatus("Deactivating product...");
    await api(`/telegram/miniapp/products/${productForm.id}/deactivate`, token, { method: "PATCH" });
    setProductForm(blankProduct());
    await refreshProducts();
    await refreshDashboard();
    setStatus("Product deactivated");
  }

  async function openOrder(orderId: string) {
    if (!token) return;
    const detail = await api<{ order: Order }>(`/telegram/miniapp/orders/${orderId}`, token);
    setSelectedOrder(detail.order);
    setTab("orders");
  }

  async function updateOrderStatus(statusValue: string) {
    if (!token || !selectedOrder) return;
    setStatus("Updating order status...");
    const result = await api<{ order: Order }>(`/telegram/miniapp/orders/${selectedOrder.id}/status`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusValue }),
    });
    setSelectedOrder(result.order);
    await refreshOrders();
    await refreshDashboard();
    setStatus("Order status updated");
  }

  async function updateOrderPayment(paymentStatus: string) {
    if (!token || !selectedOrder) return;
    setStatus("Updating payment...");
    const result = await api<{ order: Order }>(`/telegram/miniapp/orders/${selectedOrder.id}/payment`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
    setSelectedOrder(result.order);
    await refreshOrders();
    await refreshDashboard();
    setStatus("Order payment updated");
  }

  async function cancelOrder() {
    if (!token || !selectedOrder) return;
    setStatus("Cancelling order...");
    const result = await api<{ order: Order }>(`/telegram/miniapp/orders/${selectedOrder.id}/cancel`, token, {
      method: "POST",
    });
    setSelectedOrder(result.order);
    await refreshOrders();
    await refreshDashboard();
    setStatus("Order cancelled");
  }

  if (!token && !dashboard) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5d39b,_#f6efe2_46%,_#eee2cf)] px-4 py-6 text-stone-900">
        <section className="mx-auto max-w-md rounded-[28px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_20px_60px_rgba(90,60,20,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800">CoolHat Mini App</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">Telegram store dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-stone-700">{status}</p>
          <textarea
            value={manualInitData}
            onChange={(event) => setManualInitData(event.target.value)}
            className="mt-5 min-h-32 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            placeholder="Paste Telegram WebApp initData for local testing"
          />
          <button
            type="button"
            onClick={() => void createSession(manualInitData)}
            className="mt-3 w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
          >
            Start session
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f1e7,_#efe4ce_45%,_#faf6ef)] px-3 py-4 text-stone-900">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[30px] border border-stone-900/10 bg-white/90 shadow-[0_25px_80px_rgba(64,41,15,0.12)]">
        <div className="bg-[linear-gradient(135deg,_#40280f,_#7a4d1d_58%,_#d59d49)] px-5 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/80">CoolHat x Telegram</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold">{dashboard?.tenant.shopName}</h1>
              <p className="mt-1 text-sm text-amber-50/80">{dashboard?.tenant.subdomain}.store | {status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["dashboard", "store", "products", "orders"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${tab === item ? "bg-white text-stone-900" : "bg-white/15 text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 px-4 py-5 md:grid-cols-[1fr_1.4fr]">
          <aside className="space-y-4">
            <section className="rounded-[24px] bg-stone-950 p-4 text-white">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/8 p-3"><div className="text-xs uppercase text-stone-400">Products</div><div className="mt-2 text-2xl font-semibold">{dashboard?.stats.products.total ?? 0}</div></div>
                <div className="rounded-2xl bg-white/8 p-3"><div className="text-xs uppercase text-stone-400">Orders</div><div className="mt-2 text-2xl font-semibold">{dashboard?.stats.orders.total ?? 0}</div></div>
                <div className="rounded-2xl bg-white/8 p-3"><div className="text-xs uppercase text-stone-400">Pending</div><div className="mt-2 text-2xl font-semibold">{dashboard?.stats.orders.pending ?? 0}</div></div>
                <div className="rounded-2xl bg-white/8 p-3"><div className="text-xs uppercase text-stone-400">Low stock</div><div className="mt-2 text-2xl font-semibold">{dashboard?.stats.lowStock ?? 0}</div></div>
              </div>
            </section>
            <section className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
              <h2 className="font-serif text-xl">Recent products</h2>
              <div className="mt-4 space-y-3">
                {products.slice(0, 6).map((product) => (
                  <button key={product.id} type="button" onClick={() => {
                    setProductForm({
                      id: product.id,
                      name: product.name,
                      category: product.category ?? "",
                      description: product.description ?? "",
                      base_price_usd: product.basePriceUsd,
                      base_price_khr: product.basePriceKhr,
                      stock_qty: String(product.stockQty),
                      low_stock_threshold: String(product.lowStockThreshold),
                      image_urls: product.imageUrls.join(", "),
                      track_inventory: product.trackInventory ?? true,
                      has_variants: product.hasVariants ?? false,
                      is_active: product.isActive,
                    });
                    setTab("products");
                  }} className="w-full rounded-2xl bg-white px-4 py-3 text-left">
                    <div className="flex items-center justify-between"><span className="font-medium">{product.name}</span><span className="text-sm text-stone-500">{product.basePriceUsd} USD</span></div>
                    <p className="mt-1 text-sm text-stone-600">Stock {product.stockQty} | {product.isActive ? "active" : "inactive"}</p>
                  </button>
                ))}
              </div>
            </section>
          </aside>
          <section className="space-y-4">
            {tab === "dashboard" && <DashboardPanel dashboard={dashboard} onOpenOrder={openOrder} />}
            {tab === "store" && storeForm && (
              <section className="rounded-[28px] border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-2xl">Store management</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <TextField label="Shop name" value={storeForm.shop_name} onChange={(value) => setStoreForm({ ...storeForm, shop_name: value })} />
                  <TextField label="Shop type" value={storeForm.shop_type} onChange={(value) => setStoreForm({ ...storeForm, shop_type: value })} />
                  <TextField label="Address" value={storeForm.address_text} onChange={(value) => setStoreForm({ ...storeForm, address_text: value })} />
                  <TextField label="Google Map URL" value={storeForm.google_map_url} onChange={(value) => setStoreForm({ ...storeForm, google_map_url: value })} />
                  <TextField label="Logo URL" value={storeForm.logo_url} onChange={(value) => setStoreForm({ ...storeForm, logo_url: value })} />
                  <TextField label="Banner URL" value={storeForm.banner_url} onChange={(value) => setStoreForm({ ...storeForm, banner_url: value })} />
                </div>
                <label className="mt-3 block text-sm font-medium">Description</label>
                <textarea value={storeForm.description} onChange={(event) => setStoreForm({ ...storeForm, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" />
                <label className="mt-3 flex items-center gap-3 text-sm font-medium">
                  <input type="checkbox" checked={storeForm.is_active} onChange={(event) => setStoreForm({ ...storeForm, is_active: event.target.checked })} />
                  Store is active
                </label>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => void saveStore()} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">Save store</button>
                </div>
                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-medium">Upload logo or banner</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <select value={storeAssetType} onChange={(event) => setStoreAssetType(event.target.value as "logo" | "banner")} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm">
                      <option value="logo">Logo</option>
                      <option value="banner">Banner</option>
                    </select>
                    <input type="file" accept="image/*" onChange={(event) => setStoreAsset(event.target.files?.[0] ?? null)} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm" />
                    <button type="button" onClick={() => void uploadStoreAsset()} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white">Upload</button>
                  </div>
                </div>
              </section>
            )}
            {tab === "products" && (
              <section className="rounded-[28px] border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-2xl">Product management</h2>
                  <button type="button" onClick={() => setProductForm(blankProduct())} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">New product</button>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                  <div className="space-y-3">
                    {products.map((product) => (
                      <button key={product.id} type="button" onClick={() => setProductForm({
                        id: product.id,
                        name: product.name,
                        category: product.category ?? "",
                        description: product.description ?? "",
                        base_price_usd: product.basePriceUsd,
                        base_price_khr: product.basePriceKhr,
                        stock_qty: String(product.stockQty),
                        low_stock_threshold: String(product.lowStockThreshold),
                        image_urls: product.imageUrls.join(", "),
                        track_inventory: product.trackInventory ?? true,
                        has_variants: product.hasVariants ?? false,
                        is_active: product.isActive,
                      })} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left">
                        <div className="flex items-center justify-between"><span className="font-medium">{product.name}</span><span className="text-sm text-stone-500">{product.basePriceUsd} USD</span></div>
                        <p className="mt-1 text-sm text-stone-600">{product.category || "No category"} | stock {product.stockQty}</p>
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField label="Name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} />
                      <TextField label="Category" value={productForm.category} onChange={(value) => setProductForm({ ...productForm, category: value })} />
                      <TextField label="Base price USD" value={productForm.base_price_usd} onChange={(value) => setProductForm({ ...productForm, base_price_usd: value })} />
                      <TextField label="Base price KHR" value={productForm.base_price_khr} onChange={(value) => setProductForm({ ...productForm, base_price_khr: value })} />
                      <TextField label="Stock qty" value={productForm.stock_qty} onChange={(value) => setProductForm({ ...productForm, stock_qty: value })} />
                      <TextField label="Low stock threshold" value={productForm.low_stock_threshold} onChange={(value) => setProductForm({ ...productForm, low_stock_threshold: value })} />
                    </div>
                    <label className="mt-3 block text-sm font-medium">Description</label>
                    <textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" />
                    <label className="mt-3 block text-sm font-medium">Image URLs</label>
                    <textarea value={productForm.image_urls} onChange={(event) => setProductForm({ ...productForm, image_urls: event.target.value })} className="mt-2 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" />
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <Toggle label="Track inventory" checked={productForm.track_inventory} onChange={(value) => setProductForm({ ...productForm, track_inventory: value })} />
                      <Toggle label="Has variants" checked={productForm.has_variants} onChange={(value) => setProductForm({ ...productForm, has_variants: value })} />
                      <Toggle label="Active" checked={productForm.is_active} onChange={(value) => setProductForm({ ...productForm, is_active: value })} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={() => void saveProduct()} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">{productForm.id ? "Save changes" : "Create product"}</button>
                      {productForm.id ? <button type="button" onClick={() => void deactivateProduct()} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white">Deactivate</button> : null}
                    </div>
                    {productForm.id ? (
                      <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-sm font-medium">Upload product image</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <input type="file" accept="image/*" onChange={(event) => setProductImage(event.target.files?.[0] ?? null)} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm" />
                          <button type="button" onClick={() => void uploadProductImage()} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white">Upload image</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            )}
            {tab === "orders" && (
              <section className="rounded-[28px] border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-2xl">Order management</h2>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <button key={order.id} type="button" onClick={() => void openOrder(order.id)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left">
                        <div className="flex items-center justify-between"><span className="font-medium">{order.orderNo}</span><span className="text-sm uppercase text-stone-500">{order.status}</span></div>
                        <p className="mt-1 text-sm text-stone-600">{order.customerName} | {order.total} {order.currency}</p>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    {selectedOrder ? (
                      <>
                        <h3 className="font-serif text-2xl">{selectedOrder.orderNo}</h3>
                        <p className="mt-1 text-sm text-stone-600">{selectedOrder.customerName} | {selectedOrder.total} {selectedOrder.currency}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {["confirmed", "delivering", "completed"].map((item) => (
                            <button key={item} type="button" onClick={() => void updateOrderStatus(item)} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">{item}</button>
                          ))}
                          {["paid", "unpaid"].map((item) => (
                            <button key={item} type="button" onClick={() => void updateOrderPayment(item)} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white">mark {item}</button>
                          ))}
                          <button type="button" onClick={() => void cancelOrder()} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white">cancel order</button>
                        </div>
                        <div className="mt-5 space-y-2">
                          {selectedOrder.items?.map((item) => (
                            <div key={item.id} className="rounded-2xl bg-white px-4 py-3 text-sm">{item.productNameSnapshot} x{item.qty} | {item.lineTotal}</div>
                          ))}
                        </div>
                      </>
                    ) : <p className="text-sm text-stone-600">Select an order to inspect and update it.</p>}
                  </div>
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
      {isPending ? <div className="fixed bottom-4 right-4 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white">Working...</div> : null}
    </main>
  );
}

function DashboardPanel({ dashboard, onOpenOrder }: { dashboard: Dashboard | null; onOpenOrder: (id: string) => void }) {
  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-5">
      <h2 className="font-serif text-2xl">Dashboard</h2>
      <p className="mt-3 text-sm leading-6 text-stone-700">{dashboard?.tenant.description || "No store description yet."}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {dashboard?.recentOrders.map((order) => (
          <button key={order.id} type="button" onClick={() => onOpenOrder(order.id)} className="rounded-2xl bg-stone-100 px-4 py-3 text-left">
            <div className="flex items-center justify-between"><span className="font-medium">{order.orderNo}</span><span className="text-sm uppercase text-stone-500">{order.status}</span></div>
            <p className="mt-1 text-sm text-stone-600">{order.total} {order.currency} | {order.paymentStatus}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
