# skill.md — CoolHat Backend (Codex)

## Objective
Build the CoolHat MVP backend as an **owner-only** multi-tenant SaaS:
- **1 user = 1 store (tenant)**
- Storefront via **subdomain only**: `{subdomain}.coolhat.com`
- Backend stack: **HonoJS + TypeScript + Drizzle ORM + Supabase (Auth/Postgres/Storage) + Pinecone + Gemini**
- Mandatory AI shop assistant:
  - Store profile indexed to Pinecone on tenant create/update
  - Products created via **chat-like Q&A** (one question at a time)
  - Product/variant updates trigger **re-embedding**
- Orders: **COD + ABA transfer**, address text + Google Map link
- Post-order operations: **stock lifecycle**, **analytics**, **Telegram reporting**, **low stock alerts**
- Khmer support is required (Khmer-first behavior; DB stores single text fields)

---

## Non-goals (MVP)
- No staff roles, no RBAC beyond owner-only
- No custom domain
- No automated currency conversion (owner inputs USD + KHR manually)
- No complex warehouse/returns/refund workflows beyond basic statuses

---

## Repo Layout (recommended)
- `apps/api/` — HonoJS backend
- `packages/db/` — Drizzle schema + migrations
- `packages/shared/` — shared types/constants (optional)

---

## Tech Decisions
- Runtime: Bun (preferred) or Node.js (TS)
- DB: Supabase Postgres (Drizzle migrations)
- Auth: Supabase Auth (email/password). Backend verifies JWT.
- Storage: Supabase Storage for product images (store URLs in DB).
- Vector DB: Pinecone namespace = `tenant_id`.
- LLM: Gemini for product Q&A + chat completion.

---

## Build Order (must follow)
1. **Auth + /me**
2. **Tenant** (create later after login) + subdomain resolution
3. **Products + Variants** (manual CRUD first)
4. **Orders + Inventory lifecycle**
5. **Analytics endpoints**
6. **AI Product Draft Q&A flow**
7. **RAG indexing + Chat endpoints**
8. **Telegram linking + Telegram reporting commands**
9. Hardening: indexes, validation, rate limits, error handling

---

## Core Middleware
### `requireAuth`
- Validate Supabase JWT from `Authorization: Bearer <token>`
- Extract `userId`
- Load user record from DB
- Reject if `is_active=false`

### `requireTenant`
- Ensure user has `tenant_id`
- Attach `tenantId` to request context for owner routes

### `resolveTenantFromHost` (public storefront)
- Parse `Host` header to get subdomain
- Load tenant by `subdomain`
- Attach `tenantId` to request context for public endpoints

---

## Database Schema (Postgres types)

### Enums
- `shop_type`: `beauty_cosmetics | fashion | food_beverage | electronic | services | others`
- `order_status`: `pending | confirmed | delivering | completed | cancelled`
- `payment_method`: `cod | aba_transfer`
- `payment_status`: `unpaid | paid | refunded`

