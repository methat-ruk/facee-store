# Facee

<p align="center">
  <img src="./frontend/public/images/brand/facee-logo.png" alt="Facee Skincare Store Logo" width="220" />
</p>

<p align="center">
  <strong>A localized skincare storefront project built with Next.js, NestJS, Prisma, and PostgreSQL.</strong>
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

**Facee** is a full-stack skincare commerce project designed to feel like a
real storefront product rather than a static UI exercise.

The repo currently includes:

- a localized Next.js storefront with `en` and `th` routes
- a NestJS backend for storefront, account, and order APIs
- PostgreSQL + Prisma for product, account, and order data
- a customer cart, checkout, and sandbox payment flow
- customer auth, profile, saved addresses, saved demo cards, and order history
- a dark-only admin portal with overview and order review tools
- real-time notifications for admins and customers via Server-Sent Events
- a shared shadcn/ui-based design system

The project is still in progress. This README keeps both the **implemented
platform baseline** and the **planned next steps** visible so it is easy to
see what exists today and what is still ahead.

## Current Features

### Storefront

- localized routes with `next-intl`
- sticky storefront shell in a single dark theme
- predictive product search with thumbnails, category, and pricing
- product catalog with:
  - category filtering
  - sorting
  - pagination
  - flash sale badges
  - compare-at pricing
- product detail page with:
  - gallery
  - benefits
  - ingredients
  - how-to-use content
  - related products
  - add-to-cart animation
- cart flow with quantity updates and stock-aware refresh
- checkout flow with:
  - saved address selection
  - payment method selection
  - order review
- sandbox payment flow with:
  - QR payment
  - credit/debit card demo form
  - payment method switching before confirmation
- order success page
- customer orders list and order detail pages
- customer profile with:
  - account details
  - saved addresses
  - saved demo cards
- customer notification bell with unread count and real-time order updates
- login, register, logout, and guarded customer routes

### Admin Portal

- locale-aware admin workspace at `/[locale]/admin`
- overview dashboard with:
  - current-period KPI summary
  - cancellation review queue
  - recent orders table
  - low-stock alerts
- admin order list and detail views
- QR payment confirmation from the admin order detail page
- order-level notification badges and automatic mark-as-read behavior
- collapsible sidebar and shared admin shell

### Notifications

- real-time notifications via `GET /api/notifications/stream`
- unread badges for admin order review and customer account updates
- mark-one, mark-order, and mark-all read actions
- right-side full list surface for larger notification histories

### Backend API

- `GET /api/health`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- customer account endpoints for profile, addresses, and saved payment methods
- customer order endpoints for listing, detail, cancellation, and sandbox
  payment confirmation
- admin dashboard and order review endpoints
- notification list, SSE stream, and read-state endpoints

### Data and Content

- Prisma schema and migrations
- seeded skincare product catalog
- seeded flash sale products and compare-at pricing
- localized UI copy in `en` and `th`
- localized category and product presentation on the frontend

## Planned Features

These are intentionally kept visible and are **not removed** just because they
are not implemented yet.

### Commerce Expansion

- real payment gateway integration
- wishlist/favorites
- shipping calculation beyond the current flat-threshold rule
- coupon or promotion system
- richer customer notifications around order/payment changes

### Authentication

- password reset and email verification
- stronger session/account security hardening
- role and permission expansion beyond the current customer/admin split

### Admin

- admin dashboard expansion beyond overview + orders
- product CRUD
- category management
- flash sale / merchandising controls
- publish/unpublish workflow
- inventory operations
- richer notification management and activity history

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
|-- frontend/
|  |-- public/
|  `-- src/
|     |-- app/
|     |-- components/
|     |-- features/
|     |-- i18n/
|     |-- messages/
|     |-- services/
|     `-- store/
|-- backend/
|  |-- prisma/
|  `-- src/
|     |-- api/
|     |-- common/
|     |-- config/
|     |-- generated/
|     `-- prisma/
`-- docs/
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
npm --prefix backend exec prisma migrate deploy --schema prisma/schema.prisma
npm --prefix backend run db:seed
```

5. Start the project:

```bash
npm run dev
```

Useful local URLs:

- storefront entry: `http://localhost:3000/en`
- storefront catalog: `http://localhost:3000/en/products`
- thai storefront catalog: `http://localhost:3000/th/products`
- admin overview: `http://localhost:3000/en/admin`
- admin orders: `http://localhost:3000/en/admin/orders`
- profile: `http://localhost:3000/en/profile`
- checkout: `http://localhost:3000/en/checkout`
- orders: `http://localhost:3000/en/orders`
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

## Product Intent

Facee is meant to show:

- thoughtful storefront UX
- a believable admin operations foundation
- clean frontend/backend separation
- route i18n and shared UI system design
- practical NestJS + Prisma API work
- real-time product notifications without paid infrastructure
- an honest roadmap instead of pretending the system is already complete
