# Deployment Guide

## Summary

Facee is currently easiest to deploy as:

- `frontend` on **Vercel**
- `backend` on a separate Node-capable host
- `PostgreSQL` on a managed database service

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
FRONTEND_URL=https://your-frontend-domain
DATABASE_URL=postgresql://user:password@host:5432/facee
JWT_SECRET=replace-this
COOKIE_SECRET=replace-this
```

### Database

Use PostgreSQL and apply existing Prisma migrations before seeding or serving
traffic.

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
2. Provision a Node host for `backend`
3. Add backend environment variables
4. Run Prisma migrate deploy
5. Seed data if needed for demo content
6. Start the NestJS app

Useful backend verification:

- `npm --prefix backend run lint`
- `npm --prefix backend run typecheck`
- `npm --prefix backend run test`
- `npm --prefix backend run build`

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
- login/register UI pages
- catalog and product detail flow
- NestJS storefront API

Not production-complete yet:

- real auth flow
- cart and checkout
- admin dashboard
- production Docker files
- CI/CD deployment automation
