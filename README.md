# Facee

<p align="center">
  <img src="./Facee-logo.png" alt="Facee Skincare Store Logo" width="220" />
</p>

<p align="center">
  <strong>A skincare commerce portfolio project with a polished storefront, admin dashboard, and a dedicated NestJS backend.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-111111?style=for-the-badge&logo=next.js&logoColor=white" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-Backend-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img alt="Zod" src="https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-State_Management-4B2E2B?style=for-the-badge" />
  <img alt="Axios" src="https://img.shields.io/badge/Axios-HTTP_Client-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<p align="center">
  <a href="#overview">Overview</a> |
  <a href="#key-features">Key Features</a> |
  <a href="#tech-stack">Tech Stack</a> |
  <a href="#security-and-protection">Security</a> |
  <a href="#project-structure">Structure</a> |
  <a href="#deployment">Deployment</a> |
  <a href="#roadmap">Roadmap</a>
</p>

## Overview

**Facee** is a portfolio project for a modern skincare e-commerce platform designed to feel close to a real product team workflow.

The project is planned as a complete commerce system with:

- a customer-facing storefront built for shopping and product discovery
- an admin dashboard for product, inventory, and order operations
- a dedicated **NestJS backend** for business logic, authentication, authorization, and API workflows

This repository is currently at an **early project stage**, so this README explains the intended product scope, engineering direction, and deployment plan honestly without pretending the system is already live.

## Project Vision

Facee is meant to demonstrate the kind of thinking expected from a junior developer building toward real production work:

- clear separation between frontend, backend, state, and validation
- practical e-commerce flows instead of only visual UI
- security-aware architecture from the beginning
- deployment readiness for both cloud hosting and containerized environments

The goal is to make the project feel strong enough for a first-job portfolio while staying realistic about what has already been built.

## Key Features

### Storefront

- Homepage with featured collections, campaigns, and skincare brand storytelling
- Product catalog with category browsing, filtering, and sorting
- Product detail page with image gallery, ingredients, benefits, and usage guidance
- Shopping cart and checkout-ready flow
- Customer account area for profile and order history
- Wishlist or favorites flow for saved products
- Product recommendations based on routine, skin concern, or related category tags
- Promo banners and featured collection sections

### Admin Back Office

- Dashboard overview for store activity, sales direction, and stock visibility
- Product management for create, edit, publish, and archive workflows
- Category and collection management
- Inventory tracking and low-stock alerts
- Order management with processing and status updates
- Customer overview for account and order references
- Campaign banner and featured section management
- Review moderation and highlighted product curation support

### Standout Portfolio Features

- **Routine Builder:** organize products into day, night, acne-care, or hydration routines
- **Smart Recommendations:** suggest related items by skin type, concern, or category
- **Low Stock Alerts:** make the admin area feel operational and business-oriented
- **Campaign Control:** manage homepage storytelling without hardcoding content
- **Clean Architecture Direction:** show separation between UI, API, validation, and state management

## Tech Stack

The project is planned around a modern, job-ready stack:

- **Frontend:** Next.js with App Router
- **Backend:** NestJS
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Frontend Deployment:** Vercel
- **Portable Deployment:** Docker

### Integration Direction

- **Authentication:** planned as API-driven auth flow with protected admin access
- **Payments:** planned as integration-ready checkout architecture, not yet connected to a real payment gateway
- **Media Storage:** expected to support hosted image assets in a future phase
- **Notifications:** optional email or admin alert flow for orders and inventory events

## State Management

Facee is planned to use **Zustand** for lightweight and scalable client-side state handling.

Expected usage areas:

- cart state
- wishlist state
- active filters and sorting state
- UI state for drawers, modals, and admin interactions
- selected order or product editing context in admin flows

Using Zustand keeps the project simple, readable, and practical for a portfolio app without adding unnecessary complexity.

## Validation

**Zod** is planned as the main validation layer on the client side and shared input-definition layer where useful.

Expected usage areas:

- product creation and update forms
- login and registration forms
- checkout and shipping information
- admin content management forms
- request payload validation before sending data through Axios

This helps demonstrate safer form handling and cleaner input contracts.

## API Communication

**Axios** is planned as the frontend HTTP client for communication with the NestJS backend.

Expected usage areas:

- product and category fetching
- cart or checkout requests
- authenticated account requests
- admin CRUD workflows
- centralized error handling and request interceptors

This makes it easier to organize API logic in a dedicated service layer and present a clearer frontend-backend separation.

## Security and Protection

Security is part of the project direction, not an afterthought.

Planned protections include:

- role-based access control for admin-only routes and actions
- JWT-based authentication for protected API access
- secure password hashing and credential handling
- Zod-powered input validation on the client and structured request validation on the backend
- rate limiting for login, admin, and other sensitive endpoints
- CORS policy and environment-based secret management
- secure headers and API hardening practices
- route guards for protected dashboard and operational areas
- audit-friendly product, stock, and order actions to reduce accidental misuse

These details help the project feel more like a real system and show stronger engineering awareness in a hiring context.

## Why This Project Works Well for Hiring

- It combines **UI design, API architecture, and admin workflows** in one coherent product idea.
- It represents a **real e-commerce domain** with products, categories, inventory, users, and orders.
- It highlights **frontend and backend separation**, which is more convincing than a static demo.
- It shows planning around **security, validation, and deployment**, not only interface design.
- It stays honest about the current stage while still presenting a strong product direction.

