import type { APIRoute } from "astro";
import { db } from "@/db";
import { users, activityLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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

// ─── POST: Force logout (revoke session) ──────────────────────────
export const POST: APIRoute = async ({ params, locals }) => {
  const denied = adminGuard(locals);
  if (denied) return denied;

  try {
    const targetId = params.id!;

    // Fetch target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetId),
    });

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "User tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ─── Self-Protection: can't revoke own session ──────────
    if (locals.user.id === targetId) {
      return new Response(
        JSON.stringify({ error: "Tidak bisa me-revoke sesi sendiri" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Increment sessionVersion → all existing cookies instantly invalid
    await db
      .update(users)
      .set({
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(eq(users.id, targetId));

    const now = new Date().toISOString();

    // Activity log
    await db.insert(activityLogs).values({
      userId: locals.user.id,
      userName: locals.user.name || "Admin",
      userAvatar: null,
      action: `me-revoke sesi aktif "${targetUser.email}"`,
      moduleName: "Pengguna",
      status: "Berhasil",
      createdAt: now,
    }).catch(err => console.error("Activity log failed:", err));

    // Return updated user
    const updated = await db.query.users.findFirst({
      where: eq(users.id, targetId),
    });

    return new Response(
      JSON.stringify({ success: true, user: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("POST /api/users/[id]/revoke error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
