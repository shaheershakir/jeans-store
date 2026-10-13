# Deployment

## Production

Deploy the storefront, single-account admin, and API to Google Cloud Run using the [Cloud Run deployment guide](GCP_DEPLOYMENT.md). Production startup requires PostgreSQL, admin credentials, signed-session secrets, a Google Cloud project and image bucket, an allowed CORS origin, and the public storefront URL.

Product images are uploaded by the API to Google Cloud Storage. Grant its runtime service account bucket-level write access and make product objects readable through a public bucket or CDN. Keep database credentials, admin credentials, JWT secrets, and payment-provider secrets in Secret Manager.

## Local development

Use the repository root commands or Docker Compose described in [README.md](../README.md). Local Compose defaults are for development only; production must use unique credentials and configured Google Cloud resources.

## Legacy preview hosting

`infra/render/render.yaml` remains a preview option for the API. Configure every `sync: false` value in the Render dashboard. Production product uploads still require a Google Cloud Storage bucket and service account credentials; Cloud Run is the maintained production deployment path.
