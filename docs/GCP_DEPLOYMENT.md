# Google Cloud Run Deployment

TEESGARAGE deploys three services in `asia-south1`: the customer storefront, the operational admin, and the Express API. The current catalog is Stripes, Fullsleeve, Drsleeve, Printed tees, Ringer tees, Henley, Trackpants, and Sweatpants.

## Before deployment

1. Create an Artifact Registry Docker repository and a Cloud Storage bucket for product images.
2. Apply the database schema with `npm run db:push` after backing up the production database.
3. Grant the API Cloud Run service account `roles/storage.objectUser` on the image bucket and Secret Manager access to the API secrets.
4. Configure Workload Identity Federation for GitHub Actions. Grant its service account Cloud Run deploy permissions, Artifact Registry write access, and permission to attach the Cloud Run runtime service account.

The runtime account must have access to the production database. Make the product image bucket public for object reads or put a public CDN in front of it; the API only needs object write access.

## Required configuration

Set these GitHub repository **variables** or **secrets** for `.github/workflows/deploy-gcp.yml`:

### Authentication (choose one):
- **Option A (Workload Identity Federation - Recommended)**:
  - `GCP_WIF_PROVIDER`: Full provider path (`projects/{PROJECT_NUMBER}/locations/global/workloadIdentityPools/{POOL}/providers/{PROVIDER}`)
  - `GCP_WIF_SA`: The GitHub Actions service account email (e.g. `github-deployer@{PROJECT_ID}.iam.gserviceaccount.com`)
- **Option B (Service Account JSON Key)**:
  - `GCP_SA_KEY`: Complete JSON key of a service account with Cloud Run & Artifact Registry deploy permissions.

### General Configuration (in Variables or Secrets):
- `GCP_PROJECT_ID`: Your Google Cloud Project ID (e.g. `clothing-store-511300`)
- `GCP_REGION` (optional; defaults to `asia-south1`) and `GAR_REPOSITORY` (optional; defaults to `teesgarage`)
- `ADMIN_EMAIL`, `ADMIN_NAME`, `GCS_PRODUCT_IMAGES_BUCKET`
- `FRONTEND_URL`, `ADMIN_URL`
- `GOOGLE_CLIENT_ID` and `RAZORPAY_KEY_ID` only when those providers are enabled
- `WHATSAPP_NUMBER` if WhatsApp support links are enabled

Create these Secret Manager secrets for the API runtime: `database-url`, `admin-password`, `admin-session-secret`, and `customer-jwt-secret`. Google sign-in also needs `google-client-secret`; Razorpay checkout also needs `razorpay-key-secret`. Use live Razorpay credentials for production. Do not put secret values in GitHub variables, Docker build arguments, or `NEXT_PUBLIC_*` settings.

The GitHub workflow and both `infra/gcp/deploy-cloudrun` scripts bind secrets by name. They do not create or populate the secrets. Production API startup checks for the database, admin credentials, signing secrets, project ID, image bucket, storefront URL, and CORS origins.

## Deploy

For GitHub Actions, push a change to `main` under `apps/`, `packages/`, or the workflow file. Run the workflow manually to choose `all`, `backend`, `frontend`, or `admin`.

For a local deployment, authenticate `gcloud`, set `GCP_PROJECT_ID`, `GCP_REGION`, `GAR_REPOSITORY`, `FRONTEND_URL`, and `ADMIN_URL`, then run one of:

```powershell
./infra/gcp/deploy-cloudrun.ps1 -Service all
```

```sh
./infra/gcp/deploy-cloudrun.sh all
```

When deploying only the storefront or admin, set `BACKEND_URL` to the existing API service URL. The API's CORS origin list must contain the public storefront and admin origins.

## Verify

- `GET /health` on the API reports a healthy service and database.
- Admin login accepts only the configured administrator account; there is no admin registration page or demo account.
- Upload a product photo in admin and confirm the saved object is readable through the configured bucket/CDN.
- Confirm the catalog, stock, shipping rates, and admin operations persist after restarting a service instance.
- Place a test order with Razorpay test credentials in a non-production environment. Never use test keys for production checkout.

See [Admin production setup](ADMIN_PRODUCTION.md) for delivery bands, image upload constraints, and database migration details.
