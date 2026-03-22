# Frontend Guide

## Run the frontend

Install dependencies:

```sh
npm install
```

Start dev server:

```sh
npm run dev
```

Default URL: `http://localhost:3000`

## Environment

Set the backend base URL in `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

For Telegram Mini App on a real phone, do not use `localhost`. Use the public backend URL instead:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain
```

## App surfaces

The frontend currently has two main surfaces:

1. Normal web app

- route: `/`
- uses Better Auth-based web login/session flow
- talks to standard owner endpoints such as `/products`, `/orders`, `/me/tenant`

2. Telegram Mini App

- route: `/telegram`
- opened from the Telegram bot using Telegram `web_app`
- authenticates with Telegram `initData`, not Better Auth browser login
- talks to `/telegram/miniapp/*` backend endpoints

## How frontend connects to backend

### Normal web app flow

1. User signs in with Better Auth
2. Frontend uses session/bearer auth
3. Frontend calls normal owner routes:

- `/me`
- `/me/tenant`
- `/products`
- `/orders`

### Telegram Mini App flow

1. User links Telegram account in the bot with `/connect <code>`
2. User taps `Open Dashboard` in the bot
3. Telegram opens frontend route `/telegram`
4. Frontend reads `window.Telegram.WebApp.initData`
5. Frontend sends that to:

```http
POST /telegram/miniapp/session
```

6. Backend verifies Telegram signature and returns a Mini App bearer token
7. Frontend uses that token for:

- `/telegram/miniapp/bootstrap`
- `/telegram/miniapp/tenant`
- `/telegram/miniapp/products`
- `/telegram/miniapp/orders`

Important:

- the Mini App does not use the normal Better Auth login flow
- the Mini App does not directly call the normal `/products` route group
- backend services are shared, but the auth/route entry is different

## Telegram Mini App route

Route:

- `/telegram`

Current sections:

- Dashboard
- Store management
- Product management
- Order management

## Telegram Mini App troubleshooting

### `Failed to fetch`

Usually means the Mini App frontend cannot reach the backend.

Check:

- `NEXT_PUBLIC_API_URL` is public HTTPS, not `localhost`
- backend is reachable from the internet
- backend CORS allows the frontend domain

### `initData is required`

Usually means frontend reached backend, but Telegram `initData` was empty.

Check:

- you opened from Telegram bot `Open Dashboard`, not a normal browser URL
- you are testing from Telegram mobile app
- the Telegram WebApp script had time to initialize

### `Open this from Telegram or paste initData below for testing`

Means the page is running outside Telegram WebApp context.

That is expected if you open `/telegram` directly in a browser.

## Backend routes used by the frontend

### Normal web app routes

- `/api/auth/*`
- `/me`
- `/me/tenant`
- `/tenants`
- `/products`
- `/orders`

### Telegram Mini App routes

- `/telegram/miniapp/session`
- `/telegram/miniapp/bootstrap`
- `/telegram/miniapp/tenant`
- `/telegram/miniapp/tenant/assets`
- `/telegram/miniapp/products`
- `/telegram/miniapp/products/:id`
- `/telegram/miniapp/products/:id/images`
- `/telegram/miniapp/orders`
- `/telegram/miniapp/orders/:id`
- `/telegram/miniapp/inventory/low-stock`

## Local development notes

Normal web app development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Telegram Mini App development on a phone:

- frontend must be available on public HTTPS
- backend must be available on public HTTPS
- Telegram bot must point to the public frontend Mini App URL

## Build note

This frontend currently uses `next/font` with Google font fetching in `app/layout.tsx`.
In restricted or offline environments, `next build` may fail if Google Fonts cannot be reached.
