# Google Cloud Platform (GCP) Production Deployment Guide

This document is the operational guide for deploying TEESGARAGE's three-tier e-commerce architecture to **Google Cloud Run**, persisted with **Neon PostgreSQL** via **Drizzle ORM**, with product media hosted on **Google Cloud Storage**.

---

## Production Architecture & Component Mapping

| Component | Google Cloud service | Why |
| :--- | :--- | :--- |
| **Next.js storefront** | **Cloud Run** | Supports server-side rendering, API calls, and dynamic pages |
| **Next.js admin panel** | **Cloud Run** | Separate deployment and access controls |
| **Existing REST API** | **Cloud Run** | Keep your current Express backend with zero code rewrite |
| **PostgreSQL** | **Neon** | Keep your existing database, branching, and connection pooling |
| **Product images** | **Cloud Storage** | Store product photos independently of application containers |
| **Secrets and credentials** | **Secret Manager** | Protect server-side credentials and inject them securely at runtime |
| **Container images** | **Artifact Registry** | Stores immutable images deployed to Cloud Run |

---

## Architecture Topology

```
                              [ Internet Traffic ]
                                       │
                     ┌─────────────────┴─────────────────┐
                     │ Google Cloud Run (Fully Managed)  │
                     └─────────────────┬─────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  infit-frontend  │          │  infit-backend   │          │   infit-admin    │
│  Port: 3000      │          │  Port: 4000      │          │   Port: 3001     │
│  (Storefront)    │          │  (Express API)   │          │   (Dashboard)    │
└────────┬─────────┘          └────────┬─────────┘          └────────┬─────────┘
         │                             │                             │
         │  On-demand ISR Webhook      │  Authenticated Mutations    │
         │◄────────────────────────────┤◄────────────────────────────┘
         │                             │  (X-API-Key: ADMIN_API_KEY)
         │  Save Order (/api/orders)   │
         └────────────────────────────►│
                                       ▼
                          ┌─────────────────────────┐
                          │    Neon PostgreSQL      │
                          │   (Drizzle ORM Pooled)  │
                          │  - products             │
                          │  - orders               │
                          └─────────────────────────┘
```

---

## 1. Prerequisites

1. **Google Cloud Account**: A project with billing enabled (e.g. `teesgarage-production`).
2. **Google Cloud CLI (`gcloud`)**: Installed and initialized locally (`gcloud auth login`).
3. **Neon PostgreSQL Database**:
   - Create a project at [neon.tech](https://neon.tech).
   - Use the **Pooled** connection string ending with `?sslmode=require` (`ep-xyz-pooler.neon.tech`).

---

## 2. Google Cloud Initial Setup

Run the following commands using `gcloud`:

```bash
# 1. Set your project ID
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-south1" # or us-central1
gcloud config set project $PROJECT_ID

# 2. Enable necessary APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com

# 3. Create Artifact Registry repository for container images
gcloud artifacts repositories create infit \
  --repository-format=docker \
  --location=$REGION \
  --description="TEESGARAGE Docker container images"

# 4. Create Cloud Storage bucket for product images
export ASSETS_BUCKET="teesgarage-product-assets"
gcloud storage buckets create gs://$ASSETS_BUCKET \
  --location=$REGION \
  --uniform-bucket-level-access

# Grant public read access to product assets
gcloud storage buckets add-iam-policy-binding gs://$ASSETS_BUCKET \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

---

## 3. Secret Manager Configuration

Store your credentials securely in Secret Manager so Cloud Run services can inject them at runtime:

```bash
# 1. Database URL (Neon PostgreSQL Pooled connection string)
echo -n "postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-pooler.region.aws.neon.tech/neondb?sslmode=require" | \
  gcloud secrets create infit-database-url --data-file=-

# 2. Backend Admin API Key (used by Admin and internal services)
openssl rand -hex 24 | \
  gcloud secrets create infit-admin-api-key --data-file=-

# 3. On-Demand ISR Revalidation Secret (shared between backend and storefront)
openssl rand -hex 24 | \
  gcloud secrets create infit-revalidation-secret --data-file=-

# 4. WhatsApp Order Concierge Phone Number
echo -n "919876543210" | \
  gcloud secrets create infit-whatsapp-number --data-file=-
```

---

## 4. Deploying the Services via gcloud

### Step 4.1: Deploy Backend (`infit-backend`)

```bash
cd backend

# Build and submit container image
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/infit/backend:latest .

# Deploy to Cloud Run
gcloud run deploy infit-backend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/infit/backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=4000 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=infit-database-url:latest,ADMIN_API_KEY=infit-admin-api-key:latest,REVALIDATION_SECRET=infit-revalidation-secret:latest"

# Save the generated Cloud Run backend URL
export BACKEND_URL=$(gcloud run services describe infit-backend --region=$REGION --format='value(status.url)')
echo "Backend deployed at: $BACKEND_URL"

# Store the backend URL in Secret Manager for Frontend and Admin
echo -n "$BACKEND_URL" | gcloud secrets create infit-backend-url --data-file=-
```

### Step 4.2: Deploy Storefront (`infit-frontend`)

```bash
cd ../frontend

# Build and submit container image
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/infit/frontend:latest .

# Deploy to Cloud Run
gcloud run deploy infit-frontend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/infit/frontend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="BACKEND_URL=infit-backend-url:latest,NEXT_PUBLIC_API_URL=infit-backend-url:latest,REVALIDATION_SECRET=infit-revalidation-secret:latest,NEXT_PUBLIC_WHATSAPP_NUMBER=infit-whatsapp-number:latest"

export FRONTEND_URL=$(gcloud run services describe infit-frontend --region=$REGION --format='value(status.url)')
echo "Storefront deployed at: $FRONTEND_URL"
```

### Step 4.3: Deploy Admin Dashboard (`infit-admin`)

```bash
cd ../admin

# Build and submit container image
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/infit/admin:latest .

# Deploy to Cloud Run
gcloud run deploy infit-admin \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/infit/admin:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=3001 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="NEXT_PUBLIC_API_URL=infit-backend-url:latest,NEXT_PUBLIC_ADMIN_API_KEY=infit-admin-api-key:latest"

export ADMIN_URL=$(gcloud run services describe infit-admin --region=$REGION --format='value(status.url)')
echo "Admin Dashboard deployed at: $ADMIN_URL"
```

---

## 5. Local Docker Testing (Pre-Deployment)

You can run and verify the entire 3-service stack locally with Docker Compose:

```bash
# In repository root
docker compose up --build
```

- Storefront: `http://localhost:3000`
- Express Backend: `http://localhost:4000` (`http://localhost:4000/health`)
- Admin Dashboard: `http://localhost:3001`

---

## 6. Continuous Deployment via GitHub Actions

The repository includes a ready-to-run GitHub Actions workflow at [`.github/workflows/deploy-gcp.yml`](file:///f:/jeans%20store/.github/workflows/deploy-gcp.yml).

To activate it:
1. Create a Google Cloud Service Account with `roles/run.admin`, `roles/artifactregistry.writer`, and `roles/secretmanager.secretAccessor`.
2. Generate a JSON key for the Service Account.
3. In your GitHub repository settings under **Settings > Secrets and variables > Actions**, add:
   - `GCP_PROJECT_ID`: Your GCP Project ID.
   - `GCP_SA_KEY`: The JSON service account key.
   - `GCP_REGION`: `asia-south1` or `us-central1`.
   - `GAR_REPOSITORY`: `infit`.
4. Merges to `main` will automatically build, push, and deploy all updated services.
