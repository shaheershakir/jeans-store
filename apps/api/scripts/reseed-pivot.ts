/**
 * Obsolete pivot reseed script.
 *
 * The old script wrote `store`, `category`, `img`, `img2`, `sizes` and other
 * legacy columns that the normalized baseline no longer has. It also deleted
 * products without cleaning up variants, images or dependent rows.
 *
 * Use the guarded reset instead:
 *
 *   npm run db:reset
 *   CONFIRM_DB_RESET=yes npm run db:reset
 */
console.log(`
This script is obsolete.

The catalog now uses normalized categories, product_images and product_variants.
Use the guarded reset/seed workflow instead:

  npm run db:reset
  CONFIRM_DB_RESET=yes npm run db:reset

See docs/DB_RESET.md for the full runbook.
`)
