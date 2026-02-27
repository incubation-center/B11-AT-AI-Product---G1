# Backend API README

## Run the backend

Install dependencies:

```sh
bun install
```

Start dev server:

```sh
bun run dev
```

Default URL: `http://localhost:8080`

## API Docs

- Swagger UI: `GET /docs` -> `http://localhost:8080/docs`
- OpenAPI JSON: `GET /openapi.json` -> `http://localhost:8080/openapi.json`

## Base URL for frontend

Use this in your frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Then call endpoints with:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
```

## All available endpoints

### Public endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health/root response (`Hello Hono!`) |
| GET | `/docs` | Swagger docs UI |
| GET | `/openapi.json` | OpenAPI spec JSON |

### Auth endpoints (Better Auth)

All auth routes are served under:

- `/api/auth/*`

Common endpoints used by frontend:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Register with name, email, password |
| POST | `/api/auth/sign-in/email` | Login with email and password |
| POST | `/api/auth/sign-out` | Logout current session |
| GET | `/api/auth/get-session` | Get current session |
| POST | `/api/auth/send-verification-email` | Send verification email |
| GET | `/api/auth/verify-email?token=...` | Verify email token |
| POST | `/api/auth/request-password-reset` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |

### Protected profile endpoint

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/me` | Return authenticated user + profile | `Authorization: Bearer <token>` |
| PATCH | `/me` | Update authenticated user `full_name` | `Authorization: Bearer <token>` |
| PATCH | `/me/deactivate` | Deactivate current user (`is_active=false`) | `Authorization: Bearer <token>` |

### Tenant endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/me/tenant` | Check whether current user has created a store | `Authorization: Bearer <token>` |
| POST | `/tenants` | Create store tenant (1 user = 1 store) | `Authorization: Bearer <token>` |
| PATCH | `/me/tenant` | Update current owner store (includes `logo_url`, `banner_url`) | `Authorization: Bearer <token>` |
| PATCH | `/me/tenant/deactivate` | Soft delete store (`is_active=false`) | `Authorization: Bearer <token>` |
| PATCH | `/tenants/:id` | Update current owner's store by tenant id | `Authorization: Bearer <token>` |
| PATCH | `/tenants/:id/deactivate` | Deactivate current owner's store by tenant id | `Authorization: Bearer <token>` |
| POST | `/tenants/upload-url` | Upload `logo`/`banner` image to Cloudinary | `Authorization: Bearer <token>` |
| GET | `/tenants/subdomain-available?shop_name=...` | Validate generated subdomain from shop name | Public |
| GET | `/store/by-subdomain/:subdomain` | Public storefront profile lookup | Public |
| GET | `/store/by-host` | Public storefront profile lookup by host subdomain | Public |

### Product + Variant endpoints

#### Protected owner endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/products` | Create product | `Authorization: Bearer <token>` |
| GET | `/products` | List owner products with search + pagination (`q`, `page`, `page_size`, `include_inactive`) | `Authorization: Bearer <token>` |
| GET | `/products/:id` | Get owner product detail (with variants) | `Authorization: Bearer <token>` |
| PATCH | `/products/:id` | Update product | `Authorization: Bearer <token>` |
| PATCH | `/products/:id/deactivate` | Soft delete product (`is_active=false`) | `Authorization: Bearer <token>` |
| PATCH | `/products/:id/stock` | Update product stock | `Authorization: Bearer <token>` |
| GET | `/inventory/low-stock` | List low-stock products/variants (threshold-based) | `Authorization: Bearer <token>` |
| POST | `/products/:id/variants` | Create variant under a product | `Authorization: Bearer <token>` |
| PATCH | `/variants/:id` | Update variant | `Authorization: Bearer <token>` |
| PATCH | `/variants/:id/stock` | Update variant stock | `Authorization: Bearer <token>` |
| PATCH | `/variants/:id/deactivate` | Soft delete variant (`is_active=false`) | `Authorization: Bearer <token>` |
| POST | `/products/:id/images` | Upload product image to Cloudinary and append to `image_urls[]` (max 3 images/product) | `Authorization: Bearer <token>` |

### Manual RAG indexing endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/rag/index/tenant` | Re-index tenant profile + all tenant products into Pinecone | `Authorization: Bearer <token>` |
| POST | `/rag/index/product/:id` | Delete old vectors then re-index one product (+ variants) into Pinecone | `Authorization: Bearer <token>` |
| DELETE | `/rag/index/product/:id` | Delete one product vector from Pinecone | `Authorization: Bearer <token>` |

#### Public buyer endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/store/by-subdomain/:subdomain/products` | Public list of active products for a store | Public |
| GET | `/store/by-subdomain/:subdomain/products/:id` | Public active product detail (active variants only) | Public |

### AI Product Draft endpoints (one question at a time)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/products/ai/start` | Start AI draft and get first question (`lang` default `km`) | `Authorization: Bearer <token>` |
| POST | `/products/ai/answer` | Submit one answer and receive exactly one next question | `Authorization: Bearer <token>` |
| POST | `/products/ai/confirm` | Confirm draft -> create product + variants, then trigger indexing | `Authorization: Bearer <token>` |
| GET | `/products/ai/drafts` | List active drafts for resume | `Authorization: Bearer <token>` |
| GET | `/products/ai/drafts/:id` | Get one draft for resume | `Authorization: Bearer <token>` |

AI follow-up questions are capped at 5 maximum per draft. The assistant prioritizes high-impact product-knowledge questions, adapts questions by product domain (for example electronics vs beauty), and then prepares the best final draft for confirmation.
`/products/ai/start` supports `product_id` so AI can load full product + variants context from DB.

`POST /products` and `PATCH /products/:id` now auto-start AI analysis in background.

### Buyer assistant endpoint

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/assistant/ask` | Buyer asks shop assistant (RAG + live Supabase facts). Provide `subdomain` in body or use subdomain host. | Public |

If the token is missing/invalid, response is:

```json
{ "message": "Unauthorized" }
```

## Frontend integration guide

### 1) Sign up

```ts
await fetch(`${API_URL}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John",
    email: "user@email.com",
    password: "P@ssw0rd123",
    callbackURL: "http://localhost:3000/welcome",
    rememberMe: true
  })
});
```

### 2) Sign in

```ts
const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@email.com",
    password: "P@ssw0rd123",
    callbackURL: "http://localhost:3000/dashboard",
    rememberMe: true
  })
});
```

### 3) Get session and token

Call:

```ts
const sessionRes = await fetch(`${API_URL}/api/auth/get-session`, {
  method: "GET",
  credentials: "include"
});
const session = await sessionRes.json();
```

Use the returned bearer token (if your flow stores/returns one) and attach it to protected requests.

### 4) Call protected `/me`

```ts
const token = "YOUR_BEARER_TOKEN";

const meRes = await fetch(`${API_URL}/me`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const me = await meRes.json();
```

Expected response shape:

```json
{
  "id": "user-id",
  "email": "user@email.com",
  "emailVerified": true,
  "profile": {
    "fullName": "John",
    "tenantId": null
  }
}
```

### 5) Sign out

```ts
await fetch(`${API_URL}/api/auth/sign-out`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### 6) Update profile full name

```ts
const token = "YOUR_BEARER_TOKEN";

await fetch(`${API_URL}/me`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    full_name: "John Doe"
  })
});
```

### 7) Deactivate account

```ts
const token = "YOUR_BEARER_TOKEN";

await fetch(`${API_URL}/me/deactivate`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### 8) Create tenant (store)

```ts
await fetch(`${API_URL}/tenants`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    shop_name: "My Beauty Store",
    shop_type: "beauty_cosmetics",
    description: "Khmer beauty products",
    address_text: "Phnom Penh",
    google_map_url: "https://maps.google.com/...",
    logo_url: "https://res.cloudinary.com/<cloud>/image/upload/...",
    banner_url: "https://res.cloudinary.com/<cloud>/image/upload/..."
  }),
});
```

If generated subdomain conflicts, API returns `409` and suggestions:

```json
{
  "code": "SUBDOMAIN_CONFLICT",
  "message": "Generated subdomain already exists. Please choose a more unique shop_name. Suggestions are provided just in case.",
  "generatedSubdomain": "my-beauty-store",
  "alternatives": ["my-beauty-store-2", "my-beauty-store-3"]
}
```

### 9) Upload logo/banner image (Cloudinary)

```ts
const form = new FormData();
form.append("type", "logo"); // or "banner"
form.append("file", fileInput.files[0]);

const uploadRes = await fetch(`${API_URL}/tenants/upload-url`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: form,
});

const { upload } = await uploadRes.json();
// upload = { publicUrl, assetId, publicId, resourceType, format, bytes }
```

Save `upload.publicUrl` into `logo_url` or `banner_url` through `POST /tenants` or `PATCH /me/tenant`.
Tenant responses include `subdomain` and `storeUrl` so frontend can render a clickable storefront link.

### Storage env vars

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
PINECONE_API_KEY=...
PINECONE_INDEX=...
PINECONE_VECTOR_DIM=256
PINECONE_NAMESPACE_PREFIX=tenant
STORE_URL_PROTOCOL=http
STORE_BASE_DOMAIN=lvh.me
STORE_URL_PORT=3000
```

### AI draft + OpenAI env vars

```env
OPEN_AI_API=...
OPEN_AI_MODEL=gpt-4o-mini
```

### Product draft indexing migration

New fields were added to `product_drafts`:

- `index_status` (`pending` | `indexed`)
- `index_error`
- `index_attempts`
- `indexed_at`

Migration file:

- `backend/supabase/migrations/0003_product_draft_index_tracking.sql`
- `backend/supabase/migrations/0004_product_knowledge.sql`

Apply migrations with your existing flow before using AI draft confirm in production.

### Local subdomain testing

If tenant subdomain is `my-shop`, generated store URL will be:

`http://my-shop.lvh.me:3000`

You can resolve the store on backend by host using:

`http://my-shop.lvh.me:8080/store/by-host`

## Pinecone tenant indexing (RAG)

Tenant create/update automatically triggers:

`ragService.indexTenant(tenantId)`

Current implementation:

- Uses Pinecone namespace per tenant (`<prefix>-<tenantId>`).
- Indexes one tenant profile vector + product vectors + variant vectors for that tenant.
- Stores graph-like relation metadata for filtering/traversal:
  - `relationTenantNode` (e.g. `tenant:<tenantId>`)
  - `relationNode` (e.g. `product:<productId>`)
  - `entityType` (`tenant_profile`, `product`, `product_variant`)

If Pinecone env vars are missing, indexing is skipped (tenant API still succeeds).

## Product indexing from AI draft confirm

`POST /products/ai/confirm` now:

1. Creates product + variants in Postgres.
2. Triggers Pinecone indexing for that product.
3. If indexing fails, product creation still succeeds and draft is marked as pending retry:
   - `index_status = pending`
   - `index_error = <reason>`
   - `index_attempts` incremented

## Production subdomain setup (`eavheang.me`)

Goal: allow storefronts like `https://my-shop.eavheang.me`.

### 1) DNS

- Add wildcard DNS record:
  - `A` record: `*.eavheang.me` -> your server IP
  - or `CNAME` wildcard if your provider/platform requires it

### 2) SSL/TLS

- Install wildcard certificate for `*.eavheang.me` (and root `eavheang.me`).
- Ensure your reverse proxy/hosting serves HTTPS for wildcard hosts.

### 3) Reverse proxy

- Forward wildcard subdomain traffic to frontend/backend.
- Preserve original `Host` header so backend can resolve tenant from host.

### 4) Backend env for store URL generation

```env
STORE_URL_PROTOCOL=https
STORE_BASE_DOMAIN=eavheang.me
STORE_URL_PORT=
```

With this config, tenant `my-shop` will expose:

`https://my-shop.eavheang.me`

### 5) Backend host-based lookup test (production)

Open:

`https://my-shop.eavheang.me/store/by-host`

It should return the tenant/store for subdomain `my-shop`.

## Frontend checklist

- Set `NEXT_PUBLIC_API_URL`.
- Use `Content-Type: application/json` for POST auth requests.
- Send `Authorization: Bearer <token>` for `/me`.
- For cookie-based session reads, include `credentials: "include"` on frontend requests.
- Use `/docs` during development to inspect request/response schema quickly.
