# Data Architecture and Catalog Schema

TEESGARAGE sells apparel in these 9 categories: Stripes, Fullsleeve, Drsleeve, Printed tees, Ringer tees, Henley, Waffle, Trackpants, and Sweatpants.

## Product Catalog

The Express API and Neon PostgreSQL database are the production source of truth. `products` stores the catalog record, product images, merchandising metadata, and variant list. Each variant stores its SKU, size, color, stock, price, and shipping weight in grams. Product images are uploaded to Google Cloud Storage through the authenticated API upload endpoint.

Product categories and attributes are validated by `@jeans-store/validators` and `apps/api/src/schemas/product.ts`. The admin form provides apparel-specific sizes, materials, product attributes, inventory, price, and weight controls. Products begin as drafts and only active products are visible to customers.

## Orders and Delivery

Checkout sends product and variant IDs, quantities, and the destination state to the API. The API reloads active product data, validates stock, calculates item prices and parcel weight, then applies the saved Kerala or rest-of-India rate bands. It returns the quote used for checkout and recalculates the amount again when it creates an order or payment. Delivery is paid for every order.

Delivery rates are persisted in the `shipping_zones` table and edited in the admin. The initial rates are configurable defaults; each location group has a base weight and charge plus an additional weight band and charge.

## Database and Local Data

The canonical Drizzle schema lives in `packages/db/src/schema.ts`. Apply database schema changes with `npm run db:push` before deploying the API. Local admin preview data is for development only and is never used as production catalog or order data.
