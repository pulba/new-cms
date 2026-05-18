import type { APIRoute } from "astro";
import { db } from "@/db";
import { users, activityLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const OWNER_EMAIL_KEY = "OWNER_ADMIN_EMAIL";

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

// ─── PATCH: Update role, suspend, or reactivate ───────────────────
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const denied = adminGuard(locals);
  if (denied) return denied;

  try {
    const targetId = params.id!;
    const body = await request.json();
    const { action, role } = body;
    // action: "updateRole" | "suspend" | "reactivate"

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

    const ownerEmail = (import.meta.env[OWNER_EMAIL_KEY] || "").toLowerCase();
    const isTargetOwner = targetUser.email.toLowerCase() === ownerEmail;
    const isSelf = locals.user.id === targetId;
    const now = new Date().toISOString();

    // ─── Self-Protection Rules ──────────────────────────────
    if (isSelf && (action === "suspend" || action === "updateRole")) {
      const msg =
        action === "suspend"
          ? "Tidak bisa menonaktifkan akun sendiri"
          : "Tidak bisa mengubah role sendiri";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ─── Immortal Owner Rules ───────────────────────────────
    if (isTargetOwner && (action === "suspend" || action === "updateRole")) {
      return new Response(
        JSON.stringify({ error: "Akun owner tidak bisa dimodifikasi dari panel admin" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ─── Execute Action ─────────────────────────────────────
    let logAction = "";

    if (action === "updateRole") {
      const validRoles = ["admin", "editor", "operator"];
      if (!role || !validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ error: "Role tidak valid. Pilih: admin, editor, atau operator" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      await db
        .update(users)
        .set({ role })
        .where(eq(users.id, targetId));

      logAction = `mengubah role "${targetUser.email}" dari ${targetUser.role} menjadi ${role}`;
    } else if (action === "suspend") {
      // Suspend: isActive = false AND sessionVersion++
      await db
        .update(users)
        .set({
          isActive: false,
          sessionVersion: sql`${users.sessionVersion} + 1`,
        })
        .where(eq(users.id, targetId));

      logAction = `menonaktifkan akun "${targetUser.email}"`;
    } else if (action === "reactivate") {
      await db
        .update(users)
        .set({ isActive: true })
        .where(eq(users.id, targetId));

      logAction = `mengaktifkan kembali akun "${targetUser.email}"`;
    } else {
      return new Response(
        JSON.stringify({ error: "Action tidak valid. Pilih: updateRole, suspend, atau reactivate" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Activity log
    await db.insert(activityLogs).values({
      userId: locals.user.id,
      userName: locals.user.name || "Admin",
      userAvatar: null,
      action: logAction,
      moduleName: "Pengguna",
      status: "Berhasil",
      createdAt: now,
    }).catch(err => console.error("Activity log failed:", err));

    // Return updated user
    const updated = await db.query.users.findFirst({
      where: eq(users.id, targetId),
    });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