## Planned Product Scope

### Customer Journey

1. Browse skincare products by collection or category
2. View detailed product information and benefits
3. Add items to cart or wishlist
4. Continue through checkout-ready flow
5. Sign in to track orders and review purchase history

### Admin Workflow

1. Create and maintain product listings
2. Organize categories and storefront visibility
3. Monitor stock levels and alert-worthy items
4. Review and process incoming orders
5. Update homepage banners, featured collections, and promotional content

## Project Structure

The codebase is currently not scaffolded yet, but the intended structure is organized under `src/`:

```bash
facee/
+-- src/
|   +-- client/
|   |   +-- app/          # Next.js routes, layouts, storefront, admin UI
|   |   +-- components/   # Reusable UI components
|   |   +-- features/     # Domain-based frontend modules
|   |   +-- lib/          # Helpers and shared frontend utilities
|   |   +-- services/     # Axios clients and API service layer
|   |   +-- store/        # Zustand state stores
|   |   +-- schemas/      # Zod schemas for forms and client validation
|   +-- server/
|   |   +-- main.ts       # NestJS bootstrap entry
|   |   +-- app.module.ts
|   |   +-- modules/      # Auth, products, categories, orders, users
|   |   +-- common/       # Guards, interceptors, filters, shared utilities
|   |   +-- config/       # Env config and app-level setup
+-- prisma/               # Prisma schema and migrations
+-- public/               # Static assets
+-- docker/               # Container setup
+-- README.md
```

This structure keeps the project understandable for recruiters and practical for future development.

## Demo Status

- **Live Storefront Demo:** Coming Soon
- **Admin Dashboard Preview:** Coming Soon
- **Backend API Docs:** Coming Soon
- **Screenshots:** Coming Soon

## Local Setup

This repository currently contains branding and planning assets only.  
Once the app is scaffolded, the intended local workflow will be:

```bash
npm install
npm run dev
```

Expected environment variables:

```env
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
API_URL=
JWT_SECRET=
COOKIE_SECRET=
```

Optional future variables, depending on integrations:

```env
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
CLOUDINARY_URL=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

## Deployment

### Vercel

Facee is designed to use **Vercel** for the frontend deployment layer.

Planned deployment flow:

1. Push the repository to GitHub
2. Deploy the Next.js frontend to Vercel
3. Configure frontend environment variables
4. Connect the frontend to the backend API
5. Use preview and production deployments for iteration

Vercel is the preferred frontend host because it gives a clean workflow for demos, fast previews, and portfolio presentation.

### Backend Hosting

The **NestJS backend** is intended to be deployed separately on a platform such as Railway, Render, or Docker-based infrastructure.

Planned backend responsibilities:

- authentication and authorization
- product, category, and order APIs
- admin-only protected actions
- business rules and integration-ready services

### Docker

Facee is also planned with **Docker** in mind for local parity and future portability.

Expected containerization direction:

- `Dockerfile` for the Next.js frontend
- `Dockerfile` for the NestJS backend
- `docker-compose.yml` for frontend + backend + database services
- environment-based configuration for development and deployment

Planned local container workflow:

```bash
docker compose up --build
```

This makes the project stronger for interviews because it shows awareness of real deployment workflows beyond local development.

## Development Priorities

- Build the storefront experience first
- Set up the NestJS module structure and API foundation
- Add product, category, and order data models
- Add Zod schemas for safe form and input validation
- Add Axios service layer for API communication
- Add Zustand state management for cart, filters, and UI state
- Implement admin CRUD workflows
- Add authentication, route guards, and protected admin flows
- Add security hardening for sensitive endpoints
- Finalize Vercel and Docker deployment configuration

## Roadmap

- [ ] Scaffold the Next.js frontend
- [ ] Scaffold the NestJS backend
- [ ] Create a responsive storefront UI
- [ ] Implement product detail, cart, and wishlist flow
- [ ] Add Prisma schema and PostgreSQL connection
- [ ] Add Zod validation and safer form flows
- [ ] Add Axios API layer and request handling
- [ ] Add Zustand state management
- [ ] Build admin dashboard and management pages
- [ ] Add order workflow and stock alerts
- [ ] Add authentication and role-based access protection
- [ ] Add API security hardening
- [ ] Connect frontend deployment on Vercel
- [ ] Add Docker support for portable deployment
- [ ] Publish portfolio screenshots and demo

## Portfolio Intent

Facee is being built as a portfolio piece that highlights:

- frontend UI craftsmanship
- backend API design with NestJS
- structured validation with Zod
- clear state management strategy
- practical admin system design
- deployment awareness with Vercel and Docker
- security-aware implementation planning
- product sense for a real commerce use case

The aim is not only to make a beautiful project, but to present the kind of structured thinking a hiring team would expect from a junior developer who can grow quickly in a real product environment.

## Author

**Facee** is a personal portfolio project created to represent a realistic skincare e-commerce product concept for job applications and professional growth.

If you are reviewing this repository as a recruiter, hiring manager, or teammate, this project is intended to show both **visual product taste** and **full-stack development direction** in one cohesive concept.
