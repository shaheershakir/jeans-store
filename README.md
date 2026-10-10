# TEESGARAGE — Premium Denim E-Commerce Platform

TEESGARAGE is a premium denim e-commerce platform. This repository contains three independent applications: `frontend/`, `backend/`, and `admin/`.

## Application Layout

- `frontend/`: Next.js 15 App Router, React 19, TypeScript strict, and Zustand. Storefront application.
- `backend/`: Fastify REST API with Zod validation. Manages the product catalog.
- `admin/`: Next.js 15 App Router, React 19, and Tailwind CSS v4. Operational dashboard for store administration.

---

## Backend Commands

To run and build the backend server, navigate to the `backend/` directory first:

```bash
cd backend
```

### Start Commands
- **Development Server**:
  ```bash
  npm run dev
  ```
  *(Starts the Fastify dev server on port `4000` using `tsx watch`)*

- **Production Server**:
  ```bash
  npm run start
  ```
  *(Runs the built JavaScript entry point `node dist/index.js`)*

### Build Command
- **Build Production Assets / TypeScript Compilation**:
  ```bash
  npm run build
  ```
  *(Compiles TypeScript source code using `tsc` to the `dist/` directory)*

---

## Build & Run Summary for All Applications

### Backend (`backend/`)
```bash
cd backend
npm run dev      # Local dev server on :4000
npm run build    # Production build (TypeScript compile to dist/)
npm run start    # Production server
npm run smoke    # Run smoke test script
```

### Frontend (`frontend/`)
```bash
cd frontend
npm run dev      # Local dev server on :3000
npm run build    # Production Next.js build
npm run start    # Production server
```

### Admin (`admin/`)
```bash
cd admin
npm run dev      # Local dev server on :3001
npm run build    # Production Next.js build
npm run start    # Production server on :3001
```
