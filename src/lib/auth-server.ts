import * as jose from "jose";

// ─── Constants ────────────────────────────────────────────────────
const FIREBASE_PROJECT_ID = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID;
const SESSION_SECRET_RAW = import.meta.env.SESSION_SECRET || "";
const SESSION_ISSUER = "educms";
const SESSION_AUDIENCE = "educms-admin";

// ─── Google x509 Cert Cache (edge-compatible) ───────────────────
// Google does NOT serve a standard JWKS endpoint for Firebase
// securetoken service account. They only provide x509 certs at:
const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// In-memory cert cache with TTL
let cachedCerts: Record<string, string> | null = null;
let cacheExpiry = 0;

/**
 * Fetches and caches Google's x509 public certs for Firebase ID token
 * verification. Respects Cache-Control max-age for TTL.
 * Edge-compatible: uses only fetch() — no Node.js APIs.
 */
async function getGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < cacheExpiry) {
    return cachedCerts;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Google certs: HTTP ${response.status}`
    );
  }

  cachedCerts = (await response.json()) as Record<string, string>;

  // Parse Cache-Control max-age for TTL (typically ~6 hours)
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  cacheExpiry = now + maxAge * 1000;

  return cachedCerts;
}

// Session signing key — encoded once, reused forever.
const SESSION_KEY = new TextEncoder().encode(SESSION_SECRET_RAW);

// Cookie name — __Host- prefix enforces Secure + Path=/ at browser level.
// In dev (HTTP), __Host- cookies are rejected, so we fall back.
const IS_PROD = import.meta.env.PROD;
export const SESSION_COOKIE_NAME = IS_PROD
  ? "__Host-educms_session"
  : "educms_session";

// ─── Types ────────────────────────────────────────────────────────
export interface FirebaseIdTokenPayload {
  sub: string; // Firebase UID
  email: string;
  name?: string;
  picture?: string;
}

export interface SessionPayload {
  userId: string;       // Internal stable primary key (users.id)
  email: string;
  uid: string | null;   // Firebase UID (null for pre-registered accounts)
  role: string;
  sv: number;           // sessionVersion for revocation control
}

// ─── 1. Verify Firebase ID Token ─────────────────────────────────
/**
 * Verifies a Firebase ID Token using Google's public x509 certs.
 * Performs strict assertions beyond signature verification:
 *  - email_verified === true
 *  - firebase.sign_in_provider === "google.com"
 *  - sub must exist
 *  - issuer must match Firebase project
 *  - audience must match Firebase project
 *
 * @throws Error if any check fails
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<FirebaseIdTokenPayload> {
  // Step 1: Decode header to get kid
  const header = jose.decodeProtectedHeader(idToken);
  if (!header.kid) {
    throw new Error("Missing kid in token header");
  }

  // Step 2: Fetch cert matching the kid
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error(`No matching cert for kid: ${header.kid}`);
  }

  // Step 3: Import x509 cert as CryptoKey (edge-safe via jose)
  const publicKey = await jose.importX509(cert, "RS256");

  // Step 4: Verify signature + standard claims
  const { payload } = await jose.jwtVerify(idToken, publicKey, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });

  // Step 5: sub must exist
  if (!payload.sub) {
    throw new Error("Missing sub claim in Firebase ID token");
  }

  // Step 6: Email must be verified by Google
  if (payload.email_verified !== true) {
    throw new Error("Email is not verified");
  }

  // Step 7: Sign-in provider must be Google
  const firebase = payload.firebase as
    | { sign_in_provider?: string }
    | undefined;
  if (!firebase || firebase.sign_in_provider !== "google.com") {
    throw new Error("Only Google sign-in provider is allowed");
  }

  return {
    sub: payload.sub,
    email: payload.email as string,
    name: (payload.name as string) || undefined,
    picture: (payload.picture as string) || undefined,
  };
}

// ─── 2. Sign Custom Session JWT ──────────────────────────────────
/**
 * Creates a signed session JWT (HS256) for cookie storage.
 * Contains minimal claims + session version for revocation.
 *
 * @returns Signed JWT string
 */
export async function signSessionToken(
  payload: SessionPayload
): Promise<string> {
  return await new jose.SignJWT({
    userId: payload.userId,
    email: payload.email,
    uid: payload.uid,
    role: payload.role,
    sv: payload.sv,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setJti(crypto.randomUUID())
    .setSubject(payload.email)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .sign(SESSION_KEY);
}

// ─── 3. Verify Custom Session JWT ────────────────────────────────
/**
 * Verifies a session cookie JWT using the symmetric secret.
 * Asserts issuer and audience.
 * Zero external HTTP calls — purely local crypto.
 *
 * @returns Decoded payload
 * @throws Error if verification fails
 */
export async function verifySessionToken(
  token: string
): Promise<jose.JWTPayload & SessionPayload> {
  const { payload } = await jose.jwtVerify(token, SESSION_KEY, {
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
  });

  return payload as jose.JWTPayload & SessionPayload;
}
