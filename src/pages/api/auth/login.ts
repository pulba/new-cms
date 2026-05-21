import type { APIRoute } from "astro";
import {
  verifyFirebaseIdToken,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-server";
import { getEnv } from "@/lib/context";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, count, and, ne } from "drizzle-orm";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/ratelimit";

// Session cookie duration: 7 days (in seconds for cookie maxAge)
const SESSION_EXPIRY_SEC = 60 * 60 * 24 * 7;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Rate limit check (IP-based, 5 req / 5 min)
  const rl = await checkLoginRateLimit(request);
  if (!rl.allowed) return rl.response!;

  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return new Response(
        JSON.stringify({ error: "Missing token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ─── Step 1: Verify Firebase ID Token (strict assertions) ──
    let decoded;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const uid = decoded.sub;
    const email = decoded.email;
    const displayName = decoded.name || null;
    const photoUrl = decoded.picture || null;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email associated with this account" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ─── Step 2: Authorization — email-based DB lookup ─────────
    const ownerEmail = getEnv('OWNER_ADMIN_EMAIL');
    const now = new Date().toISOString();

    let existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser) {
      // ─── Owner Bootstrap (one-time only) ────────────────────
      const isOwnerEmail =
        ownerEmail && email.toLowerCase() === ownerEmail.toLowerCase();

      if (isOwnerEmail) {
        // Only allow bootstrap if NO admin exists yet
        const adminCountResult = await db
          .select({ value: count() })
          .from(users)
          .where(eq(users.role, "admin"));

        if (adminCountResult[0].value > 0) {
          // Admin already exists — bootstrap window is closed
          return new Response(
            JSON.stringify({
              error:
                "Akun tidak terdaftar. Bootstrap admin sudah selesai. Hubungi administrator.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // No admins exist — create owner as first admin
        // Owner has real Firebase identity, so id = uid
        await db.insert(users).values({
          id: uid,
          uid,
          email,
          displayName,
          photoUrl,
          role: "admin",
          isActive: true,
          sessionVersion: 1,
          lastLogin: now,
          createdAt: now,
        });

        existingUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
      } else {
        // ─── Reject unregistered non-owner accounts ─────────
        return new Response(
          JSON.stringify({
            error:
              "Akun tidak terdaftar. Hubungi administrator untuk mendapatkan akses.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Check if user is active
    if (!existingUser || !existingUser.isActive) {
      return new Response(
        JSON.stringify({
          error: "Akun Anda telah dinonaktifkan. Hubungi administrator.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ─── Step 3: UID Hydration & Metadata Update ──────────────
    if (!existingUser.uid) {
      // Pre-registered account — first Google login.
      // Check for UID collision: ensure no OTHER user already has this uid
      const uidCollision = await db.query.users.findFirst({
        where: and(
          eq(users.uid, uid),
          ne(users.id, existingUser.id)
        ),
      });

      if (uidCollision) {
        return new Response(
          JSON.stringify({
            error: "Identity conflict: Firebase UID sudah terikat ke akun lain.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      // Hydrate: bind Firebase UID to pre-registered account
      await db
        .update(users)
        .set({
          uid,
          displayName,
          photoUrl,
          lastLogin: now,
        })
        .where(eq(users.id, existingUser.id));
    } else {
      // Returning user — just update metadata
      await db
        .update(users)
        .set({
          displayName,
          photoUrl,
          lastLogin: now,
        })
        .where(eq(users.id, existingUser.id));
    }

    // ─── Step 4: Create custom signed session JWT ─────────────
    const sessionToken = await signSessionToken({
      userId: existingUser.id,
      email: existingUser.email,
      uid: existingUser.uid || uid, // Use freshly hydrated uid
      role: existingUser.role || "operator",
      sv: existingUser.sessionVersion ?? 1,
    });

    // ─── Step 5: Set hardened cookie ──────────────────────────
    cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      maxAge: SESSION_EXPIRY_SEC,
    });

    // Reset rate limit counter on successful login
    await resetLoginRateLimit(request);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
