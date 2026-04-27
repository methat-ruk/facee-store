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

This endpoint sends `Cache-Control: private, no-store, no-cache, max-age=0, must-revalidate`.

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
  "phone": null,
  "addressLine": null,
  "city": null,
  "postalCode": null,
  "role": "CUSTOMER"
}
```

Duplicate emails return `409`.

Auth errors now use a shared error envelope:

```json
{
  "statusCode": 409,
  "code": "AUTH_EMAIL_ALREADY_EXISTS",
  "message": "This email is already registered.",
  "fieldErrors": {
    "email": ["AUTH_EMAIL_ALREADY_EXISTS"]
  }
}
```

### `POST /api/auth/login`

Authenticates an existing customer, sets an HttpOnly session cookie, and returns
the authenticated profile.

This endpoint sends `Cache-Control: private, no-store, no-cache, max-age=0, must-revalidate`.

Request shape:

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

Invalid credentials return `401`.

Validation failures return `400` with `code: "VALIDATION_FAILED"` and
field-level codes such as `INVALID_EMAIL`, `PASSWORD_TOO_SHORT`, `REQUIRED`, or
`PASSWORD_MISMATCH`.

### `POST /api/auth/logout`

Clears the auth cookie.

This endpoint sends `Cache-Control: private, no-store, no-cache, max-age=0, must-revalidate`.

Expected response:

```json
{
  "ok": true
}
```

### `GET /api/auth/profile`

Returns the current session state from the HttpOnly cookie session.

Guest response shape:

```json
{
  "authenticated": false,
  "user": null
}
```

Authenticated response shape:

```json
{
  "authenticated": true,
  "user": {
    "id": "string",
    "email": "customer@example.com",
    "fullName": "Facee Customer",
    "phone": null,
    "addressLine": null,
    "city": null,
    "postalCode": null,
    "role": "CUSTOMER"
  }
}
```

This endpoint is guest-safe and returns `200` for both guests and authenticated
customers so the storefront can restore session state without surfacing a `401`
for expected guest traffic. It also sends
`Cache-Control: private, no-store, no-cache, max-age=0, must-revalidate` so
session state is always treated as fresh and does not rely on `304 Not Modified`
revalidation behavior.

### `POST /api/orders`

Creates a real pending order for the authenticated customer, recalculates totals
on the server, deducts stock immediately, and syncs the latest checkout contact
details back to the user profile.

Request shape:

```json
{
  "fullName": "Facee Customer",
  "email": "customer@example.com",
  "phone": "0800000000",
  "addressLine": "123 Facee Road",
  "city": "Bangkok",
  "postalCode": "10110",
  "items": [
    {
      "productId": "string",
      "quantity": 2
    }
  ]
}
```

Success response:

```json
{
  "orderNo": "FC-20260427-123456"
}
```

Order creation errors may return:

- `ORDER_EMPTY`
- `ORDER_STOCK_CHANGED`
- `ORDER_UNAVAILABLE_ITEMS`

### `GET /api/orders/:orderNo`

Returns one owned order by order number for the authenticated customer.

Response shape:

```json
{
  "orderNo": "FC-20260427-123456",
  "status": "PENDING",
  "createdAt": "2026-04-27T10:00:00.000Z",
  "contact": {
    "fullName": "Facee Customer",
    "email": "customer@example.com",
    "phone": "0800000000",
    "addressLine": "123 Facee Road",
    "city": "Bangkok",
    "postalCode": "10110"
  },
  "items": [],
  "subtotal": 900,
  "shippingTotal": 0,
  "total": 900
}
```

Unknown or inaccessible order numbers return `404` with
`code: "ORDER_NOT_FOUND"`.

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
