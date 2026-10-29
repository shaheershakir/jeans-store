#!/usr/bin/env bash
set -euo pipefail

# Deploy services to Cloud Run. Runtime credentials are read from Secret Manager;
# create the named secrets before deploying and grant the Cloud Run service account
# access to them. See docs/ADMIN_PRODUCTION.md for the required configuration.
# Usage: ./infra/gcp/deploy-cloudrun.sh [api|storefront|admin|all] [image_tag]

SERVICE=${1:-all}
TAG=${2:-latest}
PROJECT=${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}
REGION=${GCP_REGION:-asia-south1}
REPO=${GAR_REPOSITORY:-teesgarage}
FRONTEND_URL=${FRONTEND_URL:?Set FRONTEND_URL}
ADMIN_URL=${ADMIN_URL:?Set ADMIN_URL}
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}"

require_api_configuration() {
  : "${ADMIN_EMAIL:?Set ADMIN_EMAIL}"
  : "${GCS_PRODUCT_IMAGES_BUCKET:?Set GCS_PRODUCT_IMAGES_BUCKET}"
  : "${RAZORPAY_KEY_ID:?Set RAZORPAY_KEY_ID before deploying the API}"
  : "${RAZORPAY_KEY_SECRET:?Set RAZORPAY_KEY_SECRET before deploying the API}"
  : "${RAZORPAY_WEBHOOK_SECRET:?Set RAZORPAY_WEBHOOK_SECRET before deploying the API}"
}

deploy_api() {
  require_api_configuration
  echo "==> Building and deploying API (${REGISTRY}/backend:${TAG})..."
  docker build -t "${REGISTRY}/backend:${TAG}" -f apps/api/Dockerfile .
  docker push "${REGISTRY}/backend:${TAG}"

  if [[ "${USE_GCP_SECRET_MANAGER:-false}" == "true" ]]; then
    secret_bindings="DATABASE_URL=database-url:latest,ADMIN_PASSWORD=admin-password:latest,ADMIN_SESSION_SECRET=admin-session-secret:latest,JWT_SECRET=customer-jwt-secret:latest"
    if [[ -n "${GOOGLE_CLIENT_ID:-}" ]]; then
      secret_bindings+=",GOOGLE_CLIENT_SECRET=google-client-secret:latest"
    fi
    if [[ -n "${RAZORPAY_KEY_ID:-}" ]]; then
      secret_bindings+=",RAZORPAY_KEY_SECRET=razorpay-key-secret:latest,RAZORPAY_WEBHOOK_SECRET=razorpay-webhook-secret:latest"
    fi

    gcloud run deploy teesgarage-backend \
      --project="${PROJECT}" \
      --image="${REGISTRY}/backend:${TAG}" \
      --region="${REGION}" \
      --platform=managed \
      --allow-unauthenticated \
      --port=4000 \
      --set-env-vars="^;^NODE_ENV=production;HOST=0.0.0.0;GCP_PROJECT_ID=${PROJECT};ADMIN_EMAIL=${ADMIN_EMAIL};ADMIN_NAME=${ADMIN_NAME:-Store administrator};GCS_PRODUCT_IMAGES_BUCKET=${GCS_PRODUCT_IMAGES_BUCKET};GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-};RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID:-};FRONTEND_URL=${FRONTEND_URL};CORS_ORIGIN=${FRONTEND_URL},${ADMIN_URL}" \
      --set-secrets="${secret_bindings}"
  else
    : "${DATABASE_URL:?Set DATABASE_URL before deploying the API without Secret Manager}"
    : "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD before deploying the API without Secret Manager}"
    admin_session_sec="${ADMIN_SESSION_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo '0123456789012345678901234567890123456789')}"
    jwt_sec="${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo '0123456789012345678901234567890123456789')}"
    env_vars="^;^NODE_ENV=production;HOST=0.0.0.0;GCP_PROJECT_ID=${PROJECT};DATABASE_URL=${DATABASE_URL};ADMIN_EMAIL=${ADMIN_EMAIL};ADMIN_NAME=${ADMIN_NAME:-Store administrator};ADMIN_PASSWORD=${ADMIN_PASSWORD};ADMIN_SESSION_SECRET=${admin_session_sec};JWT_SECRET=${jwt_sec};GCS_PRODUCT_IMAGES_BUCKET=${GCS_PRODUCT_IMAGES_BUCKET};FRONTEND_URL=${FRONTEND_URL};CORS_ORIGIN=${FRONTEND_URL},${ADMIN_URL}"
    if [[ -n "${GOOGLE_CLIENT_ID:-}" ]]; then env_vars+=";GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"; fi
    if [[ -n "${GOOGLE_CLIENT_SECRET:-}" ]]; then env_vars+=";GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}"; fi
    if [[ -n "${RAZORPAY_KEY_ID:-}" ]]; then env_vars+=";RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}"; fi
    if [[ -n "${RAZORPAY_KEY_SECRET:-}" ]]; then env_vars+=";RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}"; fi
    if [[ -n "${RAZORPAY_WEBHOOK_SECRET:-}" ]]; then env_vars+=";RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}"; fi

    if gcloud run services describe teesgarage-backend --project="${PROJECT}" --region="${REGION}" >/dev/null 2>&1; then
      latest_ready=$(gcloud run services describe teesgarage-backend --project="${PROJECT}" --region="${REGION}" --format='value(status.latestReadyRevisionName)' 2>/dev/null || true)
      if [[ -z "${latest_ready}" ]]; then
        gcloud run services delete teesgarage-backend --project="${PROJECT}" --region="${REGION}" --quiet 2>/dev/null || true
      else
        gcloud run services update teesgarage-backend --project="${PROJECT}" --region="${REGION}" --clear-secrets --quiet 2>/dev/null || true
      fi
    fi

    gcloud run deploy teesgarage-backend \
      --project="${PROJECT}" \
      --image="${REGISTRY}/backend:${TAG}" \
      --region="${REGION}" \
      --platform=managed \
      --allow-unauthenticated \
      --port=4000 \
      --set-env-vars="${env_vars}"
  fi
}

