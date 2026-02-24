You are my senior full-stack/backend architect and TypeScript engineer.

PROJECT: CoolHat (MVP)
CoolHat is a multi-tenant SaaS storefront builder for Cambodian SMEs with a mandatory AI shop assistant.
The MVP is owner-only: no staff roles. Each user can create only one store.

GOAL
Ship an MVP backend that lets an owner:
- Register/login (Better Auth)
- Create a store later after login (tenant)
- Add products (optionally with size/color variants)
- Accept orders (COD + ABA transfer)
- Automatically manage stock lifecycle
- Provide analytics + Telegram reporting
- Provide Khmer-first AI chat assistant via RAG (Gemini + Pinecone)
- Use AI-assisted product onboarding: chat-like Q&A, one question at a time, before saving product

TECH STACK
- Backend: HonoJS + TypeScript
- DB: Supabase Postgres (Drizzle ORM + migrations)
- Auth: Better Auth
- Email: Resend (email verification + password reset emails)
- Storage: Supabase Storage for product images (store URLs in DB)
- Vector DB: Pinecone (namespace must equal tenant_id)
- LLM: Gemini (for product Q&A flow + chat answers)

CORE RULES (NON-NEGOTIABLE)
1) Multi-tenant isolation:
   - All business tables must include tenant_id.
   - Every query must be filtered by tenant_id.
   - No cross-tenant data access.
2) Store access:
   - Subdomain-only. No custom domains.
   - Public storefront resolves tenant from Host header subdomain: {subdomain}.coolhat.com
3) Currency:
   - Owner manually inputs both USD and KHR fields. No conversion.
4) Variants:
   - Product variants support size/color optionally per product.
5) Orders:
   - Payment methods: COD and ABA transfer.
   - Delivery includes address_text and optional google_map_url.
   - Orders must be immutable records: store snapshots in order_items:
     - product_name_snapshot
     - price_snapshot
     - variant_snapshot (size/color)
6) Inventory lifecycle:
   - Reduce stock when order status becomes "confirmed".
   - Restore stock if a previously confirmed order becomes "cancelled".
   - Prevent negative stock.
   - Low stock alerts when stock_qty <= low_stock_threshold.
7) Analytics:
   - Revenue counts only when payment_status = "paid".
   - Provide daily/monthly/overview/lowstock metrics.
8) RAG + Re-embedding:
   - Pinecone namespace = tenant_id.
   - Index store profile and product knowledge (including variants, prices, stock, usage, FAQ).
   - Re-embed when tenant/product/variant changes:
     - delete old vectors (by metadata) then upsert new vectors.
9) Khmer support:
   - Database stores single text fields (name/description/tenant description).
   - AI must behave Khmer-first: respond in Khmer if user is Khmer or unclear.

AI-ASSISTED PRODUCT ONBOARDING (KEY FLOW)
When owner adds a product:
1) Owner submits minimal details (name, prices, category optional).
2) Gemini generates ONE clarification question at a time (chat-like).
3) Owner answers; repeat until enough info.
4) Final payload must include structured:
   - clear description
   - how to use / key details
   - size/color availability if relevant
   - common FAQs a shop assistant would know
5) On confirm:
   - Save product + variants to Postgres
   - Index to Pinecone with structured context text

BACKEND MODULE BUILD ORDER (DO THIS EXACTLY)
1) Foundations:
   - env validation
   - Drizzle client + schema + migrations
   - global error handler
2) Better Auth + Resend:
   - mount /api/auth/*
   - requireAuth middleware
   - /me endpoints (profile + tenant status)
3) Tenant:
   - create store after login only if no tenant
   - subdomain available check
   - public store profile by subdomain
   - index tenant to Pinecone
4) Products + Variants (manual CRUD first):
   - CRUD + images upload
5) Orders + Inventory:
   - checkout create order + items with snapshots
   - status transitions + stock reduce/restore
6) Analytics:
   - daily/monthly/overview/lowstock
7) AI product drafts:
   - /products/ai/start, /answer, /confirm
8) RAG indexing + Chat:
   - /rag/index/tenant, /rag/index/product/:id, /chat
9) Telegram:
   - owner linking + analytics commands (/daily /monthly /overview /lowstock)
   - low stock alert notifications

DELIVERABLES EXPECTED FROM YOU
- A clean Hono folder structure (routes thin, services contain business logic)
- Drizzle schema and migrations
- Route definitions + middleware for auth and tenant resolution
- Implementation guidance for inventory lifecycle + snapshot safety
- RAG indexing pipeline and Khmer-first chat prompt structure
- Avoid scope creep beyond MVP

When you respond, be precise and step-by-step.
If something is ambiguous, make a reasonable MVP assumption and continue.
Do not suggest adding staff roles or customer accounts in MVP.