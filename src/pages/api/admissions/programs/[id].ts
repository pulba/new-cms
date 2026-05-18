import type { APIRoute } from "astro";
import { db } from "@/db";
import { admissionPrograms, admissionMajors, registrations, registrationSequences, activityLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { slugify } from "@/lib/slugify";

/**
 * GET /api/admissions/programs/[id]
 * Returns a single program with its majors and registration stats.
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ error: "ID tidak valid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const program = await db
      .select()
      .from(admissionPrograms)
      .where(eq(admissionPrograms.id, id))
      .limit(1);

    if (program.length === 0) {
      return new Response(
        JSON.stringify({ error: "Program tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch associated majors
    const majors = await db
      .select()
      .from(admissionMajors)
      .where(eq(admissionMajors.programId, id));

    // Count registrations
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(eq(registrations.programId, id));

    return new Response(
      JSON.stringify({
        ...program[0],
        majors,
        totalRegistrations: countResult[0]?.count || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[admissions/programs/[id] GET]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PUT /api/admissions/programs/[id]
 * Admin-only: update a program.
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
    const {
      title,
      academicYear,
      isActive,
      registrationOpen,
      startDate,
      endDate,
      enableMajorSelection,
      maxApplicants,
      autoCloseWhenFull,
      description,
    } = body;

    if (!title || !title.trim()) {
      return new Response(
        JSON.stringify({ error: "Judul program wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const slug = slugify(title);
    const now = new Date().toISOString();

    const result = await db
      .update(admissionPrograms)
      .set({
        title: title.trim(),
        slug,
        academicYear: academicYear?.trim() || undefined,
        isActive: isActive ?? undefined,
        registrationOpen: registrationOpen ?? undefined,
        startDate: startDate || null,
        endDate: endDate || null,
        enableMajorSelection: enableMajorSelection ?? undefined,
        maxApplicants: maxApplicants ?? null,
        autoCloseWhenFull: autoCloseWhenFull ?? undefined,
        description: description ?? null,
        updatedAt: now,
      })
      .where(eq(admissionPrograms.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Program tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = locals.user;
    await db
      .insert(activityLogs)
      .values({
        userId: user?.id || null,
        userName: user?.name || "Admin",
        userAvatar: user?.photoUrl || null,
        action: `memperbarui program penerimaan "${title}"`,
        moduleName: "Penerimaan",
        status: "Berhasil",
        createdAt: now,
      })
      .catch((err: any) => console.error("Activity log failed:", err));

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE")) {
      return new Response(
        JSON.stringify({ error: "Slug program sudah digunakan" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[admissions/programs/[id] PUT]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PATCH /api/admissions/programs/[id]
 * Admin-only: toggle specific fields (isActive, registrationOpen).
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
    const now = new Date().toISOString();

    // Only allow toggling specific fields
    const updateData: Record<string, any> = { updatedAt: now };
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;
    if (typeof body.registrationOpen === "boolean") updateData.registrationOpen = body.registrationOpen;

    const result = await db
      .update(admissionPrograms)
      .set(updateData)
      .where(eq(admissionPrograms.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Program tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = locals.user;
    const actions: string[] = [];
    if (typeof body.isActive === "boolean") {
      actions.push(body.isActive ? "mengaktifkan" : "menonaktifkan");
    }
    if (typeof body.registrationOpen === "boolean") {
      actions.push(body.registrationOpen ? "membuka pendaftaran" : "menutup pendaftaran");
    }

    await db
      .insert(activityLogs)
      .values({
        userId: user?.id || null,
        userName: user?.name || "Admin",
        userAvatar: user?.photoUrl || null,
        action: `${actions.join(" & ")} program "${result[0].title}"`,
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
    console.error("[admissions/programs/[id] PATCH]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/admissions/programs/[id]
 * Admin-only: delete a program (only if no registrations exist).
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

    // Check for existing registrations
    const regCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(eq(registrations.programId, id));

    if (regCount[0]?.count > 0) {
      return new Response(
        JSON.stringify({
          error: `Tidak dapat menghapus program yang memiliki ${regCount[0].count} pendaftar. Nonaktifkan saja.`,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete associated majors first (no registrations = safe)
    await db.delete(admissionMajors).where(eq(admissionMajors.programId, id));

    // Delete sequences
    await db.delete(registrationSequences).where(eq(registrationSequences.programId, id));

    // Delete the program
    const result = await db
      .delete(admissionPrograms)
      .where(eq(admissionPrograms.id, id))
      .returning();

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Program tidak ditemukan" }),
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
        action: `menghapus program penerimaan "${result[0].title}"`,
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
    console.error("[admissions/programs/[id] DELETE]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
