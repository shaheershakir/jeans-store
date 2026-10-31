# TEESGARAGE — Apparel Commerce Monorepo

A modern apparel e-commerce platform built as an integrated monorepo powered by **Turborepo** and **npm workspaces**. The catalog covers Stripes, Fullsleeve, Drsleeve, Printed tees, Ringer tees, Henley, Waffle, Trackpants, and Sweatpants.

---

## Repository Structure

```
jeans-store/
├── apps/
│   ├── storefront/        # Next.js 15 customer storefront (cart, checkout, catalog, account)
│   ├── admin/             # Next.js 15 operational dashboard (inventory, orders, products, coupons)
│   └── api/               # Express REST API, authentication, business logic, Razorpay
│
├── packages/
│   ├── db/                # PostgreSQL schema, Drizzle ORM client, seed scripts, and migrations
│   ├── shared/            # Common TypeScript types, interfaces, and store constants
│   ├── validators/        # Shared Zod validation schemas
│   └── config/            # Shared TypeScript, ESLint, and tooling configurations
│
├── infra/                 # Deployment and infrastructure configuration (Cloud Run, Docker)
├── docs/                  # Architecture, API specifications, and deployment runbooks
├── .github/workflows/     # CI/CD pipelines (GitHub Actions)
│
├── package.json           # Root workspace scripts & dependencies
├── turbo.json             # Build and task orchestration configuration
├── docker-compose.yml     # Local multi-service development environment
└── AGENTS.md              # Agent system prompt and operational guidelines
```

---

## Quick Start

### Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- *(Optional)* **Docker & Docker Compose** for containerized local services

### Installation

Install dependencies across all workspaces from the monorepo root:

```bash
npm install
```

### Running Locally

To start all applications concurrently with Turborepo:

```bash
npm run dev
```

This starts:
- 🛒 **Storefront**: [http://localhost:3000](http://localhost:3000)
- 📊 **Admin Dashboard**: [http://localhost:3001](http://localhost:3001)
- 🔌 **API**: [http://localhost:4000](http://localhost:4000)

To start individual applications:

```bash
npm run dev:storefront   # Customer storefront
npm run dev:admin        # Admin dashboard
npm run dev:api          # Express REST API
```

---

## Local Development with Docker

Run the entire multi-container stack (PostgreSQL + API + Storefront + Admin) locally:

```bash
docker compose up -d
```

---

## Build & Testing

Run pipeline tasks across all packages and applications:

```bash
npm run build      # Build all apps & packages in dependency order
npm run test       # Run tests across workspaces
npm run lint       # Lint all code
npm run typecheck  # Run TypeScript typechecks
npm run format     # Format code with Prettier
```

---

## Database Management (`packages/db`)

Database interactions utilize **Drizzle ORM** with **Neon Serverless PostgreSQL**:

```bash
npm run db:generate  # Generate migration SQL files from schema
npm run db:push      # Push schema directly to connected database
npm run db:seed      # Seed database with initial silhouettes and products
```

---

## Documentation

- 📐 **Architecture**: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- 🔌 **API Documentation**: [`docs/API.md`](./docs/API.md)
- 🚀 **Google Cloud Run Deployment**: [`docs/GCP_DEPLOYMENT.md`](./docs/GCP_DEPLOYMENT.md)
- 🗄️ **Database Environments**: [`docs/database-environments.md`](./docs/database-environments.md)
- 🏗️ **Infrastructure Configuration**: [`infra/README.md`](./infra/README.md)
