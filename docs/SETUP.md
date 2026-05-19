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
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/facee
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=14
```

For hosted PostgreSQL providers such as Neon, prefer an explicit secure SSL
mode in `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:password@host:5432/facee?sslmode=verify-full
```

Keep the plain local URL for local Postgres instances that do not expose TLS.

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

Each seed run resets demo users and rebuilds the showcase data set:

- admin login: `admin@facee.local` / `password123`
- customer login: `customer@facee.local` / `password123`
- customer addresses: Home and Office
- customer payment methods: Main Visa and SCB Everyday QR
- customer orders:
  - pending checkout payment (`NOT_STARTED`)
  - QR submitted and waiting for admin review (`QR_SUBMITTED`)
  - QR confirmed and paid (`QR_CONFIRMED`)
  - card-completed paid history (`CARD_COMPLETED`)
  - packing with cancellation request
  - refunded history
- notifications: seeded for both admin and customer accounts

If you are creating a new local migration while developing schema changes:

```bash
npm --prefix backend run db:migrate -- --name your_migration_name
```

## Install Dependencies

```bash
npm install --prefix frontend
npm install --prefix backend
```

## Run the Project

Start the backend and frontend in separate terminals:

```bash
npm --prefix backend run start:dev
npm --prefix frontend run dev
```

This starts:

- frontend on `http://localhost:3000`
- backend on `http://localhost:4000`

Auth now uses bearer tokens. The frontend stores the access token for API
calls and automatically refreshes it with the stored refresh token when
possible.

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

```bash
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run test
```

Optional full verification:

```bash
npm --prefix frontend run build
npm --prefix backend run build
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
- `NEXT_PUBLIC_API_URL` points at the running backend `/api` base URL

### Product images are missing

Check that the image files exist under:

- `frontend/public/images/products`

### TypeScript or lint checks fail after route or i18n changes

Run:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run lint
```
