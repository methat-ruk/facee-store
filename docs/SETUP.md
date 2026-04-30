# Setup Guide

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL

## Environment Files

Frontend:

- copy `frontend/.env.example` to `frontend/.env.local`

Backend:

- copy `backend/.env.example` to `backend/.env`

Current frontend variables:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Current backend variables:

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/facee
JWT_SECRET=change-me
COOKIE_SECRET=change-me
```

## Database Setup

1. Create a PostgreSQL database named `facee`
2. Set `DATABASE_URL` in `backend/.env`
3. Apply migrations
4. Seed the database

Commands:

```bash
npm --prefix backend exec prisma migrate deploy --schema prisma/schema.prisma
npm --prefix backend run db:seed
```

If you are creating a new local migration while developing schema changes:

```bash
npm --prefix backend run db:migrate -- --name your_migration_name
```

## Install Dependencies

From the repo root:

```bash
npm install
```

## Run the Project

From the repo root:

```bash
npm run dev
```

This starts:

- frontend on `http://localhost:3000`
- backend on `http://localhost:4000`

## Useful URLs

- storefront entry: `http://localhost:3000/en`
- storefront catalog: `http://localhost:3000/en/products`
- thai storefront catalog: `http://localhost:3000/th/products`
- login: `http://localhost:3000/en/login`
- register: `http://localhost:3000/en/register`
- profile: `http://localhost:3000/en/profile`
- cart: `http://localhost:3000/en/cart`
- checkout: `http://localhost:3000/en/checkout`
- orders: `http://localhost:3000/en/orders`
- api health: `http://localhost:4000/api/health`
- categories API: `http://localhost:4000/api/categories`
- products API: `http://localhost:4000/api/products`

## Verification

From the repo root:

```bash
npm run lint
npm run typecheck
npm run test
```

Optional full verification:

```bash
npm run build
```

## Troubleshooting

### Backend says it cannot find `dist/main.js`

Run the backend build once and make sure the current build config is being used:

```bash
npm --prefix backend run build
```

### Frontend loads but no products appear

Check:

- PostgreSQL is running
- `DATABASE_URL` is correct
- migrations have been applied
- seed data has been inserted

### Product images are missing

Check that the image files exist under:

- `frontend/public/images/products`

### TypeScript or lint checks fail after route or i18n changes

Run:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run lint
```
