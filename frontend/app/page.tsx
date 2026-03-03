'use client';

import { FormEvent, useState } from "react";

const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type RequestState = {
  loading: boolean;
  error: string | null;
  response: string;
};

async function runRequest(
  baseUrl: string,
  path: string,
  init: RequestInit & { method: string }
) {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;

  const res = await fetch(url, init);
  const text = await res.text();

  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // keep as raw text
  }

  return {
    res,
    body: parsed ?? text,
    text,
  };
}

export default function Home() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [token, setToken] = useState("");
  const [requestState, setRequestState] = useState<RequestState>({
    loading: false,
    error: null,
    response: "",
  });

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [fullName, setFullName] = useState("");

  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState("beauty_cosmetics");
  const [tenantDescription, setTenantDescription] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantGoogleMapUrl, setTenantGoogleMapUrl] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState("");
  const [tenantBannerUrl, setTenantBannerUrl] = useState("");

  const [subdomainShopName, setSubdomainShopName] = useState("");
  const [storeSubdomain, setStoreSubdomain] = useState("");

  const [tenantUploadType, setTenantUploadType] = useState<"logo" | "banner">(
    "logo"
  );
  const [tenantUploadFile, setTenantUploadFile] = useState<File | null>(null);

  const [productName, setProductName] = useState("");
  const [productBasePriceUsd, setProductBasePriceUsd] = useState("");
  const [productBasePriceKhr, setProductBasePriceKhr] = useState("");
  const [productDetailId, setProductDetailId] = useState("");

  const [checkoutCustomerName, setCheckoutCustomerName] = useState("");
  const [checkoutAddressText, setCheckoutAddressText] = useState("");
  const [checkoutProductId, setCheckoutProductId] = useState("");
  const [checkoutQty, setCheckoutQty] = useState("1");

  const [orderIdDetail, setOrderIdDetail] = useState("");

  const [aiDraftLang, setAiDraftLang] = useState<"km" | "en">("km");
  const [aiDraftName, setAiDraftName] = useState("");
  const [aiDraftBasePriceUsd, setAiDraftBasePriceUsd] = useState("");
  const [aiDraftBasePriceKhr, setAiDraftBasePriceKhr] = useState("");
  const [aiDraftCategory, setAiDraftCategory] = useState("");
  const [aiDraftId, setAiDraftId] = useState("");
  const [aiDraftAnswer, setAiDraftAnswer] = useState("");
  const [aiDraftLastQuestion, setAiDraftLastQuestion] = useState("");

  function updateRequestStateFromResult(result: {
    res: Response;
    body: any;
    text: string;
  }) {
    const { res, body, text } = result;

    const pretty =
      typeof body === "object" && body !== null
        ? JSON.stringify(body, null, 2)
        : text || "(no body)";

    setRequestState({
      loading: false,
      error: res.ok ? null : `HTTP ${res.status} ${res.statusText}`,
      response: pretty,
    });
  }

  function handleRequestError(error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    setRequestState({
      loading: false,
      error: message,
      response: "",
    });
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await runRequest(apiUrl, "/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: signUpName,
          email: signUpEmail,
          password: signUpPassword,
          callbackURL:
            typeof window !== "undefined"
              ? `${window.location.origin}/welcome`
              : "http://localhost:3000/welcome",
          rememberMe: true,
        }),
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await runRequest(apiUrl, "/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
          callbackURL:
            typeof window !== "undefined"
              ? `${window.location.origin}/dashboard`
              : "http://localhost:3000/dashboard",
          rememberMe: true,
        }),
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleGetSession() {
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await runRequest(apiUrl, "/api/auth/get-session", {
        method: "GET",
        credentials: "include",
      });

      updateRequestStateFromResult(result);

      const data = result.body as any;
      if (data && typeof data === "object") {
        const maybeToken =
          data.token ??
          data.accessToken ??
          data.access_token ??
          data.bearerToken ??
          data.bearer_token ??
          data.session?.token ??
          data.session?.accessToken ??
          data.session?.access_token;

        if (typeof maybeToken === "string" && !token) {
          setToken(maybeToken);
        }
      }
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleSignOut() {
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/api/auth/sign-out", {
        method: "POST",
        headers,
        credentials: "include",
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleGetMe() {
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/me", {
        method: "GET",
        headers,
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleUpdateMe(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/me", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          full_name: fullName,
        }),
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleDeactivateMe() {
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/me/deactivate", {
        method: "PATCH",
        headers,
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleCreateTenant(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/tenants", {
        method: "POST",
        headers,
        body: JSON.stringify({
          shop_name: shopName,
          shop_type: shopType,
          description: tenantDescription || undefined,
          address_text: tenantAddress || undefined,
          google_map_url: tenantGoogleMapUrl || undefined,
          logo_url: tenantLogoUrl || undefined,
          banner_url: tenantBannerUrl || undefined,
        }),
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleCheckSubdomain(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const query = new URLSearchParams({
        shop_name: subdomainShopName,
      }).toString();

      const result = await runRequest(
        apiUrl,
        `/tenants/subdomain-available?${query}`,
        {
          method: "GET",
        }
      );

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleTenantUpload(e: FormEvent) {
    e.preventDefault();
    if (!tenantUploadFile) {
      setRequestState({
        loading: false,
        error: "Please choose a file to upload.",
        response: "",
      });
      return;
    }

    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append("type", tenantUploadType);
      formData.append("file", tenantUploadFile);

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/tenants/upload-url", {
        method: "POST",
        headers,
        body: formData,
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleStoreProfileBySubdomain(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await runRequest(
        apiUrl,
        `/store/by-subdomain/${encodeURIComponent(storeSubdomain)}`,
        {
          method: "GET",
        }
      );

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const body: any = { name: productName };
      if (productBasePriceUsd) {
        body.base_price_usd = Number(productBasePriceUsd);
      }
      if (productBasePriceKhr) {
        body.base_price_khr = Number(productBasePriceKhr);
      }

      const result = await runRequest(apiUrl, "/products", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleListProducts() {
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/products", {
        method: "GET",
        headers,
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleGetProduct(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(
        apiUrl,
        `/products/${encodeURIComponent(productDetailId)}`,
        {
          method: "GET",
          headers,
        }
      );

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const qty = Number(checkoutQty) || 1;

      const body = {
        customer_name: checkoutCustomerName,
        address_text: checkoutAddressText,
        payment_method: "cod" as const,
        currency: "USD" as const,
        items: [
          {
            product_id: checkoutProductId,
            qty,
          },
        ],
      };

      const result = await runRequest(apiUrl, "/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleListOrders() {
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/orders", {
        method: "GET",
        headers,
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleGetOrder(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(
        apiUrl,
        `/orders/${encodeURIComponent(orderIdDetail)}`,
        {
          method: "GET",
          headers,
        }
      );

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleStartAiDraft(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const body: any = {
        name: aiDraftName,
        base_price_usd: Number(aiDraftBasePriceUsd || "0"),
        base_price_khr: Number(aiDraftBasePriceKhr || "0"),
        lang: aiDraftLang,
      };
      if (aiDraftCategory) body.category = aiDraftCategory;

      const result = await runRequest(apiUrl, "/products/ai/start", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = result.body as any;
      if (data?.draft?.id) {
        setAiDraftId(data.draft.id);
      }
      if (typeof data?.next_question === "string") {
        setAiDraftLastQuestion(data.next_question);
      }

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleAnswerAiDraft(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/products/ai/answer", {
        method: "POST",
        headers,
        body: JSON.stringify({
          draft_id: aiDraftId,
          answer: aiDraftAnswer,
        }),
      });

      const data = result.body as any;
      if (typeof data?.next_question === "string") {
        setAiDraftLastQuestion(data.next_question);
      } else if (data?.message === "Draft is ready to confirm") {
        setAiDraftLastQuestion("Draft is ready to confirm.");
      }

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleConfirmAiDraft(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/products/ai/confirm", {
        method: "POST",
        headers,
        body: JSON.stringify({
          draft_id: aiDraftId,
        }),
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleListAiDrafts() {
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(apiUrl, "/products/ai/drafts", {
        method: "GET",
        headers,
      });

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleGetAiDraft(e: FormEvent) {
    e.preventDefault();
    setRequestState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await runRequest(
        apiUrl,
        `/products/ai/drafts/${encodeURIComponent(aiDraftId)}`,
        {
          method: "GET",
          headers,
        }
      );

      updateRequestStateFromResult(result);
    } catch (error) {
      handleRequestError(error);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Storefront Backend API Playground
          </h1>
          <p className="text-sm text-zinc-600">
            Use this page to exercise the backend endpoints described in
            <code className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
              backend/README.md
            </code>
            .
          </p>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">
            API Configuration
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex-1 text-sm">
              <span className="mb-1 block text-xs font-medium text-zinc-600">
                API base URL
              </span>
              <input
                className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8080"
              />
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1 block text-xs font-medium text-zinc-600">
                Bearer token (for /me, /tenants, etc.)
              </span>
              <input
                className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from get-session response"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            By default, the app uses
            <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
              NEXT_PUBLIC_API_URL
            </code>
            or
            <code className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
              http://localhost:8080
            </code>
            .
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Owner product flow
              </h2>
              <form onSubmit={handleCreateProduct} className="space-y-2 text-sm">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Name (required)
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Base price USD
                    </span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      value={productBasePriceUsd}
                      onChange={(e) =>
                        setProductBasePriceUsd(e.target.value)
                      }
                      placeholder="12.5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Base price KHR
                    </span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      value={productBasePriceKhr}
                      onChange={(e) =>
                        setProductBasePriceKhr(e.target.value)
                      }
                      placeholder="50000"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  {requestState.loading ? "Submitting..." : "Create product"}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100"
                  onClick={handleListProducts}
                  disabled={requestState.loading}
                >
                  List products (GET /products)
                </button>
              </div>

              <form
                onSubmit={handleGetProduct}
                className="mt-4 space-y-2 text-sm"
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Product ID (GET /products/:id)
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={productDetailId}
                    onChange={(e) => setProductDetailId(e.target.value)}
                    placeholder="product UUID"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
                  disabled={requestState.loading}
                >
                  Get product detail
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Buyer checkout & orders
              </h2>
              <form onSubmit={handleCheckout} className="space-y-2 text-sm">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Customer name
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={checkoutCustomerName}
                    onChange={(e) => setCheckoutCustomerName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Address text
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={checkoutAddressText}
                    onChange={(e) => setCheckoutAddressText(e.target.value)}
                    required
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Product ID
                    </span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      value={checkoutProductId}
                      onChange={(e) => setCheckoutProductId(e.target.value)}
                      placeholder="product UUID"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Qty
                    </span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      value={checkoutQty}
                      onChange={(e) => setCheckoutQty(e.target.value)}
                      type="number"
                      min={1}
                    />
                  </label>
                </div>
                <p className="text-xs text-zinc-500">
                  This calls
                  <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
                    POST /checkout
                  </code>
                  and uses host-based tenant resolution as described in the
                  backend README.
                </p>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  {requestState.loading ? "Submitting..." : "Create checkout"}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100"
                  onClick={handleListOrders}
                  disabled={requestState.loading}
                >
                  List owner orders (GET /orders)
                </button>
              </div>

              <form
                onSubmit={handleGetOrder}
                className="mt-4 space-y-2 text-sm"
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Order ID (GET /orders/:id)
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={orderIdDetail}
                    onChange={(e) => setOrderIdDetail(e.target.value)}
                    placeholder="order UUID"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
                  disabled={requestState.loading}
                >
                  Get order detail
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
            AI-assisted product onboarding
          </h2>
          <p className="mb-3 text-xs text-zinc-600">
            This section uses the chat-like AI draft flow from
            <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
              /products/ai/start
            </code>
            ,
            <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
              /products/ai/answer
            </code>
            and
            <code className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
              /products/ai/confirm
            </code>
            so that products follow the CoolHat AI onboarding rules.
          </p>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1.5fr)]">
            <form
              onSubmit={handleStartAiDraft}
              className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Step 1: Start draft
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Name
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={aiDraftName}
                    onChange={(e) => setAiDraftName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Category (optional)
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={aiDraftCategory}
                    onChange={(e) => setAiDraftCategory(e.target.value)}
                    placeholder="Skincare"
                  />
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Base price USD
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={aiDraftBasePriceUsd}
                    onChange={(e) => setAiDraftBasePriceUsd(e.target.value)}
                    placeholder="15.5"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Base price KHR
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={aiDraftBasePriceKhr}
                    onChange={(e) => setAiDraftBasePriceKhr(e.target.value)}
                    placeholder="62000"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Language
                  </span>
                  <select
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-xs outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={aiDraftLang}
                    onChange={(e) =>
                      setAiDraftLang(e.target.value as "km" | "en")
                    }
                  >
                    <option value="km">Khmer first (km)</option>
                    <option value="en">English (en)</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                disabled={requestState.loading}
              >
                {requestState.loading ? "Starting..." : "Start AI draft"}
              </button>
              <p className="mt-2 text-[11px] text-zinc-500">
                On success, the draft ID and first follow-up question will be
                populated below.
              </p>
            </form>

            <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Step 2–3: Answer questions & confirm
              </h3>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">
                  Draft ID
                </span>
                <input
                  className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  value={aiDraftId}
                  onChange={(e) => setAiDraftId(e.target.value)}
                  placeholder="Auto-filled after start, or paste existing ID"
                />
              </label>
              <div className="rounded border border-dashed border-zinc-300 bg-white p-2 text-xs text-zinc-700">
                <div className="mb-1 font-medium">Current AI question</div>
                <p className="whitespace-pre-wrap">
                  {aiDraftLastQuestion || "Start a draft to see the first question."}
                </p>
              </div>
              <form
                onSubmit={handleAnswerAiDraft}
                className="space-y-2 text-sm"
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Your answer
                  </span>
                  <textarea
                    className="min-h-[80px] w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={aiDraftAnswer}
                    onChange={(e) => setAiDraftAnswer(e.target.value)}
                    placeholder="Reply in Khmer or English, describing how to use, skin type, etc."
                  />
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800"
                    disabled={requestState.loading}
                  >
                    {requestState.loading ? "Sending..." : "Send answer"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100"
                    onClick={handleConfirmAiDraft}
                    disabled={requestState.loading || !aiDraftId}
                  >
                    Confirm draft (create product)
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100"
                    onClick={handleListAiDrafts}
                    disabled={requestState.loading}
                  >
                    List active drafts
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100"
                    onClick={handleGetAiDraft}
                    disabled={requestState.loading || !aiDraftId}
                  >
                    Get draft by ID
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                1. Sign up
              </h2>
              <form onSubmit={handleSignUp} className="space-y-2 text-sm">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Name
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Email
                  </span>
                  <input
                    type="email"
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Password
                  </span>
                  <input
                    type="password"
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  {requestState.loading ? "Submitting..." : "Sign up"}
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                2. Sign in
              </h2>
              <form onSubmit={handleSignIn} className="space-y-2 text-sm">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Email
                  </span>
                  <input
                    type="email"
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Password
                  </span>
                  <input
                    type="password"
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  {requestState.loading ? "Submitting..." : "Sign in"}
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                3–5. Session & profile
              </h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800"
                  onClick={handleGetSession}
                  disabled={requestState.loading}
                >
                  Get session (/api/auth/get-session)
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100"
                  onClick={handleGetMe}
                  disabled={requestState.loading}
                >
                  Get profile (/me)
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100"
                  onClick={handleSignOut}
                  disabled={requestState.loading}
                >
                  Sign out
                </button>
              </div>
              <form onSubmit={handleUpdateMe} className="mt-4 space-y-2 text-sm">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Full name (PATCH /me)
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800"
                    disabled={requestState.loading}
                  >
                    Update name
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded border border-red-200 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50"
                    onClick={handleDeactivateMe}
                    disabled={requestState.loading}
                  >
                    Deactivate account
                  </button>
                </div>
              </form>
              <p className="mt-2 text-xs text-zinc-500">
                These endpoints match examples 3–7 in
                <code className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
                  backend/README.md
                </code>
                .
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                8. Create tenant (store)
              </h2>
              <form onSubmit={handleCreateTenant} className="space-y-2 text-sm">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Shop name
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="My Beauty Store"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Shop type
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={shopType}
                    onChange={(e) => setShopType(e.target.value)}
                    placeholder="beauty_cosmetics"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Description
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={tenantDescription}
                    onChange={(e) => setTenantDescription(e.target.value)}
                    placeholder="Khmer beauty products"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Address text
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={tenantAddress}
                    onChange={(e) => setTenantAddress(e.target.value)}
                    placeholder="Phnom Penh"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Google Maps URL
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={tenantGoogleMapUrl}
                    onChange={(e) => setTenantGoogleMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Logo URL (optional)
                    </span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      value={tenantLogoUrl}
                      onChange={(e) => setTenantLogoUrl(e.target.value)}
                      placeholder="Cloudinary logo URL"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Banner URL (optional)
                    </span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      value={tenantBannerUrl}
                      onChange={(e) => setTenantBannerUrl(e.target.value)}
                      placeholder="Cloudinary banner URL"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  {requestState.loading ? "Submitting..." : "Create tenant"}
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                9. Upload logo/banner (Cloudinary)
              </h2>
              <form onSubmit={handleTenantUpload} className="space-y-2 text-sm">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr),auto]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Image file
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setTenantUploadFile(e.target.files?.[0] ?? null)
                      }
                      className="w-full text-xs"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-zinc-600">
                      Type
                    </span>
                    <select
                      className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-xs outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      value={tenantUploadType}
                      onChange={(e) =>
                        setTenantUploadType(e.target.value as "logo" | "banner")
                      }
                    >
                      <option value="logo">logo</option>
                      <option value="banner">banner</option>
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  {requestState.loading ? "Uploading..." : "Upload image"}
                </button>
                <p className="mt-2 text-xs text-zinc-500">
                  This calls
                  <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
                    POST /tenants/upload-url
                  </code>
                  and returns the Cloudinary upload payload described in the
                  backend README.
                </p>
              </form>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Public storefront helpers
              </h2>
              <form
                onSubmit={handleCheckSubdomain}
                className="space-y-2 text-sm"
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Shop name (check subdomain availability)
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={subdomainShopName}
                    onChange={(e) => setSubdomainShopName(e.target.value)}
                    placeholder="My Beauty Store"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  Check /tenants/subdomain-available
                </button>
              </form>

              <form
                onSubmit={handleStoreProfileBySubdomain}
                className="mt-4 space-y-2 text-sm"
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Store subdomain (for public profile)
                  </span>
                  <input
                    className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    value={storeSubdomain}
                    onChange={(e) => setStoreSubdomain(e.target.value)}
                    placeholder="my-shop"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  disabled={requestState.loading}
                >
                  Get /store/by-subdomain/:subdomain
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
            Last response
          </h2>
          {requestState.loading && (
            <p className="mb-2 text-xs text-zinc-500">Sending request…</p>
          )}
          {requestState.error && (
            <p className="mb-2 text-xs font-medium text-red-600">
              {requestState.error}
            </p>
          )}
          <pre className="max-h-80 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-100">
            {requestState.response || "// Send a request to see the response"}
          </pre>
        </section>
      </main>
    </div>
  );
}
