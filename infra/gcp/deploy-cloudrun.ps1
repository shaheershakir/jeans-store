<#
.SYNOPSIS
  Deploy TEESGARAGE services to Cloud Run using runtime secrets from Secret Manager.
.DESCRIPTION
  Create the named Secret Manager secrets and grant the Cloud Run service account
  access before deployment. See docs/ADMIN_PRODUCTION.md for required configuration.
.PARAMETER Service
  api | storefront | admin | all (default: all)
.PARAMETER Tag
  Docker image tag (default: latest)
#>
param(
  [ValidateSet('api', 'backend', 'storefront', 'frontend', 'admin', 'all')]
  [string]$Service = 'all',
  [string]$Tag = 'latest'
)

$ErrorActionPreference = 'Stop'

if (-not $env:GCP_PROJECT_ID) { throw 'Set GCP_PROJECT_ID before deploying.' }
if (-not $env:FRONTEND_URL) { throw 'Set FRONTEND_URL before deploying.' }
if (-not $env:ADMIN_URL) { throw 'Set ADMIN_URL before deploying.' }

$Project = $env:GCP_PROJECT_ID
$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { 'asia-south1' }
$Repo = if ($env:GAR_REPOSITORY) { $env:GAR_REPOSITORY } else { 'teesgarage' }
$Registry = "${Region}-docker.pkg.dev/${Project}/${Repo}"
$FrontendUrl = $env:FRONTEND_URL

function Get-BackendUrl {
  if ($env:BACKEND_URL) { return $env:BACKEND_URL }
  $url = gcloud run services describe teesgarage-backend --project=$Project --region=$Region --format='value(status.url)'
  if (-not $url) { throw 'Set BACKEND_URL or deploy the API service first.' }
  return $url.Trim()
}

function Deploy-Api {
  if (-not $env:ADMIN_EMAIL) { throw 'Set ADMIN_EMAIL before deploying the API.' }
  if (-not $env:GCS_PRODUCT_IMAGES_BUCKET) { throw 'Set GCS_PRODUCT_IMAGES_BUCKET before deploying the API.' }
  $image = "${Registry}/backend:${Tag}"
  docker build -t $image -f apps/api/Dockerfile .
  docker push $image

  $secretBindings = 'DATABASE_URL=database-url:latest,ADMIN_PASSWORD=admin-password:latest,ADMIN_SESSION_SECRET=admin-session-secret:latest,JWT_SECRET=customer-jwt-secret:latest'
  if ($env:GOOGLE_CLIENT_ID) { $secretBindings += ',GOOGLE_CLIENT_SECRET=google-client-secret:latest' }
  if ($env:RAZORPAY_KEY_ID) { $secretBindings += ',RAZORPAY_KEY_SECRET=razorpay-key-secret:latest' }
  $corsOrigins = "$FrontendUrl,$($env:ADMIN_URL)"
  $apiEnv = "^;^NODE_ENV=production;HOST=0.0.0.0;GCP_PROJECT_ID=$Project;ADMIN_EMAIL=$($env:ADMIN_EMAIL);ADMIN_NAME=$($env:ADMIN_NAME);GCS_PRODUCT_IMAGES_BUCKET=$($env:GCS_PRODUCT_IMAGES_BUCKET);GOOGLE_CLIENT_ID=$($env:GOOGLE_CLIENT_ID);RAZORPAY_KEY_ID=$($env:RAZORPAY_KEY_ID);FRONTEND_URL=$FrontendUrl;CORS_ORIGIN=$corsOrigins"
  gcloud run deploy teesgarage-backend `
    --project=$Project `
    --image=$image `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --port=4000 `
    "--set-env-vars=$apiEnv" `
    "--set-secrets=$secretBindings"
}

function Deploy-Storefront {
  $backendUrl = Get-BackendUrl
  $image = "${Registry}/frontend:${Tag}"
  docker build `
    --build-arg "NEXT_PUBLIC_API_URL=$backendUrl" `
    --build-arg "NEXT_PUBLIC_WHATSAPP_NUMBER=$($env:WHATSAPP_NUMBER)" `
    --build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=$($env:GOOGLE_CLIENT_ID)" `
    --build-arg "NEXT_PUBLIC_SITE_URL=$FrontendUrl" `
    -t $image `
    -f apps/storefront/Dockerfile .
  docker push $image
  $storefrontEnv = "^;^NODE_ENV=production;HOSTNAME=0.0.0.0;BACKEND_URL=$backendUrl;NEXT_PUBLIC_API_URL=$backendUrl;NEXT_PUBLIC_SITE_URL=$FrontendUrl"
  gcloud run deploy teesgarage-frontend `
    --project=$Project `
    --image=$image `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --port=3000 `
    "--set-env-vars=$storefrontEnv"
}

function Deploy-Admin {
  $backendUrl = Get-BackendUrl
  $image = "${Registry}/admin:${Tag}"
  docker build -t $image -f apps/admin/Dockerfile .
  docker push $image
  $adminEnv = "^;^NODE_ENV=production;HOSTNAME=0.0.0.0;API_URL=$backendUrl;NEXT_PUBLIC_STOREFRONT_URL=$FrontendUrl"
  gcloud run deploy teesgarage-admin `
    --project=$Project `
    --image=$image `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --port=3001 `
    "--set-env-vars=$adminEnv"
}

switch ($Service) {
  'api'        { Deploy-Api }
  'backend'    { Deploy-Api }
  'storefront' { Deploy-Storefront }
  'frontend'   { Deploy-Storefront }
  'admin'      { Deploy-Admin }
  'all'        { Deploy-Api; Deploy-Storefront; Deploy-Admin }
}

Write-Host 'Requested Cloud Run deployment completed.' -ForegroundColor Green
