# Deployment guide

This document provides setup instructions for deploying the INFIT testing phase applications to Vercel, Render, and Sentry.

## Manual setup requirements

Three steps must be performed directly in your cloud dashboard accounts:
1. Connect the Vercel project to GitHub repository `shaheershakir/jeans-store`.
2. Deploy the Render web service using `render.yaml`.
3. Create the Sentry Next.js project to obtain your monitoring DSN.

---

## 1. Storefront deployment on Vercel

The storefront is deployed as a static Next.js 15 site on the Vercel platform.

### Step-by-step setup

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** and select **Project**.
3. Import the GitHub repository `shaheershakir/jeans-store`.
4. In the configuration screen, set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add the following:
   - `BACKEND_URL`: The production URL of your Render backend (e.g. `https://infit-backend.onrender.com`).
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`: The WhatsApp phone number including country code (e.g. `919876543210`).
   - `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN key (optional, leave blank until created).
   - `NEXT_PUBLIC_SITE_URL`: Your assigned Vercel production domain (e.g. `https://infit.vercel.app`).
6. Click **Deploy**.

### Build-time behavior on Vercel

Vercel will run `next build`. During this process, `frontend/src/lib/products.ts` queries your backend on Render. If your Render backend is cold or not yet provisioned, the build will use the bundled snapshot without failing.

---

## 2. Backend deployment on Render

The Fastify backend is deployed as a web service using Render Blueprints.

### Step-by-step setup

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation and choose **Blueprint**.
3. Connect your GitHub repository `shaheershakir/jeans-store`.
4. Render will detect `render.yaml` at the repository root and display the `infit-backend` service configuration.
5. In the environment configuration step:
   - Set `CORS_ORIGIN` to your Vercel storefront domain (e.g. `https://infit.vercel.app`).
6. Click **Apply**.
7. Render will build the TypeScript source and launch the Fastify server. Once active, note your service URL (e.g. `https://infit-backend.onrender.com`).

---

## 3. Sentry monitoring setup

Frontend exceptions and client errors are captured via `@sentry/nextjs`.

### Step-by-step setup

1. Log into your [Sentry Account](https://sentry.io/).
2. Click **Projects** and select **Create Project**.
3. Choose **Next.js** as your platform.
4. Name the project `infit-storefront` and create it.
5. Copy the generated **Client DSN** from **Settings > Client Keys (DSN)**.
6. Return to your Vercel Project Settings under **Environment Variables**.
7. Add `NEXT_PUBLIC_SENTRY_DSN` with the copied value.
8. Redeploy your latest Vercel commit to apply the monitoring configuration.

---

## Free tier considerations and caveats

- **Render free tier**: Web services on Render spin down after 15 minutes of inactivity. First requests after a pause take 30 to 50 seconds to respond. Because INFIT builds static pages at deploy time, cold starts never affect storefront shoppers. Cold starts only impact catalog rebuilds and admin API calls.
- **Vercel Hobby tier**: The Hobby plan is intended for personal projects and testing. Prior to processing high-volume commercial transactions, upgrade to Vercel Pro or migrate to self-hosted Docker containers.
- **Vercel deploy hooks**: When products are edited in the backend database, you can trigger a catalog redeployment by setting up a Deploy Hook under **Vercel Project Settings > Git > Deploy Hooks**.
