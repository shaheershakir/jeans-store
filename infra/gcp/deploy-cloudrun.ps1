<#
.SYNOPSIS
  Deploy services to Google Cloud Run from Windows PowerShell.
.DESCRIPTION
  Builds Docker containers with monorepo root context, pushes to Google Artifact Registry,
  and deploys to Cloud Run in asia-south1.
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

$Region = 'asia-south1'
$Project = 'clothing-store-511300'
$Repo = 'infit'
$Registry = "${Region}-docker.pkg.dev/${Project}/${Repo}"

$BackendUrl = "https://infit-backend-777430238035.asia-south1.run.app"
$FrontendUrl = "https://infit-frontend-777430238035.asia-south1.run.app"
$AdminUrl = "https://infit-admin-777430238035.asia-south1.run.app"

function Deploy-Backend {
  Write-Host "==> [1/3] Building and Deploying Backend API..." -ForegroundColor Cyan
  $image = "${Registry}/backend:${Tag}"
  docker build -t $image -f apps/api/Dockerfile .
  docker push $image

  gcloud run deploy infit-backend `
    --image=$image `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --port=4000 `
    --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,DATABASE_URL=postgresql://neondb_owner:npg_SjvrTG1FI6ep@ep-muddy-mode-b3mdvd86-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require,ADMIN_API_KEY=local_dev_admin_key,GOOGLE_CLIENT_ID=777430238035-cl896fklpijq4cqlstm1d6h3s07q63ke.apps.googleusercontent.com,GOOGLE_CLIENT_SECRET=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,GOOGLE_PROJECT_ID=clothing-store-511300,RAZORPAY_KEY_ID=rzp_test_TnN4mtRGLw9wJy,RAZORPAY_KEY_SECRET=6HCOI0Fg4exVQWYG2AK7KeSf"

  gcloud run services update infit-backend `
    --region=$Region `
    "--update-env-vars=^;^CORS_ORIGIN=${FrontendUrl},${AdminUrl},http://localhost:3000,http://localhost:3001;FRONTEND_URL=${FrontendUrl}"
}

function Deploy-Storefront {
  Write-Host "==> [2/3] Building and Deploying Storefront..." -ForegroundColor Cyan
  $image = "${Registry}/frontend:${Tag}"
  docker build `
    --build-arg NEXT_PUBLIC_API_URL=$BackendUrl `
    --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER="" `
    -t $image `
    -f apps/storefront/Dockerfile .
  docker push $image

  gcloud run deploy infit-frontend `
    --image=$image `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --port=3000 `
    --set-env-vars="NODE_ENV=production,HOSTNAME=0.0.0.0,BACKEND_URL=${BackendUrl},NEXT_PUBLIC_API_URL=${BackendUrl},NEXT_PUBLIC_SITE_URL=${FrontendUrl},NEXT_PUBLIC_GOOGLE_CLIENT_ID=777430238035-cl896fklpijq4cqlstm1d6h3s07q63ke.apps.googleusercontent.com,NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TnN4mtRGLw9wJy,RAZORPAY_KEY_ID=rzp_test_TnN4mtRGLw9wJy,RAZORPAY_KEY_SECRET=6HCOI0Fg4exVQWYG2AK7KeSf"
}

function Deploy-Admin {
  Write-Host "==> [3/3] Building and Deploying Admin Dashboard..." -ForegroundColor Cyan
  $image = "${Registry}/admin:${Tag}"
  docker build `
    --build-arg NEXT_PUBLIC_API_URL=$BackendUrl `
    --build-arg NEXT_PUBLIC_ADMIN_API_KEY="local_dev_admin_key" `
    -t $image `
    -f apps/admin/Dockerfile .
  docker push $image

  gcloud run deploy infit-admin `
    --image=$image `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --port=3001 `
    --set-env-vars="NODE_ENV=production,HOSTNAME=0.0.0.0,NEXT_PUBLIC_API_URL=${BackendUrl},NEXT_PUBLIC_ADMIN_API_KEY=local_dev_admin_key,NEXT_PUBLIC_STOREFRONT_URL=${FrontendUrl}"
}

switch ($Service) {
  'api'        { Deploy-Backend }
  'backend'    { Deploy-Backend }
  'storefront' { Deploy-Storefront }
  'frontend'   { Deploy-Storefront }
  'admin'      { Deploy-Admin }
  'all'        {
    Deploy-Backend
    Deploy-Storefront
    Deploy-Admin
  }
}

Write-Host "==> All requested services deployed successfully to Google Cloud Run!" -ForegroundColor Green
Write-Host "Backend:    $BackendUrl"
Write-Host "Storefront: $FrontendUrl"
Write-Host "Admin:      $AdminUrl"