### Tables
#### `users`
- `id uuid PK` (Supabase auth id)
- `email text UNIQUE NOT NULL`
- `full_name text NULL`
- `tenant_id uuid NULL FK -> tenants.id`
- `is_active boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `tenants`
- `id uuid PK`
- `owner_user_id uuid UNIQUE NOT NULL FK -> users.id` (enforces 1 user = 1 store)
- `shop_name text NOT NULL`
- `shop_type shop_type NOT NULL`
- `description text NULL`
- `address_text text NULL`
- `google_map_url text NULL`
- `logo_url text NULL`
- `banner_url text NULL`
- `subdomain text UNIQUE NOT NULL`
- `is_active boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `products`
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `name text NOT NULL`
- `description text NULL`
- `category text NULL`
- `base_price_usd numeric(12,2) NOT NULL`
- `base_price_khr numeric(12,0) NOT NULL`
- `track_inventory boolean NOT NULL DEFAULT true`
- `stock_qty integer NOT NULL DEFAULT 0`
- `low_stock_threshold integer NOT NULL DEFAULT 5`
- `has_variants boolean NOT NULL DEFAULT false`
- `image_urls text[] NOT NULL DEFAULT '{}'`
- `is_active boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `product_variants`
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `product_id uuid NOT NULL FK -> products.id`
- `size text NULL`
- `color text NULL`
- `price_usd numeric(12,2) NULL`
- `price_khr numeric(12,0) NULL`
- `stock_qty integer NOT NULL DEFAULT 0`
- `low_stock_threshold integer NOT NULL DEFAULT 5`
- `is_active boolean NOT NULL DEFAULT true`

#### `product_drafts` (AI Q&A flow)
- `id uuid PK`
- `tenant_id uuid NOT NULL`
- `status text NOT NULL` (`draft|questioning|ready|confirmed|cancelled`)
- `lang text NOT NULL` (`km|en`, default `km`)
- `initial_input jsonb NOT NULL`
- `questions jsonb NULL`
- `answers jsonb NULL`
- `final_payload jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `orders`
- `id uuid PK`
- `tenant_id uuid NOT NULL`
- `order_no text NOT NULL` (unique per tenant)
- `customer_name text NOT NULL`
- `customer_phone text NULL`
- `address_text text NOT NULL`
- `google_map_url text NULL`
- `status order_status NOT NULL`
- `payment_method payment_method NOT NULL`
- `payment_status payment_status NOT NULL DEFAULT 'unpaid'`
- `currency text NOT NULL` (`USD` or `KHR`)
- `subtotal numeric(12,2) NOT NULL`
- `discount numeric(12,2) NOT NULL DEFAULT 0`
- `total numeric(12,2) NOT NULL`
- `notes text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `order_items`
- `id uuid PK`
- `tenant_id uuid NOT NULL`
- `order_id uuid NOT NULL`
- `product_id uuid NOT NULL`
- `variant_id uuid NULL`
- `product_name_snapshot text NOT NULL`
- `variant_snapshot jsonb NULL`
- `price_snapshot numeric(12,2) NOT NULL`
- `qty integer NOT NULL`
- `line_total numeric(12,2) NOT NULL`

#### `payments`
- `id uuid PK`
- `tenant_id uuid NOT NULL`
- `order_id uuid NOT NULL`
- `method payment_method NOT NULL`
- `amount numeric(12,2) NOT NULL`
- `reference text NULL` (ABA ref)
- `status text NOT NULL` (`pending|confirmed|failed`)
- `paid_at timestamptz NULL`

#### `chat_sessions`, `chat_messages`
- sessions: `tenant_id`, `channel(web|telegram)`, `language(km|en)`, `anonymous_id?`
- messages: `session_id`, `role(user|assistant|system)`, `content`

#### `telegram_links` (owner-only)
- `tenant_id uuid PK`
- `telegram_user_id bigint UNIQUE`
- `linked_at timestamptz`

---

## Inventory Lifecycle Rules
- Reduce stock when order status becomes **confirmed**
- Restore stock if a previously confirmed order becomes **cancelled**
- Prevent negative stock (validate before confirm)
- Low stock alert when `stock_qty <= low_stock_threshold`

---

## Analytics Rules
- Revenue counts only when `payment_status = 'paid'`
- Provide endpoints:
  - `/analytics/daily`
  - `/analytics/monthly`
  - `/analytics/overview`
  - `/analytics/lowstock`

Telegram commands mirror analytics:
- `/daily`, `/monthly`, `/overview`, `/lowstock`

---

## RAG + Re-Embedding Rules (Pinecone + Gemini)
- Pinecone namespace = `tenant_id`
- Index:
  - tenant profile on tenant create/update
  - product knowledge on product/variant create/update/deactivate
- On update:
  - delete old vectors (filter by `product_id` metadata) then upsert new
- Chat behavior:
  - Khmer-first
  - prefer in-stock variants
  - ask max **1 clarification** when user is vague
  - return recommended product ids + prices + availability

---

## API Surface (minimum)
### Auth/Profile
- `GET /me`
- `PATCH /me`
- `PATCH /me/deactivate`

### Tenant
- `GET /me/tenant`
- `GET /tenants/subdomain-available?subdomain=...`
- `POST /tenants`
- `PATCH /tenants/:id`
- `GET /store/by-subdomain/:subdomain`

### Products
- `POST /products`
- `GET /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `PATCH /products/:id/deactivate`
- `PATCH /products/:id/stock`
- `POST /products/:id/images`
- Variants:
  - `POST /products/:id/variants`
  - `PATCH /variants/:id`
  - `PATCH /variants/:id/stock`
  - `PATCH /variants/:id/deactivate`

### Orders
- `POST /checkout` (public storefront uses subdomain)
- `GET /orders`
- `GET /orders/:id`
- `PATCH /orders/:id/status`
- `PATCH /orders/:id/payment`
- `POST /orders/:id/cancel`

### AI Product Draft Q&A
- `POST /products/ai/start`
- `POST /products/ai/answer`
- `POST /products/ai/confirm`

### RAG/Chat
- `POST /rag/index/tenant`
- `POST /rag/index/product/:id`
- `DELETE /rag/index/product/:id`
- `POST /chat`
- `POST /chat/telegram`

### Telegram Linking
- `POST /telegram/link-code`
- `POST /telegram/link`

---

## Env Vars (example)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `DATABASE_URL` (Supabase Postgres connection)
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `APP_BASE_DOMAIN=coolhat.com`

---

## Acceptance Criteria (Definition of Done)
- User can login; `/me` works
- User can create store after login if no tenant
- Tenant isolation verified (cannot access other tenant data)
- Products + variants CRUD works + images upload
- Checkout creates orders with snapshots
- Stock reduces on confirm and restores on cancel
- Analytics endpoints return correct values
- Product AI draft Q&A produces a product with usage + variants
- Product update triggers vector re-index
- Chat retrieves tenant-specific context and answers Khmer-first
- Telegram reports daily/monthly/overview/lowstock

---

## Testing Checklist
- Unit: middleware tenant scoping, status transitions, stock updates
- Integration: checkout transaction, confirm order stock reduction
- Security: access other tenant id forbidden
- RAG: updating product changes answer behavior (re-embedding verified)