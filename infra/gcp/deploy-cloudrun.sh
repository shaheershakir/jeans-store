#!/usr/bin/env bash
set -euo pipefail

# Deployment script for TEESGARAGE / TEESGARAGE on Google Cloud Run
# Usage: ./infra/gcp/deploy-cloudrun.sh [service] [image_tag]
# Services: api | storefront | admin | all (default)

SERVICE=${1:-"all"}
TAG=${2:-"latest"}
REGION=${GCP_REGION:-"asia-south1"}
PROJECT=${GCP_PROJECT_ID:-"clothing-store-511300"}
REPO=${GAR_REPOSITORY:-"teesgarage"}

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}"
BACKEND_URL="https://teesgarage-backend-777430238035.asia-south1.run.app"
FRONTEND_URL="https://teesgarage-frontend-777430238035.asia-south1.run.app"
ADMIN_URL="https://teesgarage-admin-777430238035.asia-south1.run.app"

deploy_api() {
  echo "==> Building and deploying Backend API (${REGISTRY}/backend:${TAG})..."
  docker build -t "${REGISTRY}/backend:${TAG}" -f apps/api/Dockerfile .
  docker push "${REGISTRY}/backend:${TAG}"
  gcloud run deploy teesgarage-backend \
    --image="${REGISTRY}/backend:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=4000 \
    --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,DATABASE_URL=postgresql://neondb_owner:npg_SjvrTG1FI6ep@ep-muddy-mode-b3mdvd86-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require,ADMIN_API_KEY=local_dev_admin_key,GOOGLE_CLIENT_ID=777430238035-cl896fklpijq4cqlstm1d6h3s07q63ke.apps.googleusercontent.com,GOOGLE_CLIENT_SECRET=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,GOOGLE_PROJECT_ID=clothing-store-511300,RAZORPAY_KEY_ID=rzp_test_TnN4mtRGLw9wJy,RAZORPAY_KEY_SECRET=6HCOI0Fg4exVQWYG2AK7KeSf"
  
  gcloud run services update teesgarage-backend \
    --region="${REGION}" \
    "--update-env-vars=^;^CORS_ORIGIN=${FRONTEND_URL},${ADMIN_URL},http://localhost:3000,http://localhost:3001;FRONTEND_URL=${FRONTEND_URL}"
}

deploy_storefront() {
  echo "==> Building and deploying Storefront (${REGISTRY}/frontend:${TAG})..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL="${BACKEND_URL}" \
    --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER="" \
    -t "${REGISTRY}/frontend:${TAG}" \
    -f apps/storefront/Dockerfile .
  docker push "${REGISTRY}/frontend:${TAG}"
  gcloud run deploy teesgarage-frontend \
    --image="${REGISTRY}/frontend:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --set-env-vars="NODE_ENV=production,HOSTNAME=0.0.0.0,BACKEND_URL=${BACKEND_URL},NEXT_PUBLIC_API_URL=${BACKEND_URL},NEXT_PUBLIC_SITE_URL=${FRONTEND_URL},NEXT_PUBLIC_GOOGLE_CLIENT_ID=777430238035-cl896fklpijq4cqlstm1d6h3s07q63ke.apps.googleusercontent.com,NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TnN4mtRGLw9wJy,RAZORPAY_KEY_ID=rzp_test_TnN4mtRGLw9wJy,RAZORPAY_KEY_SECRET=6HCOI0Fg4exVQWYG2AK7KeSf"
}

deploy_admin() {
  echo "==> Building and deploying Admin (${REGISTRY}/admin:${TAG})..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL="${BACKEND_URL}" \
    --build-arg NEXT_PUBLIC_ADMIN_API_KEY="local_dev_admin_key" \
    -t "${REGISTRY}/admin:${TAG}" \
    -f apps/admin/Dockerfile .
  docker push "${REGISTRY}/admin:${TAG}"
  gcloud run deploy teesgarage-admin \
    --image="${REGISTRY}/admin:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --set-env-vars="NODE_ENV=production,HOSTNAME=0.0.0.0,NEXT_PUBLIC_API_URL=${BACKEND_URL},NEXT_PUBLIC_ADMIN_API_KEY=local_dev_admin_key,NEXT_PUBLIC_STOREFRONT_URL=${FRONTEND_URL}"
}

case "$SERVICE" in
  api|backend)
    deploy_api
    ;;
  storefront|frontend)
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
