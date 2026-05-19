# Deployment Guide

## Summary

Facee is currently easiest to deploy as:

- `frontend` on **Vercel**
- `backend` on **Railway** with `backend/` as the service root
- `PostgreSQL` on **Neon**

Docker is also a valid direction for local parity and future self-hosting, but
the repo does not yet include production Docker files.

## Recommended Deployment Shape

### Frontend

Deploy `frontend/` as the public app.

Recommended host:

- Vercel

Required frontend environment variables:

```env
NEXT_PUBLIC_APP_URL=https://your-frontend-domain
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

### Backend

Deploy `backend/` as a separate service.

Examples:

- Railway
- Render
- Fly.io
- self-hosted Node runtime

Required backend environment variables:

```env
PORT=4000
CORS_ORIGINS=https://your-frontend-domain
DATABASE_URL=postgresql://user:password@host:5432/facee?sslmode=verify-full
JWT_ACCESS_SECRET=replace-this-access
JWT_REFRESH_SECRET=replace-this-refresh
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=14
```

For managed PostgreSQL providers, keep TLS explicit in the connection string.
`sslmode=verify-full` preserves certificate verification and host-name
verification, which is the safest compatible setting when the provider presents
a valid public certificate for the database host.

### Database

Use PostgreSQL and apply existing Prisma migrations before seeding or serving
traffic. Neon works well as the managed Postgres target for this repo.

From `backend/`:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Vercel Frontend Flow

1. Push the repository to GitHub
2. Import the repo into Vercel
3. Set the root directory to `frontend`
4. Add frontend environment variables
5. Deploy

Recommended checks before production:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run typecheck`
- `npm --prefix frontend run build`

## Backend Deployment Flow

1. Provision PostgreSQL
2. Provision a Railway service with the root directory set to `backend`
3. Add backend environment variables
4. Run Prisma migrate deploy
5. Run the seed once if you want demo-ready content
6. Start the NestJS app with `npm run start:prod` or `npm run start:start:prod`

Useful backend verification:

- `npm --prefix backend run lint`
- `npm --prefix backend run typecheck`
- `npm --prefix backend run test`
- `npm --prefix backend run build`

Recommended demo credentials after seeding:

- `admin@facee.local` / `password123`
- `customer@facee.local` / `password123`

## Docker Direction

Docker is still a planned next step, but this is the intended structure:

- one container for `frontend`
- one container for `backend`
- one PostgreSQL container for local orchestration
- `docker-compose.yml` for developer startup

Intended future local command:

```bash
docker compose up --build
```

At the moment, Docker should be treated as a documented deployment direction,
not a completed implementation.

## Current Limits

Implemented and deployable today:

- localized storefront
- login/register UI pages with token refresh
- catalog and product detail flow
- NestJS storefront API
- seeded customer/admin demo flows
- polling-friendly notifications snapshot flow

Not production-complete yet:

- third-party auth providers
- payment gateway integration
- production Docker files
- CI/CD deployment automation
