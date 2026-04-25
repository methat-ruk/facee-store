# API Reference

## Base URL

Local API base:

```text
http://localhost:4000/api
```

## Current Public Endpoints

### `GET /api/health`

Returns a basic service health response.

Expected shape:

```json
{
  "status": "ok",
  "service": "facee-api",
  "timestamp": "2026-04-23T10:00:00.000Z"
}
```

### `GET /api/categories`

Returns storefront categories.

Expected item shape:

```json
{
  "id": "string",
  "name": "Cleansers",
  "slug": "cleansers"
}
```

### `POST /api/auth/register`

Creates a customer account, sets an HttpOnly session cookie, and returns the
authenticated profile.

Request shape:

```json
{
  "fullName": "Facee Customer",
  "email": "customer@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Response shape:

```json
{
  "id": "string",
  "email": "customer@example.com",
  "fullName": "Facee Customer",
  "role": "CUSTOMER"
}
```

Duplicate emails return `409`.

### `POST /api/auth/login`

Authenticates an existing customer, sets an HttpOnly session cookie, and returns
the authenticated profile.

Request shape:

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

Invalid credentials return `401`.

### `POST /api/auth/logout`

Clears the auth cookie.

Expected response:

```json
{
  "ok": true
}
```

### `GET /api/auth/profile`

Returns the current authenticated profile from the HttpOnly cookie session.

Unauthenticated requests return `401`.

### `GET /api/products`

Returns published storefront products.

Supported query params:

- `category`
- `sort`
- `page`
- `limit`

Supported sort values:

- `newest`
- `price-asc`
- `price-desc`
- `name-asc`

Response shape:

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 9,
    "totalItems": 11,
    "totalPages": 2
  }
}
```

### `GET /api/products/:slug`

Returns one published product and related products for the PDP.

Response shape:

```json
{
  "product": {
    "id": "string",
    "name": "Quiet Bloom Amino Cleanser",
    "slug": "quiet-bloom-amino-cleanser",
    "subtitle": "string",
    "description": "string",
    "howToUse": "string",
    "benefits": ["string"],
    "ingredients": ["string"],
    "galleryImages": ["string"],
    "imageUrl": "/images/products/quiet-bloom-amino-cleanser.png",
    "price": 450,
    "stock": 24,
    "category": {
      "id": "string",
      "name": "Cleansers",
      "slug": "cleansers"
    }
  },
  "relatedProducts": []
}
```

Unknown or unpublished slugs return `404`.

## Current API Scope

Implemented:

- health
- customer auth
- category listing
- product listing
- product detail by slug

Planned but not implemented yet:

- cart
- checkout
- admin CRUD
- order management endpoints
