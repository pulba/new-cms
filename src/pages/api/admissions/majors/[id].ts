import type { APIRoute } from "astro";
import { db } from "@/db";
import { admissionMajors, registrations, activityLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { slugify } from "@/lib/slugify";

/**
 * PUT /api/admissions/majors/[id]
 * Admin-only: update a major.
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ error: "ID tidak valid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { name, description, quota, isActive, sortOrder } = body;

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "Nama jurusan wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const slug = slugify(name);

    const result = await db
      .update(admissionMajors)
      .set({
        name: name.trim(),
        slug,
        description: description ?? null,
        quota: quota ?? undefined,
        isActive: isActive ?? undefined,
        sortOrder: sortOrder ?? undefined,
      })
      .where(eq(admissionMajors.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Jurusan tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = locals.user;
    const now = new Date().toISOString();
    await db
      .insert(activityLogs)
      .values({
        userId: user?.id || null,
        userName: user?.name || "Admin",
        userAvatar: user?.photoUrl || null,
        action: `memperbarui jurusan "${name}"`,
        moduleName: "Penerimaan",
        status: "Berhasil",
        createdAt: now,
      })
      .catch((err: any) => console.error("Activity log failed:", err));

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admissions/majors/[id] PUT]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PATCH /api/admissions/majors/[id]
 * Admin-only: toggle isActive.
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ error: "ID tidak valid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    const result = await db
      .update(admissionMajors)
      .set(updateData)
      .where(eq(admissionMajors.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Jurusan tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admissions/majors/[id] PATCH]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/admissions/majors/[id]
 * Admin-only: only if NO registrations reference this major.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ error: "ID tidak valid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Guard: check for registrations
    const regCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(eq(registrations.majorId, id));

    if (regCount[0]?.count > 0) {
      return new Response(
        JSON.stringify({
          error: `Tidak dapat menghapus jurusan yang memiliki ${regCount[0].count} pendaftar. Nonaktifkan saja.`,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await db
      .delete(admissionMajors)
      .where(eq(admissionMajors.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Jurusan tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = locals.user;
    const now = new Date().toISOString();
    await db
      .insert(activityLogs)
      .values({
        userId: user?.id || null,
        userName: user?.name || "Admin",
        userAvatar: user?.photoUrl || null,
        action: `menghapus jurusan "${result[0].name}"`,
        moduleName: "Penerimaan",
        status: "Berhasil",
        createdAt: now,
      })
      .catch((err: any) => console.error("Activity log failed:", err));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admissions/majors/[id] DELETE]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
