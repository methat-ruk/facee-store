# Facee Architecture

## Summary

Facee is a two-app TypeScript project for a localized skincare storefront.
The repository uses:

- `frontend/`: Next.js 16 App Router storefront
- `backend/`: NestJS 11 API
- `PostgreSQL + Prisma`: product, category, and order data model

The current product focus is the **public storefront**. Admin flows, checkout,
and real authentication are still planned, not implemented.

## System Shape

### Frontend

The frontend is a locale-prefixed Next.js application built around:

- `src/app/[locale]` for route entrypoints
- `src/features` for product and page-level feature modules
- `src/components/ui` for shadcn/ui source components
- `src/components/shared` and `src/components/storefront` for shared
  compositions
- `src/i18n` and `src/messages` for route i18n
- `src/store` for lightweight client state

Current public routes:

- `/[locale]/products`
- `/[locale]/products/[slug]`
- `/[locale]/login`
- `/[locale]/register`

Route `/` redirects to the default locale storefront entry.

### Backend

The backend is a NestJS API with a small storefront-oriented module set:

- `health`: service health response
- `categories`: storefront category listing
- `products`: storefront product listing and product detail by slug

Supporting layers:

- `src/config` for environment parsing and constants
- `src/prisma` for Prisma service/module wiring
- `src/common` for shared guards/interceptors placeholders

The backend currently exposes read-focused storefront endpoints only. Admin
modules and auth flows are still planned.

## Runtime Data Flow

### Catalog

1. Next.js server/client UI calls the shared Axios service layer.
2. Frontend requests `GET /api/categories` and `GET /api/products`.
3. NestJS validates query params and reads published products from Prisma.
4. Frontend renders filters, cards, pagination, and localized copy.

### Product Detail

1. Route `/[locale]/products/[slug]` resolves the slug server-side.
2. Frontend requests `GET /api/products/:slug`.
3. Backend returns the published product plus related products.
4. Frontend renders gallery, detail tabs, and a UI-only add-to-cart panel.

### Localization

Facee uses two localization layers:

- `next-intl` for UI chrome, labels, navigation, and page text
- `localized-content.ts` for product/category copy that is not yet stored as
  localized backend content

This keeps the current implementation simple while making the storefront usable
in both `en` and `th`.

## Data Model

Current Prisma storefront-relevant models:

- `Category`
- `Product`
- `Order`
- `OrderItem`
- `User`

Current product detail content includes:

- `name`
- `slug`
- `subtitle`
- `description`
- `howToUse`
- `benefits`
- `ingredients`
- `galleryImages`
- `imageUrl`
- `price`
- `stock`
- `isPublished`

## Frontend State

Current client-side state is intentionally small:

- theme preference
- locale-aware navigation state
- UI-only cart store for PDP interactions

The cart state is not yet connected to backend order creation or checkout.

## Styling and Design System

Facee uses a shadcn/ui-first setup:

- shared primitives in `frontend/src/components/ui`
- app-level compositions in `frontend/src/components`
- semantic theme tokens in `frontend/src/app/globals.css`

The goal is consistent UI behavior without repeating one-off component styles.

## What Exists vs. What Is Planned

### Implemented now

- localized storefront shell
- catalog page
- product detail page
- login/register UI pages
- theme toggle
- locale switching
- NestJS storefront API
- Prisma schema, migrations, and seed data

### Planned next

- real auth flow
- cart page and checkout
- admin authentication
- admin dashboard and product management
- deployment docs and production hosting polish