get_backend_url() {
  if [[ -n "${BACKEND_URL:-}" ]]; then
    printf '%s' "${BACKEND_URL}"
    return
  fi
  gcloud run services describe teesgarage-backend --project="${PROJECT}" --region="${REGION}" --format='value(status.url)'
}

deploy_storefront() {
  local backend_url
  backend_url=$(get_backend_url)
  [[ -n "${backend_url}" ]] || { echo "Set BACKEND_URL or deploy the API service first." >&2; exit 1; }
  echo "==> Building and deploying storefront (${REGISTRY}/frontend:${TAG})..."
  docker build \
    --build-arg "NEXT_PUBLIC_API_URL=${backend_url}" \
    --build-arg "NEXT_PUBLIC_WHATSAPP_NUMBER=${WHATSAPP_NUMBER:-}" \
    --build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}" \
    --build-arg "NEXT_PUBLIC_SITE_URL=${FRONTEND_URL}" \
    --build-arg "NEXT_PUBLIC_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID:-}" \
    -t "${REGISTRY}/frontend:${TAG}" \
    -f apps/storefront/Dockerfile .
  docker push "${REGISTRY}/frontend:${TAG}"
  gcloud run deploy teesgarage-frontend \
    --project="${PROJECT}" \
    --image="${REGISTRY}/frontend:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --set-env-vars="^;^NODE_ENV=production;HOSTNAME=0.0.0.0;BACKEND_URL=${backend_url};NEXT_PUBLIC_API_URL=${backend_url};NEXT_PUBLIC_SITE_URL=${FRONTEND_URL}"
}

deploy_admin() {
  local backend_url
  backend_url=$(get_backend_url)
  [[ -n "${backend_url}" ]] || { echo "Set BACKEND_URL or deploy the API service first." >&2; exit 1; }
  echo "==> Building and deploying admin (${REGISTRY}/admin:${TAG})..."
  docker build -t "${REGISTRY}/admin:${TAG}" \
    -f apps/admin/Dockerfile .
  docker push "${REGISTRY}/admin:${TAG}"
  gcloud run deploy teesgarage-admin \
    --project="${PROJECT}" \
    --image="${REGISTRY}/admin:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --set-env-vars="^;^NODE_ENV=production;HOSTNAME=0.0.0.0;API_URL=${backend_url};NEXT_PUBLIC_STOREFRONT_URL=${FRONTEND_URL}"
}

case "${SERVICE}" in
  api|backend) deploy_api ;;
  storefront|frontend) deploy_storefront ;;
  admin) deploy_admin ;;
  all)
    deploy_api
    deploy_storefront
    deploy_admin
    ;;
  *) echo "Unknown service '${SERVICE}'. Use api, storefront, admin, or all." >&2; exit 1 ;;
esac

echo "==> Requested Cloud Run deployment completed."
