import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  verifyTokenSchema,
  googleAuthSchema,
  type UserProfile,
} from "../schemas/user.js";
import { userStore } from "../store/userStore.js";
import {
  createCloudIamToken,
  verifyCloudIamToken,
  verifyPassword,
} from "../services/cloudIam.js";
import {
  getGoogleAuthUrl,
  getGoogleClientId,
  verifyGoogleIdToken,
  exchangeGoogleAuthCode,
  type GoogleUserPayload,
} from "../services/googleAuth.js";
import type { DbUser } from "@jeans-store/db";
import { logger } from "../lib/logger.js";

function formatProfile(user: DbUser): UserProfile {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    name: user.name,
    provider: user.provider,
    googleSub: user.googleSub ?? undefined,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    createdAt: user.createdAt,
  };
}

export const authRouter = Router();

// 1. User Registration (Storefront Sign-up)
authRouter.post("/api/auth/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid registration details",
      details: z.treeifyError(parsed.error),
    });
    return;
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await userStore.findByEmail(email);
    if (existing) {
      res.status(409).json({
        error:
          "An account with this email address already exists. Please sign in.",
      });
      return;
    }

    const user = await userStore.create({
      name,
      email,
      password,
      provider: "cloud-iam",
    });

    const { token, expiresIn } = createCloudIamToken({
      uid: user.uid,
      email: user.email,
      name: user.name,
    });

    logger.info(
      { email: user.email, uid: user.uid },
      "New user registered via Cloud IAM",
    );

    res.status(201).json({
      user: formatProfile(user),
      token,
      expiresIn,
    });
  } catch (err) {
    logger.error({ err }, "Failed to register user");
    res.status(500).json({ error: "Failed to process registration" });
  }
});

// 2. User Login (Storefront Sign-in)
authRouter.post("/api/auth/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid login details",
      details: z.treeifyError(parsed.error),
    });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await userStore.findByEmail(email);
    if (!user || !user.passwordHash) {
      res.status(401).json({
        error: "Invalid email or password",
      });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({
        error: "Invalid email or password",
      });
      return;
    }

    const { token, expiresIn } = createCloudIamToken({
      uid: user.uid,
      email: user.email,
      name: user.name,
    });

    logger.info(
      { email: user.email, uid: user.uid },
      "User logged in successfully",
    );

    res.json({
      user: formatProfile(user),
      token,
      expiresIn,
    });
  } catch (err) {
    logger.error({ err }, "Failed to login user");
    res.status(500).json({ error: "Authentication failed" });
  }
});

// 3. Current User Profile (/api/auth/me)
authRouter.get("/api/auth/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7).trim();
  const claims = await verifyCloudIamToken(token);

  if (!claims) {
    res.status(401).json({ error: "Invalid or expired Cloud IAM token" });
    return;
  }

  let user = await userStore.findByUid(claims.uid);
  if (!user) {
    user = await userStore.findByEmail(claims.email);
  }

  if (!user) {
    // Auto-provision profile from verified IAM claims if not yet in DB
    user = await userStore.create({
      uid: claims.uid,
      email: claims.email,
      name: claims.name || claims.email.split("@")[0],
      provider: "cloud-iam",
    });
  }

  res.json({
    user: formatProfile(user),
    claims,
  });
});

// 4. Token Verification Utility (/api/auth/verify)
authRouter.post("/api/auth/verify", async (req: Request, res: Response) => {
  const parsed = verifyTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const claims = await verifyCloudIamToken(parsed.data.token);
  if (!claims) {
    res.status(200).json({ valid: false });
    return;
  }

  res.status(200).json({
    valid: true,
    claims,
  });
});

// 5. Google OAuth Authorization URL (/api/auth/google/url)
authRouter.get("/api/auth/google/url", async (req: Request, res: Response) => {
  if (!getGoogleClientId()) {
    res.status(503).json({ error: "Google sign-in is not configured." });
    return;
  }
  const query = req.query as { redirect_uri?: string; state?: string };
  const frontendBase = (
    process.env.FRONTEND_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");
  const defaultRedirect = `${frontendBase}/auth/callback`;
  const redirectUri = query.redirect_uri?.trim() || defaultRedirect;
  const url = getGoogleAuthUrl(redirectUri, query.state);

  res.json({
    url,
    clientId: getGoogleClientId(),
    redirectUri,
  });
});

// 6. Google OAuth Sign-in / Sign-up (/api/auth/google)
authRouter.post("/api/auth/google", async (req: Request, res: Response) => {
  const parsed = googleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid Google authentication parameters",
      details: z.treeifyError(parsed.error),
    });
    return;
  }

  const { credential, code, redirectUri } = parsed.data;

  try {
    let googleUser: GoogleUserPayload;
    if (credential) {
      googleUser = await verifyGoogleIdToken(credential);
    } else if (code) {
      const frontendBase = (
        process.env.FRONTEND_URL || "http://localhost:3000"
      ).replace(/\/+$/, "");
      const defaultRedirect = `${frontendBase}/auth/callback`;
      const targetRedirect = redirectUri?.trim() || defaultRedirect;
      googleUser = await exchangeGoogleAuthCode(code, targetRedirect);
    } else {
      res
        .status(400)
        .json({ error: "Missing credential or authorization code" });
      return;
    }

    let user = await userStore.findByGoogleSub(googleUser.sub);
    if (!user) {
      user = await userStore.findByEmail(googleUser.email);
      if (user && !user.googleSub) {
        user = await userStore.updateGoogleSub(user.id, googleUser.sub);
      }
    }
    let isNewUser = false;

    if (!user) {
      user = await userStore.create({
        uid: `google_${googleUser.sub}`,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        provider: "google",
        googleSub: googleUser.sub,
      });
      isNewUser = true;
      logger.info(
        { email: user.email, uid: user.uid },
        "New user account registered via Google OAuth 2.0",
      );
    } else {
      logger.info(
        { email: user.email, uid: user.uid },
        "Existing user authenticated via Google OAuth 2.0",
      );
    }

    const { token, expiresIn } = createCloudIamToken({
      uid: user.uid,
      email: user.email,
      name: user.name,
    });

    res.json({
      user: formatProfile(user),
      token,
      expiresIn,
      isNewUser,
    });
  } catch (err: any) {
    logger.error({ err }, "Google OAuth authentication failed");
    res.status(400).json({
      error: err.message || "Failed to authenticate with Google",
    });
  }
});

// 7. Complete Onboarding (/api/auth/onboarding/complete)
authRouter.post("/api/auth/onboarding/complete", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7).trim();
  const claims = await verifyCloudIamToken(token);
  if (!claims) {
    res.status(401).json({ error: "Invalid or expired Cloud IAM token" });
    return;
  }

  let user = await userStore.findByUid(claims.uid);
  if (!user) {
    user = await userStore.findByEmail(claims.email);
  }

  if (!user) {
    res.status(404).json({ error: "User account not found" });
    return;
  }

  const updatedUser = await userStore.completeOnboarding(user.id);
  res.json({
    success: true,
    onboardingCompleted: true,
    user: formatProfile(updatedUser || user)
  });
});

