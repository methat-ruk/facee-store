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

### `POST /api/auth/login`

Authenticates an existing customer, sets an HttpOnly session cookie, and
returns the authenticated profile.

### `POST /api/auth/logout`

Clears the auth cookie.

Expected response:

```json
{
  "ok": true
}
```

### `GET /api/auth/profile`

Returns the current session state from the HttpOnly cookie session.

### `GET /api/account/profile`

Returns the authenticated customer profile.

### `PATCH /api/account/profile`

Updates the authenticated customer profile and refreshes the auth cookie
payload.

### `GET /api/account/addresses`

Returns the authenticated customer's saved addresses.

### `POST /api/account/addresses`

Creates a saved address for the authenticated customer.

### `PATCH /api/account/addresses/:addressId`

Updates one saved address.

### `POST /api/account/addresses/:addressId/default`

Marks one saved address as the default checkout address.

### `DELETE /api/account/addresses/:addressId`

Deletes one saved address.

### `GET /api/account/payment-methods`

Returns the authenticated customer's saved sandbox payment methods.

### `POST /api/account/payment-methods`

Creates a saved sandbox payment method. The current storefront only supports
saving demo cards here; QR payment is generated during checkout.

### `PATCH /api/account/payment-methods/:paymentMethodId`

Updates one saved sandbox payment method.

### `POST /api/account/payment-methods/:paymentMethodId/default`

Marks one saved sandbox payment method as default.

### `DELETE /api/account/payment-methods/:paymentMethodId`

Deletes one saved sandbox payment method.

### `POST /api/orders`

Creates a real order for the authenticated customer, recalculates totals on the
server, deducts stock immediately, and stores the selected payment method for
the sandbox payment step.

Request shape:

```json
{
  "addressId": "string",
  "paymentMethod": "QR_PAYMENT",
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

### `GET /api/orders`

Returns the authenticated customer's orders.

### `GET /api/orders/:orderNo`

Returns one owned order by order number for the authenticated customer.

Response shape:

```json
{
  "orderNo": "FC-20260427-123456",
  "status": "PENDING",
  "createdAt": "2026-04-27T10:00:00.000Z",
  "paymentMethod": "QR_PAYMENT",
  "paymentDemoStatus": "NOT_STARTED",
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

### `POST /api/orders/:orderNo/cancel`

Cancels an eligible pending order immediately.

### `POST /api/orders/:orderNo/cancellation-requests`

Creates a cancellation request for paid or packing orders that require manual
review.

### `POST /api/orders/:orderNo/payment-demo/confirm`

Confirms the sandbox payment step for an order.

- `QR_PAYMENT` keeps the order in `PENDING` and marks the demo transfer as
  submitted
- `CARD` marks the order as `PAID` in the sandbox flow

### `POST /api/orders/:orderNo/payment-method`

Changes the selected sandbox payment method before confirmation.

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
    "isFlashSale": false,
    "price": 450,
    "compareAtPrice": 590,
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

### `GET /api/admin/orders`

Returns admin-facing order list data for review workflows.

### `GET /api/admin/orders/:orderNo`

Returns one admin-facing order detail payload.

### `POST /api/admin/cancellation-requests/:requestId/review`

Approves or rejects a cancellation request.

### `POST /api/admin/orders/:orderNo/refund-status`

Updates the recorded refund status for an order.

## Current API Scope

Implemented:

- health
- customer auth
- customer account profile
- saved addresses
- saved sandbox payment methods
- category listing
- product listing
- product detail by slug
- customer order create/list/detail/cancel flow
- sandbox payment confirmation flow
- admin order review endpoints

Planned but not implemented yet:

- real payment provider integration
- full admin catalog CRUD surface
- broader operations and observability endpoints
