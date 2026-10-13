#!/usr/bin/env bash
set -euo pipefail

# Deployment script for INFIT / TEESGARAGE on Google Cloud Run
# Usage: ./infra/gcp/deploy-cloudrun.sh <service> [image_tag]
# Services: api | storefront | admin

SERVICE=${1:-"all"}
TAG=${2:-"latest"}
REGION=${GCP_REGION:-"asia-south1"}
PROJECT=${GCP_PROJECT_ID:-""}
REPO=${GAR_REPOSITORY:-"infit"}

if [ -z "$PROJECT" ]; then
  echo "Error: GCP_PROJECT_ID environment variable is required."
  exit 1
fi

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}"

deploy_api() {
  echo "==> Building and deploying API (${REGISTRY}/api:${TAG})..."
  docker build -t "${REGISTRY}/api:${TAG}" -f apps/api/Dockerfile ./apps/api
  docker push "${REGISTRY}/api:${TAG}"
  gcloud run deploy infit-backend \
    --image="${REGISTRY}/api:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=4000 \
    --set-env-vars="NODE_ENV=production,HOST=0.0.0.0"
}

deploy_storefront() {
  echo "==> Building and deploying Storefront (${REGISTRY}/storefront:${TAG})..."
  docker build -t "${REGISTRY}/storefront:${TAG}" -f apps/storefront/Dockerfile ./apps/storefront
  docker push "${REGISTRY}/storefront:${TAG}"
  gcloud run deploy infit-frontend \
    --image="${REGISTRY}/storefront:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --set-env-vars="NODE_ENV=production,HOSTNAME=0.0.0.0"
}

deploy_admin() {
  echo "==> Building and deploying Admin (${REGISTRY}/admin:${TAG})..."
  docker build -t "${REGISTRY}/admin:${TAG}" -f apps/admin/Dockerfile ./apps/admin
  docker push "${REGISTRY}/admin:${TAG}"
  gcloud run deploy infit-admin \
    --image="${REGISTRY}/admin:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --set-env-vars="NODE_ENV=production,HOSTNAME=0.0.0.0"
}

case "$SERVICE" in
  api)
    deploy_api
    ;;
  storefront)
    deploy_storefront
    ;;
  admin)
    deploy_admin
    ;;
  all)
    deploy_api
    deploy_storefront
    deploy_admin
    ;;
  *)
    echo "Unknown service: $SERVICE. Valid options: api, storefront, admin, all"
    exit 1
    ;;
esac

echo "==> Deployment completed successfully."
