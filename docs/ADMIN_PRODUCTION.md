# Admin and delivery production setup

The admin uses a single server-managed account. There is no public registration or invitation form. Product records, order operations, delivery rates, and product images are stored through the API rather than browser-local state.

## Required API environment

Configure these values for the API service:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used for products, inventory, orders, and delivery rates. |
| `ADMIN_EMAIL` | The one email address allowed to sign in to the admin. |
| `ADMIN_NAME` | Display name for the administrator. |
| `ADMIN_PASSWORD` | A unique administrator password. |
| `ADMIN_SESSION_SECRET` | Random signing secret with at least 32 characters. Keep it private and stable across API instances. |
| `GCP_PROJECT_ID` | Google Cloud project containing the product image bucket. |
| `GCS_PRODUCT_IMAGES_BUCKET` | Bucket for product photos. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Live Razorpay credentials when online payment is enabled. |
| `FRONTEND_URL` | Storefront URL used to revalidate the product catalog after edits. |
| `CORS_ORIGIN` | Exact storefront and admin origins allowed to call the API. |

Set `API_URL` in the admin service to the API's private or public origin. Do not expose database credentials or the admin session secret in `NEXT_PUBLIC_*` variables. Copy the examples from `apps/api/.env.example` and `apps/admin/.env.example` as a starting point.

Set `NEXT_PUBLIC_API_URL` on the storefront to the API origin for customer sign-in and checkout quotes. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` only when Google sign-in is enabled; email/password customer sign-in uses the same API. The admin login remains a single server-configured account and has no public registration flow.

## Google Cloud Storage

Create a bucket for product images and grant the Cloud Run API service account `roles/storage.objectUser` on that bucket. The admin uploads JPEG, PNG, or WebP files up to 10 MB; the API checks the file signature and writes immutable objects under `products/`.

Product image URLs use the public `storage.googleapis.com` object URL. Grant `allUsers` the `Storage Object Viewer` role on this bucket, or route the bucket through a public CDN and adapt the URL construction in `apps/api/src/routes/uploads.ts`. The upload service account itself should not receive project-wide storage permissions.

## Database migration

Apply the schema before starting the updated API:

```sh
npm run db:push
```

This adds product image/metadata fields, paid delivery-rate settings, and persisted order payment status, carrier details, admin notes, and order events. Back up production before applying schema changes.

## Paid delivery rules

The initial rates are Rs 60 for the first 500 g in Kerala and Rs 90 for the first 500 g elsewhere in India. Each started additional 500 g band adds Rs 20 in Kerala or Rs 30 elsewhere. The admin can change each weight band and charge under **Delivery charges**. All charges must be positive.

Every product has a shipping weight in grams. Checkout sends product and variant identifiers, destination state, and quantities; the API reloads current prices and weights, validates stock, calculates the shipping charge, and computes the total before creating an order or Razorpay payment. The cart drawer can show the same server quote after the customer selects a state.

## Admin login and operational scope

The admin sets an eight-hour, HTTP-only, same-site session cookie after a successful login. Product management and order operations use a same-origin Next.js proxy so the API token is never exposed to client JavaScript. The API validates the session for every protected operation.

The Orders screen reads real orders from PostgreSQL. Order status transitions, COD payment status, carrier/tracking details, and internal notes are saved through authenticated API routes. Razorpay order creation and verification use server-recalculated totals and captured payment details.

Inventory adjustments and order stock deductions are authenticated API operations against saved variant stock. Conditional database updates reject changes that would reduce stock below reserved units or sell more units than are available.
