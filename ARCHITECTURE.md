# Facee Architecture

## Summary

Facee is a two-app TypeScript project for a localized skincare storefront.
The repository uses:

- `frontend/`: Next.js 16 App Router storefront
- `backend/`: NestJS 11 API
- `PostgreSQL + Prisma`: product, category, account, and order data model

The current product focus is the **customer storefront**. A customer can browse
products, authenticate, manage account data, create orders, and complete a
sandbox payment step. Full admin tooling is still only partially implemented.

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

Current customer routes:

- `/[locale]`
- `/[locale]/products`
- `/[locale]/products/[slug]`
- `/[locale]/cart`
- `/[locale]/checkout`
- `/[locale]/checkout/payment/[orderNo]`
- `/[locale]/checkout/success/[orderNo]`
- `/[locale]/orders`
- `/[locale]/orders/[orderNo]`
- `/[locale]/profile`
- `/[locale]/login`
- `/[locale]/register`

Current limited admin routes:

- `/[locale]/admin/orders`
- `/[locale]/admin/orders/[orderNo]`

Route `/` redirects to the default locale storefront entry.

### Backend

The backend is a NestJS API with the following module set:

- `health`: service health response
- `categories`: storefront category listing
- `products`: storefront product listing and product detail by slug
- `auth`: customer auth and cookie-backed session restore
- `account`: profile, saved addresses, and saved sandbox payment methods
- `orders`: customer order creation, order history, cancellation, sandbox
  payment, and limited admin review endpoints

Supporting layers:

- `src/config` for environment parsing and constants
- `src/prisma` for Prisma service/module wiring
- `src/common` for shared guards and app-level error utilities

The backend now exposes customer-facing commerce endpoints. Admin review
endpoints exist for orders, but broader catalog/dashboard tooling is still
planned.

## Runtime Data Flow

### Catalog

1. Next.js server/client UI calls the shared Axios service layer.
2. Frontend requests `GET /api/categories` and `GET /api/products`.
3. NestJS validates query params and reads published products from Prisma.
4. Frontend renders filters, cards, pagination, flash sale labels, and
   localized copy.

### Product Detail

1. Route `/[locale]/products/[slug]` resolves the slug server-side.
2. Frontend requests `GET /api/products/:slug`.
3. Backend returns the published product plus related products.
4. Frontend renders gallery, detail tabs, pricing, and add-to-cart behavior.

### Cart and Checkout

1. Product detail and product card interactions write to a lightweight cart
   store.
2. Checkout refreshes product snapshots before order creation.
3. The customer selects a saved address and payment method.
4. Backend creates the order, recalculates totals, and deducts stock.

### Sandbox Payment

1. After order creation, the storefront routes to
   `/[locale]/checkout/payment/[orderNo]`.
2. The customer confirms either `QR_PAYMENT` or `CARD` in demo mode.
3. Backend updates demo payment state and, for cards, moves the order to
   `PAID`.
4. The storefront routes to the order confirmation page.

### Account and Orders

1. Authenticated customers manage profile data, saved addresses, and saved demo
   cards under `/[locale]/profile`.
2. The storefront loads `/api/orders` and `/api/orders/:orderNo` to render
   order history and order detail.
3. Eligible orders can be canceled immediately or routed into manual
   cancellation review.

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
- `User`
- `Address`
- `SavedPaymentMethod`
- `Order`
- `OrderItem`
- `OrderCancellationRequest`

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
- `isFlashSale`
- `price`
- `compareAtPrice`
- `stock`
- `isPublished`

## Frontend State

Current client-side state is intentionally small:

- theme preference
- locale-aware navigation state
- cart store used across catalog, PDP, cart, and checkout
- auth restoration state for customer session UX

Product content, account forms, and order/payment views still rely on API
requests rather than large global client stores.

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
- customer auth flow
- cart, checkout, and order success flow
- customer profile, address book, and saved demo card management
- order list and order detail pages
- sandbox QR/card payment flow
- limited admin order review pages
- theme toggle
- locale switching
- NestJS storefront API
- Prisma schema, migrations, and seed data

### Planned next

- real payment gateway integration
- admin dashboard and product management
- broader admin operations
- deployment docs and production hosting polish
