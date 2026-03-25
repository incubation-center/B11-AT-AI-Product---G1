# B11-AT-AI-Product---G1

Documentation:

- Backend API and implementation notes: `backend/README.md`
- Frontend notes: `frontend/README.md`

## Docker

### Build and run with Docker Compose

```sh
docker compose up -d --build
```

Services and exposed ports:

- Frontend: `3000`
- Backend: `8080`

### Required environment variables

- Copy `backend/.env.example` to `backend/.env` and fill all required backend secrets.
- For frontend build/runtime, set `NEXT_PUBLIC_API_URL`.

Example (local compose default):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

For production (Coolify/VPS), set:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain
```
