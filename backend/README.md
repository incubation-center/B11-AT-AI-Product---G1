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

## Frontend checklist

- Set `NEXT_PUBLIC_API_URL`.
- Use `Content-Type: application/json` for POST auth requests.
- Send `Authorization: Bearer <token>` for `/me`.
- For cookie-based session reads, include `credentials: "include"` on frontend requests.
- Use `/docs` during development to inspect request/response schema quickly.
