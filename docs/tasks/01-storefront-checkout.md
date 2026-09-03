# Task brief: Storefront checkout flow

## Objective

Build and maintain the customer order checkout route on `/checkout`, connecting the shopping bag to WhatsApp and email handoffs without payment gateway dependencies.

## Scope

- Route: `frontend/src/app/checkout/page.tsx` and `CheckoutClient.tsx`.
- Form validation: Customer name, 10-digit phone number, valid email, delivery address, city, state, and 6-digit postal code.
- Order manifest generation: Structured text listing silhouette names, selected waist sizes, cut, wash, and itemized subtotal.
- Transmission deep links:
  - When `NEXT_PUBLIC_WHATSAPP_NUMBER` is present, hand off via `https://wa.me/<number>?text=<encodedMessage>`.
  - When unset or empty, hand off via `mailto:orders@infit.in`.
- Confirmation state: Clear cart state upon successful transmission and present an order reference card with the transmitted summary.

## Acceptance criteria

1. Navigating to `/checkout` with an empty bag displays a friendly empty state with a return button.
2. Form fields show clear error messages if submitted with incomplete or invalid details.
3. Submitting valid information opens WhatsApp or email with prefilled text and empties the bag.
4. Production build (`npm run build`) compiles cleanly with 0 TypeScript or lint errors.
