import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authRateLimiter } from "../middleware/rateLimit.js";
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
import { db, isDatabaseConfigured, customers, customerAddresses } from "@jeans-store/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";

function formatProfile(user: DbUser): UserProfile {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    name: user.name,
    provider: user.provider,
    googleSub: user.googleSub ?? undefined,
    createdAt: user.createdAt,
  };
}


async function getAuthClaims(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return verifyCloudIamToken(token);
}

async function getOrCreateCustomer(email: string, name?: string, phone?: string, userId?: number) {
  if (!db) throw new Error("Database not configured");
  let [customer] = await db
    .select()
    .from(customers)
    .where(eq(sql`lower(${customers.email})`, email.toLowerCase()));

  if (!customer) {
    const [created] = await db
      .insert(customers)
      .values({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        phone: phone || null,
        userId: userId ?? null,
      })
      .returning();
    customer = created;
  } else if (userId && !customer.userId) {
    const [updated] = await db
      .update(customers)
      .set({ userId, updatedAt: new Date() })
      .where(eq(customers.id, customer.id))
      .returning();
    customer = updated;
  }
  return customer;
}

export const authRouter = Router();

// 1. User Registration (Storefront Sign-up)
authRouter.post("/api/auth/register", authRateLimiter, async (req: Request, res: Response) => {
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
authRouter.post("/api/auth/login", authRateLimiter, async (req: Request, res: Response) => {
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

  let phone: string | undefined = undefined;
  if (isDatabaseConfigured() && db) {
    const [cust] = await db
      .select({ phone: customers.phone })
      .from(customers)
      .where(eq(sql`lower(${customers.email})`, claims.email.toLowerCase()));
    if (cust?.phone) phone = cust.phone;
  }

  res.json({
    user: {
      ...formatProfile(user),
      ...(phone ? { phone } : {}),
    },
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
authRouter.post("/api/auth/google", authRateLimiter, async (req: Request, res: Response) => {
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
    user: formatProfile(updatedUser || user)
  });
});

// 8. Update Profile Settings (/api/auth/me)
authRouter.patch("/api/auth/me", async (req: Request, res: Response) => {
  const claims = await getAuthClaims(req);
  if (!claims) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return;
  }

  const { name, phone } = req.body as { name?: string; phone?: string };

  try {
    let user = await userStore.findByUid(claims.uid);
    if (!user) {
      user = await userStore.findByEmail(claims.email);
    }

    if (user && name) {
      user = (await userStore.update(user.id, { name })) ?? user;
    }

    let customerPhone = phone;
    if (isDatabaseConfigured() && db) {
      let [customer] = await db
        .select()
        .from(customers)
        .where(eq(sql`lower(${customers.email})`, claims.email.toLowerCase()));

      if (customer) {
        const [updatedCustomer] = await db
          .update(customers)
          .set({
            ...(name ? { name } : {}),
            ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customer.id))
          .returning();
        customer = updatedCustomer;
      } else {
        const [createdCustomer] = await db
          .insert(customers)
          .values({
            email: claims.email.toLowerCase(),
            name: name || user?.name || claims.name || claims.email.split("@")[0],
            phone: phone?.trim() || null,
            userId: user?.id ?? null,
          })
          .returning();
        customer = createdCustomer;
      }
      customerPhone = customer.phone ?? undefined;
    }

    const updatedProfile = user
      ? formatProfile(user)
      : {
          id: 0,
          uid: claims.uid,
          email: claims.email,
          name: name || claims.name || "Customer",
          provider: "cloud-iam",
        };

    res.json({
      success: true,
      user: {
        ...updatedProfile,
        name: name || updatedProfile.name,
        phone: customerPhone,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to update profile settings");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// 9. Customer Addresses: List all (/api/auth/addresses)
authRouter.get("/api/auth/addresses", async (req: Request, res: Response) => {
  const claims = await getAuthClaims(req);
  if (!claims) {
    res.status(401).json({ error: "Sign in to manage addresses." });
    return;
  }

  if (!isDatabaseConfigured() || !db) {
    res.json({ addresses: [] });
    return;
  }

  try {
    const user = await userStore.findByEmail(claims.email);
    const customer = await getOrCreateCustomer(claims.email, user?.name || claims.name, undefined, user?.id);
    const rows = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customer.id))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.id));

    const addresses = rows.map((row) => ({
      id: String(row.id),
      customerId: row.customerId,
      name: customer.name,
      label: row.label,
      line1: row.line1,
      line2: row.line2 || "",
      landmark: row.landmark || "",
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      phone: row.phone || customer.phone || "",
      isDefault: row.isDefault,
      lines: [
        row.line1,
        row.line2,
        `${row.city}, ${row.state} ${row.pincode}`,
        "India"
      ].filter(Boolean) as string[],
    }));

    res.json({ addresses });
  } catch (err) {
    logger.error({ err }, "Failed to fetch customer addresses");
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// 10. Customer Addresses: Create new (/api/auth/addresses)
authRouter.post("/api/auth/addresses", async (req: Request, res: Response) => {
  const claims = await getAuthClaims(req);
  if (!claims) {
    res.status(401).json({ error: "Sign in to manage addresses." });
    return;
  }

  if (!isDatabaseConfigured() || !db) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const {
    name,
    label,
    line1,
    line2,
    landmark,
    city,
    state,
    pincode,
    phone,
    isDefault
  } = req.body as {
    name?: string;
    label?: string;
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    isDefault?: boolean;
  };

  if (!line1?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
    res.status(400).json({ error: "Missing required address fields (line1, city, state, pincode)." });
    return;
  }

  try {
    const user = await userStore.findByEmail(claims.email);
    const customer = await getOrCreateCustomer(claims.email, name || user?.name || claims.name, phone, user?.id);

    const created = await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: customerAddresses.id })
        .from(customerAddresses)
        .where(eq(customerAddresses.customerId, customer.id));

      const isFirst = existing.length === 0;
      const shouldBeDefault = Boolean(isDefault || isFirst);

      if (shouldBeDefault && existing.length > 0) {
        await tx
          .update(customerAddresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(customerAddresses.customerId, customer.id));
      }

      const validLabel = label && ["Home", "Work", "Other"].includes(label) ? (label as "Home" | "Work" | "Other") : "Home";

      const [row] = await tx
        .insert(customerAddresses)
        .values({
          customerId: customer.id,
          label: validLabel,
          line1: line1.trim(),
          line2: line2?.trim() || null,
          landmark: landmark?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          phone: phone?.trim() || customer.phone || null,
          isDefault: shouldBeDefault,
        })
        .returning();

      return row;
    });

    res.status(201).json({
      address: {
        id: String(created.id),
        customerId: created.customerId,
        name: customer.name,
        label: created.label,
        line1: created.line1,
        line2: created.line2 || "",
        landmark: created.landmark || "",
        city: created.city,
        state: created.state,
        pincode: created.pincode,
        phone: created.phone || "",
        isDefault: created.isDefault,
        lines: [
          created.line1,
          created.line2,
          `${created.city}, ${created.state} ${created.pincode}`,
          "India"
        ].filter(Boolean) as string[],
      }
    });
  } catch (err) {
    logger.error({ err }, "Failed to create customer address");
    res.status(500).json({ error: "Failed to create address" });
  }
});

// 11. Customer Addresses: Update (/api/auth/addresses/:id)
authRouter.put("/api/auth/addresses/:id", async (req: Request, res: Response) => {
  const claims = await getAuthClaims(req);
  if (!claims) {
    res.status(401).json({ error: "Sign in to manage addresses." });
    return;
  }

  if (!isDatabaseConfigured() || !db) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const addressId = Number(req.params.id);
  if (isNaN(addressId)) {
    res.status(400).json({ error: "Invalid address ID" });
    return;
  }

  const {
    name,
    label,
    line1,
    line2,
    landmark,
    city,
    state,
    pincode,
    phone,
    isDefault
  } = req.body as {
    name?: string;
    label?: string;
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    isDefault?: boolean;
  };

  try {
    const customer = await getOrCreateCustomer(claims.email);
    const [existing] = await db
      .select()
      .from(customerAddresses)
      .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.customerId, customer.id)));

    if (!existing) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    const updated = await db.transaction(async (tx) => {
      if (isDefault === true) {
        await tx
          .update(customerAddresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(customerAddresses.customerId, customer.id), sql`${customerAddresses.id} != ${addressId}`));
      }

      const validLabel = label && ["Home", "Work", "Other"].includes(label) ? (label as "Home" | "Work" | "Other") : undefined;

      const [row] = await tx
        .update(customerAddresses)
        .set({
          ...(validLabel ? { label: validLabel } : {}),
          ...(line1 ? { line1: line1.trim() } : {}),
          ...(line2 !== undefined ? { line2: line2?.trim() || null } : {}),
          ...(landmark !== undefined ? { landmark: landmark?.trim() || null } : {}),
          ...(city ? { city: city.trim() } : {}),
          ...(state ? { state: state.trim() } : {}),
          ...(pincode ? { pincode: pincode.trim() } : {}),
          ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
          ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(customerAddresses.id, addressId))
        .returning();

      return row;
    });

    res.json({
      address: {
        id: String(updated.id),
        customerId: updated.customerId,
        name: name || customer.name,
        label: updated.label,
        line1: updated.line1,
        line2: updated.line2 || "",
        landmark: updated.landmark || "",
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
        phone: updated.phone || "",
        isDefault: updated.isDefault,
        lines: [
          updated.line1,
          updated.line2,
          `${updated.city}, ${updated.state} ${updated.pincode}`,
          "India"
        ].filter(Boolean) as string[],
      }
    });
  } catch (err) {
    logger.error({ err }, "Failed to update customer address");
    res.status(500).json({ error: "Failed to update address" });
  }
});

// 12. Customer Addresses: Delete (/api/auth/addresses/:id)
authRouter.delete("/api/auth/addresses/:id", async (req: Request, res: Response) => {
  const claims = await getAuthClaims(req);
  if (!claims) {
    res.status(401).json({ error: "Sign in to manage addresses." });
    return;
  }

  if (!isDatabaseConfigured() || !db) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const addressId = Number(req.params.id);
  if (isNaN(addressId)) {
    res.status(400).json({ error: "Invalid address ID" });
    return;
  }

  try {
    const customer = await getOrCreateCustomer(claims.email);
    const [existing] = await db
      .select()
      .from(customerAddresses)
      .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.customerId, customer.id)));

    if (!existing) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    await db.transaction(async (tx) => {
      await tx.delete(customerAddresses).where(eq(customerAddresses.id, addressId));

      if (existing.isDefault) {
        const remaining = await tx
          .select({ id: customerAddresses.id })
          .from(customerAddresses)
          .where(eq(customerAddresses.customerId, customer.id))
          .orderBy(desc(customerAddresses.id))
          .limit(1);

        if (remaining.length > 0) {
          await tx
            .update(customerAddresses)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(customerAddresses.id, remaining[0].id));
        }
      }
    });

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete customer address");
    res.status(500).json({ error: "Failed to delete address" });
  }
});
