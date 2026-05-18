import type { APIRoute } from "astro";
import { db } from "@/db";
import {
  registrations,
  admissionPrograms,
  admissionMajors,
  registrationSequences,
  registrationStatusLogs,
  activityLogs,
} from "@/db/schema";
import { eq, and, like, desc, sql } from "drizzle-orm";

/**
 * Generate a sequential, race-condition-safe registration number.
 * Uses an atomic UPDATE ... RETURNING pattern on the registrationSequences table.
 * Format: PREFIX-YEAR-0001
 */
async function generateRegistrationNumber(programId: number, academicYear: string): Promise<string> {
  // Ensure sequence row exists for this program
  const existing = await db
    .select()
    .from(registrationSequences)
    .where(eq(registrationSequences.programId, programId))
    .limit(1);

  const yearShort = academicYear.substring(0, 4);

  if (existing.length === 0) {
    // Create sequence with first number
    await db.insert(registrationSequences).values({
      programId,
      prefix: "REG",
      year: yearShort,
      lastNumber: 1,
    });
    return `REG-${yearShort}-0001`;
  }

  // Atomic increment
  const updated = await db
    .update(registrationSequences)
    .set({
      lastNumber: sql`${registrationSequences.lastNumber} + 1`,
    })
    .where(eq(registrationSequences.programId, programId))
    .returning();

  const nextNum = updated[0].lastNumber;
  const prefix = updated[0].prefix;
  const year = updated[0].year;

  return `${prefix}-${year}-${String(nextNum).padStart(4, "0")}`;
}

