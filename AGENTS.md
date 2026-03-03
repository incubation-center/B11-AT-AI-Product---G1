# Repository Guidelines

## Project Structure & Module Organization

This repository is split into two apps:

- `backend/`: Bun + TypeScript API built with Hono. Core code lives in `src/`, grouped by `routes/`, `services/`, `db/`, `middleware/`, `auth/`, and `lib/`. SQL migrations live in `backend/supabase/migrations/`.
- `frontend/`: Next.js 16 app-router frontend. Routes and UI entry points live in `app/`; static assets live in `public/`.
- Root docs are minimal; detailed setup notes are in `backend/README.md` and `frontend/README.md`.

## Build, Test, and Development Commands

Run commands from the app you are working on.

- `cd backend && bun install && bun run dev`: install backend deps and start the API on `http://localhost:8080`.
- `cd backend && bun run db:generate|db:push|db:migrate`: manage Drizzle schema and database changes.
- `cd frontend && npm install && npm run dev`: start the Next.js app on `http://localhost:3000`.
- `cd frontend && npm run build`: build the frontend for production.
- `cd frontend && npm run lint`: run ESLint with the Next.js + TypeScript config.

## Coding Style & Naming Conventions

Use TypeScript throughout and match the surrounding file’s formatting. Prefer concise modules and explicit names. Use:

- `camelCase` for variables/functions, `PascalCase` for React components and types, kebab-case for route/service filenames such as `telegram-miniapp.service.ts`.
- Keep route handlers thin; move business logic into `backend/src/services/`.
- Reuse the `@/*` import alias in the frontend when it improves clarity.

## Testing Guidelines

There is no committed automated test suite yet. Until one is added:

- Run `frontend` linting before submitting changes.
- Manually verify affected flows against `backend/README.md` examples and `GET /docs`.
- For backend changes, exercise the relevant endpoint locally and note the verification steps in your PR.

## Commit & Pull Request Guidelines

Recent commits are short, feature-focused, and usually imperative, for example `Fixed the image upload` and `update the RAG and post product flow`. Keep commits concise and scoped to one change.

PRs should include:

- a short summary of user-visible or API-visible changes,
- any required env vars or migration files,
- screenshots for frontend or Telegram Mini App UI updates,
- linked issues or task references when available.

## Pinecone (Vector Database)

MANDATORY: If you need to help with Pinecone, vector databases, embeddings, semantic search, RAG, or recommendations, you MUST read `.agents/PINECONE.md` first to determine:

- What questions to ask the user
- How to select the programming language
- Which guide files to consult for implementation details

Do not proceed with Pinecone-related tasks without consulting the appropriate guide files. Use `.agents/PINECONE.md` as your entry point and follow its "Choosing the Right Guide" section to navigate to the appropriate resources.

### Pinecone Instructions Catalog

- `@./.agents/PINECONE.md`
- `@./.agents/PINECONE-cli.md`
- `@./.agents/PINECONE-python.md`
- `@./.agents/PINECONE-typescript.md`
- `@./.agents/PINECONE-go.md`
- `@./.agents/PINECONE-java.md`
- `@./.agents/PINECONE-quickstart.md`
- `@./.agents/PINECONE-troubleshooting.md`

## Security & Agent Notes

Do not commit `.env` files or secrets. Start from `backend/.env.example` and keep frontend `NEXT_PUBLIC_API_URL` accurate for local vs public Telegram testing.
