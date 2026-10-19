# Local PostgreSQL setup

The API uses a locally installed PostgreSQL server through the standard `pg` driver.
The local schema is kept in `packages/db/src/schema.ts`; Drizzle applies it to the
database configured in `apps/api/.env`.

## 1. Create a local role and database

Install PostgreSQL with its command line tools and make sure the PostgreSQL service
is running. In PowerShell, connect as the local PostgreSQL administrator:

```powershell
psql -U postgres -h localhost -d postgres
```

At the `postgres=#` prompt, run:

```sql
CREATE ROLE jeans_store LOGIN PASSWORD 'jeans_store';
CREATE DATABASE jeans_store OWNER jeans_store;
```

Use a different local password if desired, then update `DATABASE_URL` to match.

## 2. Configure and initialize the app

Copy `apps/api/.env.example` to `apps/api/.env`, then make sure it contains:

```dotenv
DATABASE_URL=postgresql://jeans_store:jeans_store@localhost:5432/jeans_store
```

From the repository root, create the tables from the canonical Drizzle schema and
load the starter catalog:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
npm run db:setup
```

Then start the API with `npm run dev:api`. The database URL belongs only in the
API environment and must not be copied into storefront or admin environment files.

## Resetting local data

`npm run db:reset` drops and recreates the public schema, so it deletes local data.
The command takes a `pg_dump` backup by default and requires explicit confirmation:

```powershell
$env:CONFIRM_DB_RESET = 'yes'
npm run db:reset
Remove-Item Env:CONFIRM_DB_RESET
```
