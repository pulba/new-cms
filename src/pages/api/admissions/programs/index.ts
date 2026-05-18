import type { APIRoute } from "astro";
import { db } from "@/db";
import { admissionPrograms, registrations, activityLogs } from "@/db/schema";
import { desc, eq, sql, and, like } from "drizzle-orm";
import { slugify } from "@/lib/slugify";

/**
 * GET /api/admissions/programs
 * Public: returns only active programs.
 * Admin (with ?all=true): returns all programs (middleware will gate mutations,
 * but reads are public — admin UI uses SSR initialData anyway).
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const showAll = url.searchParams.get("all") === "true";
    const search = url.searchParams.get("search") || "";

    const conditions = [];
    if (!showAll) {
      conditions.push(eq(admissionPrograms.isActive, true));
    }
    if (search) {
      conditions.push(like(admissionPrograms.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const programs = await db
      .select()
      .from(admissionPrograms)
      .where(whereClause)
      .orderBy(desc(admissionPrograms.createdAt));

    // Attach registration counts per program
    const programsWithCounts = await Promise.all(
      programs.map(async (p) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(registrations)
          .where(eq(registrations.programId, p.id));
        return {
          ...p,
          totalRegistrations: countResult[0]?.count || 0,
        };
      })
    );

    return new Response(JSON.stringify(programsWithCounts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admissions/programs GET]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/admissions/programs
 * Admin-only: create a new admission program.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    // Validation
    if (!title || !title.trim()) {
      return new Response(
        JSON.stringify({ error: "Judul program wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!academicYear || !academicYear.trim()) {
      return new Response(
        JSON.stringify({ error: "Tahun ajaran wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const slug = slugify(title);
    const now = new Date().toISOString();

    const result = await db
      .insert(admissionPrograms)
      .values({
        title: title.trim(),
        slug,
        academicYear: academicYear.trim(),
        isActive: isActive ?? false,
        registrationOpen: registrationOpen ?? false,
        startDate: startDate || null,
        endDate: endDate || null,
        enableMajorSelection: enableMajorSelection ?? false,
        maxApplicants: maxApplicants || null,
        autoCloseWhenFull: autoCloseWhenFull ?? false,
        description: description || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Activity log
    const user = locals.user;
    await db
      .insert(activityLogs)
      .values({
        userId: user?.id || null,
        userName: user?.name || "Admin",
        userAvatar: user?.photoUrl || null,
        action: `membuat program penerimaan "${title}"`,
        moduleName: "Penerimaan",
        status: "Berhasil",
        createdAt: now,
      })
      .catch((err: any) => console.error("Activity log failed:", err));

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE")) {
      return new Response(
        JSON.stringify({ error: "Slug program sudah digunakan. Gunakan judul yang berbeda." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[admissions/programs POST]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
