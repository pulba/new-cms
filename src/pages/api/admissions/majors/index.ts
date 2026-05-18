import type { APIRoute } from "astro";
import { db } from "@/db";
import { admissionMajors, registrations, activityLogs } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { slugify } from "@/lib/slugify";

/**
 * GET /api/admissions/majors?programId=X
 * Returns majors for a specific program. Public: active only. Admin (?all=true): all.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const programId = parseInt(url.searchParams.get("programId") || "");
    const showAll = url.searchParams.get("all") === "true";

    if (isNaN(programId)) {
      return new Response(
        JSON.stringify({ error: "programId wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const conditions = [eq(admissionMajors.programId, programId)];
    if (!showAll) {
      conditions.push(eq(admissionMajors.isActive, true));
    }

    const majors = await db
      .select()
      .from(admissionMajors)
      .where(and(...conditions))
      .orderBy(admissionMajors.sortOrder);

    return new Response(JSON.stringify(majors), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admissions/majors GET]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/admissions/majors
 * Admin-only: create a major for a program.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { programId, name, description, quota, isActive, sortOrder } = body;

    if (!programId) {
      return new Response(
        JSON.stringify({ error: "programId wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "Nama jurusan wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (typeof quota !== "number" || quota < 0) {
      return new Response(
        JSON.stringify({ error: "Quota harus berupa angka positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const slug = slugify(name);
    const now = new Date().toISOString();

    const result = await db
      .insert(admissionMajors)
      .values({
        programId: parseInt(programId),
        name: name.trim(),
        slug,
        description: description || null,
        quota,
        currentApplicants: 0,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        createdAt: now,
      })
      .returning();

    const user = locals.user;
    await db
      .insert(activityLogs)
      .values({
        userId: user?.id || null,
        userName: user?.name || "Admin",
        userAvatar: user?.photoUrl || null,
        action: `menambah jurusan "${name}" ke program penerimaan`,
        moduleName: "Penerimaan",
        status: "Berhasil",
        createdAt: now,
      })
      .catch((err: any) => console.error("Activity log failed:", err));

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admissions/majors POST]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
