import { defineMiddleware } from "astro:middleware";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAdminMutationRateLimit, checkPublicReadRateLimit } from "@/lib/ratelimit";
import { setRequestEnv } from "@/lib/context";


// ─── Route Classification ───────────────────────────────────────
// Routes that NEVER require authentication
const PUBLIC_BYPASS_PREFIXES = [
  "/admin/login",
  "/api/auth/",
];

const PUBLIC_BYPASS_EXACT = [
  "/api/theme.css",
  "/api/admissions/registrations/lookup",
];

// API routes that require auth for ALL methods (including GET)
// These contain sensitive admin-only data.
const ALWAYS_PROTECTED_API_PREFIXES = [
  "/api/users",
  "/api/inbox", // Protect GET /api/inbox from public read
  "/api/admissions/registrations", // Protect registrations list from public read
];

// Specific exact routes + method combinations that are public
// e.g. Contact form submissions from public site
const PUBLIC_MUTATIONS = [
  { path: "/api/inbox", method: "POST" },
  { path: "/api/admissions/registrations", method: "POST" }, // Public registration submission
];

// HTTP methods that are considered "read-only" (safe)
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// HTTP methods that are mutations (for rate limiting)
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Endpoints excluded from public read rate limiting
// (static assets, non-API routes, or routes with dedicated limiters)
const PUBLIC_READ_LIMITER_EXCLUSIONS = new Set([
  "/api/theme.css",    // Static CSS generation, not abusable
]);

/**
 * Determines if a request requires authentication.
 *
 * Policy:
 *  - /admin/login, /api/auth/*  → always public
 *  - /api/theme.css             → always public
 *  - /admin/*                   → always protected
 *  - /api/users/*               → always protected (admin data)
 *  - /api/* GET/HEAD/OPTIONS    → public (headless read access)
 *  - /api/* POST/PUT/DELETE/... → protected (mutations)
 *  - everything else            → pass through (public pages)
 */
function requiresAuth(pathname: string, method: string): boolean {
  // 1. Explicit public bypasses
  if (PUBLIC_BYPASS_EXACT.includes(pathname)) return false;
  for (const prefix of PUBLIC_BYPASS_PREFIXES) {
    if (pathname.startsWith(prefix)) return false;
  }

  // 2. Public specific mutations
  for (const pm of PUBLIC_MUTATIONS) {
    if (pathname === pm.path && method.toUpperCase() === pm.method) return false;
  }

  // 2b. Public view increment: POST /api/posts/<id>/view
  if (/^\/api\/posts\/\d+\/view$/.test(pathname) && method.toUpperCase() === "POST") {
    return false;
  }

  // 3. Admin panel — always protected
  if (pathname.startsWith("/admin")) return true;

  // 4. Sensitive API routes — always protected regardless of method
  for (const prefix of ALWAYS_PROTECTED_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  // 5. Other API routes — protect mutations only
  if (pathname.startsWith("/api/")) {
    return !SAFE_METHODS.has(method.toUpperCase());
  }

  // 6. Everything else (public pages) — no auth needed
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Inject Cloudflare runtime env into the module-level store
  // so that getEnv() works in all downstream library code.
  setRequestEnv(context.locals.runtime?.env || {});

  const {
    url: { pathname },
    request: { method },
    request,
    cookies,
    redirect,
  } = context;

  if (!requiresAuth(pathname, method)) {
    // ─── Public Read API Rate Limiting (Phase 4) ─────────────
    // Only for GET /api/* routes (not pages, not static assets)
    if (
      pathname.startsWith("/api/") &&
      method.toUpperCase() === "GET" &&
      !PUBLIC_READ_LIMITER_EXCLUSIONS.has(pathname)
    ) {
      const rl = await checkPublicReadRateLimit(request, pathname);
      if (!rl.allowed) return rl.response!;
    }

    return next();
  }

  // ─── Authentication ─────────────────────────────────────────
  const sessionCookie = cookies.get(SESSION_COOKIE_NAME)?.value;

  const isApiRoute = pathname.startsWith("/api/");

  if (!sessionCookie) {
    if (isApiRoute) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: no session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return redirect("/admin/login");
  }

  // Verify custom session JWT (HS256, zero HTTP calls, local crypto only)
  let tokenPayload;
  try {
    tokenPayload = await verifySessionToken(sessionCookie);
  } catch {
    // Token expired, tampered, or wrong issuer/audience
    cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    if (isApiRoute) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid or expired session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return redirect("/admin/login");
  }

  // ─── Authorization (Database Lookup by Email) ───────────────
  const email = tokenPayload.email;
  if (!email) {
    cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    if (isApiRoute) {
      return new Response(
        JSON.stringify({ error: "Forbidden: no email in session" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return redirect("/admin/login");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!dbUser || !dbUser.isActive) {
    // User not registered in DB or suspended
    cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    if (isApiRoute) {
      return new Response(
        JSON.stringify({
          error: dbUser
            ? "Forbidden: account suspended"
            : "Forbidden: unregistered account",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return redirect("/admin/login");
  }

  // ─── Session Version Revocation Check ───────────────────────
  if (tokenPayload.sv !== dbUser.sessionVersion) {
    // Session was revoked (admin incremented sessionVersion)
    cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    if (isApiRoute) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: session revoked" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return redirect("/admin/login");
  }

  // ─── Attach Authorized User to Locals ───────────────────────
  context.locals.user = {
    id: dbUser.id,
    uid: dbUser.uid,
    email: dbUser.email,
    name: dbUser.displayName || "Admin",
    displayName: dbUser.displayName || null,
    photoUrl: dbUser.photoUrl || null,
    role: dbUser.role || "operator",
  };

  // ─── Admin Mutation Rate Limiting (Phase 3) ─────────────────
  // Only check for API mutations (POST/PUT/PATCH/DELETE)
  // Skips routes with dedicated Phase 1/2 limiters automatically
  if (isApiRoute && MUTATION_METHODS.has(method.toUpperCase())) {
    const rl = await checkAdminMutationRateLimit(dbUser.id, pathname, method);
    if (!rl.allowed) return rl.response!;
  }

  return next();
});

