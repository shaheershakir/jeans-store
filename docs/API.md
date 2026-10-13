# Express REST API Reference (`apps/api`)

The Express REST API powers the product catalog, customer orders, authentication, homepage customization, and Razorpay payment operations.

## Base URL
- **Local Development**: `http://localhost:4000`
- **Docker Compose**: `http://backend:4000` (internal) / `http://localhost:4000` (host)
- **Production (Cloud Run)**: `https://teesgarage-backend-f6v6jgb4qa-el.a.run.app`

## Authentication

Mutating endpoints (POST, PUT, DELETE) require the `X-API-Key` HTTP header:
```http
X-API-Key: <ADMIN_API_KEY>
```

User authentication endpoints issue Bearer JWT tokens:
```http
Authorization: Bearer <TOKEN>
```

---

## Endpoints

### 1. Health & Status
- **`GET /health`**
  - Returns service status, database connectivity (`Neon PostgreSQL`), uptime, and timestamp.
  - Response:
    ```json
    {
      "status": "healthy",
      "uptime": 124.5,
      "timestamp": "2026-10-13T09:30:00.000Z",
      "database": {
        "connected": true,
        "maskedUrl": "postgresql://[user]:****@ep-bold-glitter.../neondb"
      }
    }
    ```

### 2. Products (`/api/products`)
- **`GET /api/products`**
  - Returns all products.
  - Query parameters:
    - `store`: Filter by store (`teesgarage`, `teesgarage`, etc.)
    - `category`: Filter by category (`stripes`, `fullsleeve`, etc.)
    - `fit`: Filter by fit silhouette (`Boxy`, `Oversized`, etc.)
- **`GET /api/products/:id`**
  - Fetch single product by numeric ID.
- **`POST /api/products`** *(Protected)*
  - Create new product. Validated with `createProductSchema` from `@jeans-store/validators`.
- **`PUT /api/products/:id`** *(Protected)*
  - Update existing product.
- **`DELETE /api/products/:id`** *(Protected)*
  - Delete product.

### 3. Orders (`/api/orders`)
- **`GET /api/orders`** *(Protected)*
  - List all customer orders.
- **`GET /api/orders/:orderNumber`**
  - Retrieve single order details.
- **`POST /api/orders`**
  - Create order manifest from checkout.
  - Validated with `createOrderSchema` from `@jeans-store/validators`.
- **`PATCH /api/orders/:orderNumber/status`** *(Protected)*
  - Update order status (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).

### 4. Razorpay Payments
- **`POST /api/payments/razorpay/order`**
  - Create Razorpay payment order in paise.
  - Body:
    ```json
    {
      "amount": 149900,
      "receipt": "ORD-20261013-1001",
      "currency": "INR"
    }
    ```
- **`POST /api/payments/razorpay/verify`**
  - Verify HMAC SHA-256 signature from Razorpay checkout modal:
    ```json
    {
      "razorpay_order_id": "order_XXXX",
      "razorpay_payment_id": "pay_YYYY",
      "razorpay_signature": "signature_hash"
    }
    ```

### 5. Authentication (`/api/auth`)
- **`POST /api/auth/register`**: Register customer with name, email, password.
- **`POST /api/auth/login`**: Authenticate customer and issue JWT token.
- **`POST /api/auth/google`**: Sign in / register via Google ID token.
- **`GET /api/auth/me`**: Get current user profile from token.

### 6. Homepage & Navigation
- **`GET /api/homepage`**: Retrieve dynamic homepage section configuration.
- **`PUT /api/homepage`** *(Protected)*: Update homepage sections and contents.
- **`GET /api/navigation`**: Get dynamic navigation links.
- **`PUT /api/navigation`** *(Protected)*: Bulk update navigation links.
