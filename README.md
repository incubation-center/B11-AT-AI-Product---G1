# B11-AT-AI-Product---G1

An AI-powered multi-tenant store platform built with a **microservice architecture**.

## Architecture

The backend is split into four independent services that share the same Bun + Hono + Drizzle codebase and communicate over HTTP.

| Service | Default Port | Responsibility |
|---|---|---|
| **auth-service** | 8081 | Authentication, email verification, API docs |
| **user-service** | 8082 | User profile management (`/me` endpoints) |
| **store-service** | 8083 | Tenant / store management (`/tenants`, `/store` endpoints) |
| **ai-service** | 8084 | RAG indexing & semantic search via Pinecone (internal) |
| **frontend** | 3000 | Next.js web application |

### Service Communication

```
frontend (3000)
    │
    ├──▶ auth-service  (8081)   /api/auth/*
    ├──▶ user-service  (8082)   /me
    └──▶ store-service (8083)   /me/tenant, /tenants/*, /store/*
                │
                └──▶ ai-service (8084)   POST /internal/rag/index/:tenantId
                                         POST /internal/rag/search
```

## Running with Docker Compose

```bash
# 1. Copy and fill in environment variables
cp backend/.env.example backend/.env

# 2. Start all services
docker compose up --build

# 3. Stop all services
docker compose down
```

## Running Locally (development)

```bash
cd backend

# Install dependencies
bun install

# Start individual services in separate terminals
bun run dev:auth    # auth-service  → :8081
bun run dev:user    # user-service  → :8082
bun run dev:store   # store-service → :8083
bun run dev:ai      # ai-service    → :8084

# Or run the original monolith (all services on one port)
bun run dev         # monolith → :8080
```

```bash
cd frontend
npm install
npm run dev         # frontend → :3000
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the required values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret for better-auth session signing |
| `BETTER_AUTH_URL` | Public URL of the auth-service |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `PINECONE_API_KEY` | Pinecone API key (ai-service) |
| `PINECONE_INDEX` | Pinecone index name (ai-service) |
| `AI_SERVICE_URL` | URL of the ai-service (`http://localhost:8084` in dev) |
| `CLOUDINARY_URL` | Cloudinary URL for image uploads (store-service) |

## Database

All services share the same PostgreSQL database managed with Drizzle ORM.

```bash
cd backend
bun run db:push      # push schema changes
bun run db:generate  # generate migration files
bun run db:migrate   # run migrations
```
