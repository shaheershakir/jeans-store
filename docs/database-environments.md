# Database Environments & Neon PostgreSQL Infrastructure

This guide details the database architecture, environment separation, connection management, migration workflows, and operational runbooks for INFIT / TEESGARAGE.

---

## 1. Neon Project & Branch Layout

The database infrastructure is powered by **Neon PostgreSQL 17 Serverless** (version 17.11).

- **Organization**: `org-noisy-frog-81454637` (Shaheer shakir)
- **Project ID**: `cool-mountain-88112782`
- **Project Name**: `clothing-store`
- **Region**: `aws-ap-southeast-1` (AWS Singapore)
- **Database Engine**: PostgreSQL 17
- **Database Name**: `neondb`
- **Role**: `neondb_owner`

### Branch Separation

Neon provides copy-on-write storage branching, allowing complete physical data and compute isolation between environments:

| Environment | Branch Name | Branch ID | Primary / Default | Compute Endpoint Host (Pooled) | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Production** | `main` | `br-green-dust-b3hfqhuk` | Yes (`default`) | `ep-red-butterfly-b326lzxz-pooler.c-4.ap-southeast-1.aws.neon.tech` | Live customer traffic and operational catalog. **Protected**. |
| **Test / Development** | `test` | `br-quiet-unit-b31epzpl` | No | `ep-blue-math-b3rx2nmp-pooler.c-4.ap-southeast-1.aws.neon.tech` | Local engineering, CI/CD, testing, and migration verification. |

> [!IMPORTANT]
> - Never reset, delete, or recreate the `main` production branch.
> - Schema changes are **always** applied and tested on `test` first.
> - Test operations and automated scripts connect exclusively to the `test` branch endpoint and cannot write to or mutate `main`.

---

## 2. Logical Environment Configuration

Database connection strings are injected via the `DATABASE_URL` environment variable in the backend.

### Logical Configuration Scheme

#### Local Development (`backend/.env`)
```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-blue-math-b3rx2nmp-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

#### Test / Staging Deployment
```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-blue-math-b3rx2nmp-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

#### Production Deployment
```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-red-butterfly-b326lzxz-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Security & Isolation Rules

1. **Backend Owns Database Access**: Next.js (`frontend/`) and the admin client (`admin/`) communicate with the Fastify backend REST API over HTTPS. They do **not** connect directly to PostgreSQL and must **never** receive `DATABASE_URL`.
2. **No Secret Leakage**: `DATABASE_URL` must never be prefixed with `NEXT_PUBLIC_` or included in frontend client bundles.
3. **Strict `.gitignore`**: All `.env` and `.env.*` files (excluding `.env.example`) are ignored by Git. Never commit live connection strings or passwords.
4. **Credential Masking**: All internal logging, errors, and verification scripts mask passwords (`[user]:****@host`).

---

## 3. Database Connectivity & Driver Architecture

### Driver Stack

- **Client Driver**: `@neondatabase/serverless` (HTTP query mode via `neon()`)
- **ORM / Query Builder**: `drizzle-orm/neon-http`
- **Schema & Migrations**: `drizzle-kit`

### Edge & Serverless Runtime Compatibility (Fastly Compute, Cloud Run, Vercel)

Traditional Node.js PostgreSQL drivers (`pg`, `pg-pool`) require raw TCP sockets (`net.Socket`), which are unsupported or restricted in serverless edge runtimes such as **Fastly Compute** (`Compute@Edge`).

The INFIT backend uses `@neondatabase/serverless` in **HTTP query mode**:
- Every query is dispatched via standard HTTPS fetch calls (`/sql` endpoint) over TLS.
- Does **not** require TCP sockets.
- Eliminates connection pool overhead and connection exhaustion during serverless scaling.
- Connection client instances are initialized once and safely reused across incoming requests.
- All queries use parameterized statements to eliminate SQL injection risks.

### Connection Module Implementation (`backend/src/db/index.ts`)

- Automatically reads `DATABASE_URL` from runtime environment variables (including Fastly Compute environment fallbacks).
- Validates and enforces `sslmode=require` for TLS transport security.
- Fails clearly with a structured error when `DATABASE_URL` is omitted.
- Provides `maskDatabaseUrl()` to prevent accidental password exposure in logs.

---

## 4. Secret Management for Deployments

### A. Fastly Compute Deployments

Fastly Compute applications isolate secrets using **Fastly Secret Store**:

1. **Create Isolated Secret Stores**:
   ```bash
   fastly secret-store create --name="teesgarage-backend-test"
   fastly secret-store create --name="teesgarage-backend-prod"
   ```

2. **Add `DATABASE_URL` to the respective store**:
   ```bash
   # Test Environment
   fastly secret-store-entry create \
     --store-id="<TEST_STORE_ID>" \
     --name="DATABASE_URL" \
     --secret="postgresql://neondb_owner:[PASSWORD]@ep-blue-math-b3rx2nmp-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

   # Production Environment
   fastly secret-store-entry create \
     --store-id="<PROD_STORE_ID>" \
     --name="DATABASE_URL" \
     --secret="postgresql://neondb_owner:[PASSWORD]@ep-red-butterfly-b326lzxz-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```