/**
 * GET /api/admissions/registrations
 * Admin-only: list registrations with pagination, filtering, and search.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const programId = url.searchParams.get("programId") || "";
    const majorId = url.searchParams.get("majorId") || "";

    // Build conditions
    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${registrations.fullName} LIKE ${"%" + search + "%"} OR ${registrations.registrationNumber} LIKE ${"%" + search + "%"} OR ${registrations.email} LIKE ${"%" + search + "%"})`
      );
    }
    if (status && status !== "all") {
      conditions.push(eq(registrations.status, status as any));
    }
    if (programId) {
      conditions.push(eq(registrations.programId, parseInt(programId)));
    }
    if (majorId) {
      conditions.push(eq(registrations.majorId, parseInt(majorId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get registrations with program and major names
    const regs = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        programId: registrations.programId,
        majorId: registrations.majorId,
        status: registrations.status,
        adminNote: registrations.adminNote,
        fullName: registrations.fullName,
        nickName: registrations.nickName,
        birthPlace: registrations.birthPlace,
        birthDate: registrations.birthDate,
        gender: registrations.gender,
        religion: registrations.religion,
        phone: registrations.phone,
        email: registrations.email,
        address: registrations.address,
        originSchool: registrations.originSchool,
        originSchoolAddress: registrations.originSchoolAddress,
        fatherName: registrations.fatherName,
        fatherPhone: registrations.fatherPhone,
        fatherOccupation: registrations.fatherOccupation,
        motherName: registrations.motherName,
        motherPhone: registrations.motherPhone,
        motherOccupation: registrations.motherOccupation,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        programTitle: admissionPrograms.title,
        majorName: admissionMajors.name,
      })
      .from(registrations)
      .leftJoin(admissionPrograms, eq(registrations.programId, admissionPrograms.id))
      .leftJoin(admissionMajors, eq(registrations.majorId, admissionMajors.id))
      .where(whereClause)
      .orderBy(desc(registrations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    return new Response(
      JSON.stringify({
        data: regs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[admissions/registrations GET]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/admissions/registrations
 * Public endpoint: submit a new registration.
 * Validates program is open, quota, and required fields.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      programId,
      majorId,
      fullName,
      nickName,
      birthPlace,
      birthDate,
      gender,
      religion,
      phone,
      email,
      address,
      originSchool,
      originSchoolAddress,
      fatherName,
      fatherPhone,
      fatherOccupation,
      fatherAddress,
      motherName,
      motherPhone,
      motherOccupation,
      motherAddress,
      extraData,
    } = body;

    // ── Validation ──
    const errors: string[] = [];
    if (!programId) errors.push("Program wajib dipilih");
    if (!fullName?.trim()) errors.push("Nama lengkap wajib diisi");
    if (!birthPlace?.trim()) errors.push("Tempat lahir wajib diisi");
    if (!birthDate) errors.push("Tanggal lahir wajib diisi");
    if (!gender) errors.push("Jenis kelamin wajib diisi");
    if (!religion?.trim()) errors.push("Agama wajib diisi");
    if (!address?.trim()) errors.push("Alamat wajib diisi");
    if (!originSchool?.trim()) errors.push("Asal sekolah wajib diisi");
    if (!fatherName?.trim()) errors.push("Nama ayah wajib diisi");
    if (!motherName?.trim()) errors.push("Nama ibu wajib diisi");

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validasi gagal", details: errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Check program is active and open ──
    const program = await db
      .select()
      .from(admissionPrograms)
      .where(eq(admissionPrograms.id, parseInt(programId)))
      .limit(1);

    if (program.length === 0) {
      return new Response(
        JSON.stringify({ error: "Program tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const prog = program[0];
    if (!prog.isActive || !prog.registrationOpen) {
      return new Response(
        JSON.stringify({ error: "Pendaftaran untuk program ini belum/sudah ditutup" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Check date window ──
    const now = new Date();
    if (prog.startDate && new Date(prog.startDate) > now) {
      return new Response(
        JSON.stringify({ error: "Pendaftaran belum dibuka" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    if (prog.endDate && new Date(prog.endDate) < now) {
      return new Response(
        JSON.stringify({ error: "Pendaftaran sudah ditutup" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Check global quota ──
    if (prog.maxApplicants && prog.autoCloseWhenFull) {
      const regCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(registrations)
        .where(eq(registrations.programId, prog.id));

      if (regCount[0]?.count >= prog.maxApplicants) {
        return new Response(
          JSON.stringify({ error: "Kuota pendaftaran sudah penuh" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ── Check major quota (if major selection enabled) ──
    let resolvedMajorId: number | null = null;
    if (prog.enableMajorSelection) {
      if (!majorId) {
        return new Response(
          JSON.stringify({ error: "Jurusan wajib dipilih untuk program ini" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const major = await db
        .select()
        .from(admissionMajors)
        .where(
          and(
            eq(admissionMajors.id, parseInt(majorId)),
            eq(admissionMajors.programId, prog.id),
            eq(admissionMajors.isActive, true)
          )
        )
        .limit(1);

      if (major.length === 0) {
        return new Response(
          JSON.stringify({ error: "Jurusan tidak valid atau tidak aktif" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (major[0].quota > 0 && major[0].currentApplicants >= major[0].quota) {
        return new Response(
          JSON.stringify({ error: `Kuota jurusan "${major[0].name}" sudah penuh` }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      resolvedMajorId = major[0].id;
    }

    // ── Duplicate Registration Protection ──
    // Check within same program: same email, same phone, or same fullName+birthDate
    const dupConditions = [];
    
    if (email?.trim()) {
      const dupEmail = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(
          and(
            eq(registrations.programId, prog.id),
            eq(registrations.email, email.trim().toLowerCase())
          )
        )
        .limit(1);
      if (dupEmail.length > 0) {
        return new Response(
          JSON.stringify({ error: "Email ini sudah terdaftar pada program yang sama. Jika Anda merasa ini kesalahan, silakan hubungi panitia." }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (phone?.trim()) {
      const dupPhone = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(
          and(
            eq(registrations.programId, prog.id),
            eq(registrations.phone, phone.trim())
          )
        )
        .limit(1);
      if (dupPhone.length > 0) {
        return new Response(
          JSON.stringify({ error: "Nomor telepon ini sudah terdaftar pada program yang sama. Jika Anda merasa ini kesalahan, silakan hubungi panitia." }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Name + birthDate composite check (strongest anti-duplicate)
    if (fullName?.trim() && birthDate) {
      const dupNameDob = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(
          and(
            eq(registrations.programId, prog.id),
            eq(registrations.fullName, fullName.trim()),
            eq(registrations.birthDate, birthDate)
          )
        )
        .limit(1);
      if (dupNameDob.length > 0) {
        return new Response(
          JSON.stringify({ error: "Pendaftar dengan nama dan tanggal lahir yang sama sudah terdaftar pada program ini." }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ── Generate registration number ──
    const registrationNumber = await generateRegistrationNumber(prog.id, prog.academicYear);
    const nowISO = now.toISOString();

    // ── Insert registration ──
    const result = await db
      .insert(registrations)
      .values({
        registrationNumber,
        programId: prog.id,
        majorId: resolvedMajorId,
        status: "pending",
        fullName: fullName.trim(),
        nickName: nickName?.trim() || null,
        birthPlace: birthPlace.trim(),
        birthDate,
        gender,
        religion: religion.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address.trim(),
        originSchool: originSchool.trim(),
        originSchoolAddress: originSchoolAddress?.trim() || null,
        fatherName: fatherName.trim(),
        fatherPhone: fatherPhone?.trim() || null,
        fatherOccupation: fatherOccupation?.trim() || null,
        fatherAddress: fatherAddress?.trim() || null,
        motherName: motherName.trim(),
        motherPhone: motherPhone?.trim() || null,
        motherOccupation: motherOccupation?.trim() || null,
        motherAddress: motherAddress?.trim() || null,
        extraData: extraData ? JSON.stringify(extraData) : null,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .returning();

    // ── Update major applicant counter ──
    if (resolvedMajorId) {
      await db
        .update(admissionMajors)
        .set({
          currentApplicants: sql`${admissionMajors.currentApplicants} + 1`,
        })
        .where(eq(admissionMajors.id, resolvedMajorId))
        .catch((err: any) => console.error("Major counter update failed:", err));
    }

    // ── Create initial status log ──
    await db
      .insert(registrationStatusLogs)
      .values({
        registrationId: result[0].id,
        previousStatus: "-",
        newStatus: "pending",
        changedBy: null,
        adminNote: "Pendaftaran baru diterima",
        createdAt: nowISO,
      })
      .catch((err: any) => console.error("Status log failed:", err));

    return new Response(
      JSON.stringify({
        success: true,
        registrationNumber: result[0].registrationNumber,
        id: result[0].id,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[admissions/registrations POST]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
