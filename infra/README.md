# Infrastructure & Deployment

This directory contains deployment specifications, containerization blueprints, and infrastructure scripts for the **TEESGARAGE / TEESGARAGE** monorepo.

## Structure

```
infra/
├── docker/        Container definitions & multi-container compose settings
├── gcp/           Google Cloud Run deployment scripts & configurations
├── render/        Render Blueprint specification (legacy test tier)
└── README.md      Infrastructure reference
```

## Environments

| Environment | Applications | Hosting Provider | Deployment Pipeline |
| :--- | :--- | :--- | :--- |
| **Production** | Storefront, Admin, API | Google Cloud Run (`asia-south1`) | `.github/workflows/deploy-gcp.yml` |
| **Edge Storefront** | Storefront (`apps/storefront`) | Vercel (Optional ISR Edge) | Git push trigger |
| **Preview/Test** | API (`apps/api`) | Render Free Tier (`oregon`) | `infra/render/render.yaml` |
| **Local Dev** | Storefront, Admin, API, DB | Docker Compose / Turborepo | `docker-compose.yml` / `turbo dev` |

## Deployment Guides

- **Google Cloud Run**: See [`docs/GCP_DEPLOYMENT.md`](../docs/GCP_DEPLOYMENT.md) and [`infra/gcp/deploy-cloudrun.sh`](./gcp/deploy-cloudrun.sh).
- **Database (Neon PostgreSQL)**: See [`docs/database-environments.md`](../docs/database-environments.md).
- **CI/CD Automation**: See [`.github/workflows/`](../.github/workflows/).