3. **Link Store in Service Manifest (`fastly.toml`)**:
   ```toml
   [setup.secret_stores]
   DATABASE_STORE = "teesgarage-backend-prod"
   ```

### B. Google Cloud Run Deployments

1. Store the connection strings in Google Secret Manager:
   ```bash
   gcloud secrets create neon-db-test --replication-policy="automatic"
   gcloud secrets versions add neon-db-test --data-file="test-db.txt"

   gcloud secrets create neon-db-prod --replication-policy="automatic"
   gcloud secrets versions add neon-db-prod --data-file="prod-db.txt"
   ```
2. Mount the secret to the Cloud Run service:
   ```bash
   gcloud run deploy infit-backend \
     --set-secrets="DATABASE_URL=neon-db-prod:latest"
   ```

### C. Render Deployments (`render.yaml`)

Configure `DATABASE_URL` in the Render Dashboard service environment variables with `sync: false` to ensure credentials remain outside version control.

---

## 5. Schema Migrations & Workflow

All migrations are version-controlled under `backend/drizzle/`.

### Migration Commands

Execute from the `backend/` directory:

```bash
# 1. Generate new reviewable SQL migration files from src/db/schema.ts
npm run db:generate

# 2. Apply pending migrations to the configured DATABASE_URL
npm run db:migrate

# 3. Verify database connectivity and public table schema (read-only)
npm run db:verify

# 4. Seed initial catalog silhouettes (only seeds if products table is empty)
npm run db:seed
```

### Safe Migration Lifecycle

```
Local Schema Edit (src/db/schema.ts)
         │
         ▼
npm run db:generate (Generates reviewable SQL in drizzle/)
         │
         ▼
Review Migration SQL Diff
         │
         ▼
Apply to Test Branch (npm run db:migrate with Test DATABASE_URL)
         │
         ▼
Run Test Suite (npx tsx --test tests/catalog-and-orders.test.ts)
         │
         ▼
Migration Peer Review & Approval
         │
         ▼
Apply to Production Branch (Controlled deployment pipeline)
         │
         ▼
Verify Production Health (npm run db:verify with Prod DATABASE_URL)
```

> [!CAUTION]
> Never copy test database snapshots over production. Never automatically promote synthetic test records into production.

---

## 6. Verification & Health Checks

### Read-Only Verification Query

To test branch connectivity safely without mutating data, execute:

```sql
SELECT
    current_database() AS database_name,
    current_timestamp AS server_time;
```

### Running Automated Verification

To verify the currently configured environment:

```bash
cd backend
npm run db:verify
```

Output example:
```text
====================================================
🔍 Neon PostgreSQL Connectivity & Health Check
====================================================
Target:     postgresql://[user]:****@ep-proud-credit-a14u7f92-pooler.ap-southeast-1.aws.neon.tech/search
SSL Mode:   Enforced (TLS encrypted)
Connected:  YES (HTTP serverless query mode)
Database:   search
Timestamp:  2026-10-10 23:24:27.264158+00

📋 Schema Status (public tables: 4):
   - navigation_items
   - orders
   - products
   - users
====================================================
✅ Read-only database verification passed successfully.
====================================================
```

---

## 7. Troubleshooting Guide

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `DATABASE_URL environment variable is missing` | `.env` not loaded or variable unset | Create `backend/.env` with target branch connection string. Ensure `dotenv/config` is loaded. |
| `SSL connection required` | Missing SSL flag in URL | Neon requires encrypted connections. Ensure `?sslmode=require` is present in the connection string. |
| `TCP connection timeout / Connection refused` in edge runtime | Edge runtime lacks raw TCP socket support | Use `@neondatabase/serverless` HTTP query mode (`drizzle-orm/neon-http`). Do not use standard `pg` Pool in Fastly Compute. |
| `Compute endpoint suspended / Cold start delay` | Neon scale-to-zero compute | Normal on free/idle branches. First HTTP query will spin up compute within 1–2 seconds. Subsequent queries execute at normal latency. |
| `Relation already exists` during migration | Schema drift or previous unmanaged table | Ensure migrations are generated using `npm run db:generate` and migration history is tracked via `drizzle.__drizzle_migrations`. |
