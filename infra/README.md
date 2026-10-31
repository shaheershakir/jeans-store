# Infrastructure & Deployment

This directory contains deployment specifications, containerization blueprints, and infrastructure scripts for the **TEESGARAGE** monorepo.

## Structure

```
infra/
├── docker/        Container definitions & multi-container compose settings
├── gcp/           Google Cloud Run deployment scripts & configurations
└── README.md      Infrastructure reference
```

## Environments

| Environment | Applications | Hosting Provider | Deployment Pipeline |
| :--- | :--- | :--- | :--- |
| **Production** | Storefront, Admin, API | Google Cloud Run (`asia-south1`) | `.github/workflows/deploy-gcp.yml` |
| **Local Dev** | Storefront, Admin, API, DB | Docker Compose / Turborepo | `docker-compose.yml` / `npm run dev` |

## Deployment Guides

- **Google Cloud Run**: See [`docs/GCP_DEPLOYMENT.md`](../docs/GCP_DEPLOYMENT.md) and [`infra/gcp/deploy-cloudrun.sh`](./gcp/deploy-cloudrun.sh).
- **Database (Neon PostgreSQL)**: See [`docs/database-environments.md`](../docs/database-environments.md).
- **CI/CD Automation**: See [`.github/workflows/`](../.github/workflows/).
