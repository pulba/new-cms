import type { APIRoute } from "astro";
import { db } from "@/db";
import { users, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Admin-Only Guard ─────────────────────────────────────────────
function adminGuard(locals: any) {
  if (!locals.user || locals.user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Forbidden: admin access required" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}

// ─── GET: List all users ──────────────────────────────────────────
export const GET: APIRoute = async ({ locals }) => {
  const denied = adminGuard(locals);
  if (denied) return denied;

  try {
    const allUsers = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
        role: users.role,
        isActive: users.isActive,
        sessionVersion: users.sessionVersion,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
      })
      .from(users);

    return new Response(JSON.stringify(allUsers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// ─── POST: Preregister new user ───────────────────────────────────
export const POST: APIRoute = async ({ request, locals }) => {
  const denied = adminGuard(locals);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { email, role, displayName } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Normalize: trim + lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Format email tidak valid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate role
    const validRoles = ["admin", "editor", "operator"];
    const assignedRole = validRoles.includes(role) ? role : "operator";

    // Duplicate check
    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email sudah terdaftar" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate stable internal ID
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(users).values({
      id: newId,
      uid: null,
      email: normalizedEmail,
      displayName: displayName && typeof displayName === "string" ? displayName.trim() : null,
      photoUrl: null,
      role: assignedRole,
      isActive: true,
      sessionVersion: 1,
      lastLogin: null,
      createdAt: now,
    });

    // Activity log
    await db.insert(activityLogs).values({
      userId: locals.user.id,
      userName: locals.user.name || "Admin",
      userAvatar: null,
      action: `mendaftarkan akun baru "${normalizedEmail}" dengan role ${assignedRole}`,
      moduleName: "Pengguna",
      status: "Berhasil",
      createdAt: now,
    }).catch(err => console.error("Activity log failed:", err));

    // Return created user
    const created = await db.query.users.findFirst({
      where: eq(users.id, newId),
    });

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
