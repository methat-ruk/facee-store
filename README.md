# Facee

<p align="center">
  <img src="./frontend/public/images/brand/facee-logo.png" alt="Facee Skincare Store Logo" width="220" />
</p>

<p align="center">
  <strong>A localized skincare storefront portfolio project built with Next.js, NestJS, Prisma, and PostgreSQL.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-111111?style=for-the-badge&logo=next.js&logoColor=white" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-Backend-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn/ui-Design_System-18181B?style=for-the-badge" />
  <img alt="Zod" src="https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img alt="next-intl" src="https://img.shields.io/badge/next--intl-Route_I18n-0F766E?style=for-the-badge" />
</p>

<p align="center">
  <a href="#overview">Overview</a> |
  <a href="#current-features">Current Features</a> |
  <a href="#planned-features">Planned Features</a> |
  <a href="#tech-stack">Tech Stack</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="#scripts">Scripts</a> |
  <a href="#documentation">Documentation</a>
</p>

## Overview

**Facee** is a full-stack skincare commerce portfolio project designed to feel
like a real storefront product rather than a static UI exercise.

The repo currently includes:

- a localized Next.js storefront with `en` and `th` routes
- a NestJS backend for storefront APIs
- PostgreSQL + Prisma for product and category data
- a product catalog and rich product detail page
- login/register UI screens
- a shared shadcn/ui-based design system

The project is still in progress. This README keeps both the **implemented
storefront baseline** and the **planned next steps** visible so it is easy to
see what exists today and what is still ahead.

## Current Features

### Storefront

- localized routes with `next-intl`
- sticky storefront shell with theme toggle
- product catalog with:
  - category filtering
  - sorting
  - pagination
- product detail page with:
  - gallery
  - benefits
  - ingredients
  - how-to-use content
  - related products
- UI-only add-to-cart interaction
- login and register UI pages

### Backend API

- `GET /api/health`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:slug`

### Data and Content

- Prisma schema and migrations
- seeded skincare product catalog
- localized UI copy in `en` and `th`
- localized category and product presentation on the frontend

## Planned Features

These are intentionally kept visible and are **not removed** just because they
are not implemented yet.

### Commerce Expansion

- real cart page
- checkout flow
- wishlist/favorites
- order summary and order history

### Authentication

- real login/register backend integration
- account session/token flow
- protected customer routes

### Admin

- admin auth
- admin dashboard
- product CRUD
- category management
- publish/unpublish workflow
- order and inventory operations

### Deployment and Operations

- Vercel deployment polish
- Docker setup
- production hosting notes
- API documentation expansion

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- shadcn/ui
- next-intl
- Zustand
- Axios
- Zod

### Backend

- NestJS 11
- TypeScript
- Prisma
- PostgreSQL
- nestjs-zod

## Project Structure

```text
facee/
├─ frontend/
│  ├─ public/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     ├─ features/
│     ├─ i18n/
│     ├─ messages/
│     ├─ services/
│     └─ store/
├─ backend/
│  ├─ prisma/
│  └─ src/
│     ├─ api/
│     ├─ config/
│     ├─ generated/
│     └─ prisma/
└─ docs/
```

For the current runtime boundaries and data flow, see
[ARCHITECTURE.md](./ARCHITECTURE.md).

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set up environment files:

- copy `frontend/.env.example` to `frontend/.env.local`
- copy `backend/.env.example` to `backend/.env`

3. Create the `facee` PostgreSQL database

4. Run migrations and seed data:

```bash
npm --prefix backend run db:migrate -- --name init
npm --prefix backend run db:seed
```

5. Start the project:

```bash
npm run dev
```

Useful local URLs:

- storefront: `http://localhost:3000/en/products`
- thai storefront: `http://localhost:3000/th/products`
- api health: `http://localhost:4000/api/health`

Full setup details are in [docs/SETUP.md](./docs/SETUP.md).

## Scripts

From the repo root:

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

Useful targeted scripts:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run typecheck:watch
npm --prefix backend run test
npm --prefix backend run db:seed
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/SETUP.md](./docs/SETUP.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/API.md](./docs/API.md)
- [docs/ROADMAP.md](./docs/ROADMAP.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Portfolio Intent

Facee is meant to show:

- thoughtful storefront UX
- clean frontend/backend separation
- route i18n and shared UI system design
- practical NestJS + Prisma API work
- an honest product roadmap instead of a fake “finished” system
