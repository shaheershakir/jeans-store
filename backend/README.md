# backend

Serves the INFIT store API. Not built yet.

## Contract

- Product shape mirrors `frontend/src/lib/constants.ts` (`Product` interface) until a shared package exists.
- Data stays static in the frontend for now; this folder replaces `src/lib/constants.ts` as the source of truth once built.
- Planned surface: REST or tRPC under `/api`, with the 8 seed products as the first dataset.

## Do not

- No framework chosen yet. Decide when this phase starts.
