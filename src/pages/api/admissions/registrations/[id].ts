import type { APIRoute } from "astro";
import { db } from "@/db";
import {
  registrations,
  admissionPrograms,
  admissionMajors,
  registrationStatusLogs,
  activityLogs,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/admissions/registrations/[id]
 * Admin-only: get full detail of a registration including status history.
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

    // Get registration with program and major info
    const reg = await db
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
        fatherAddress: registrations.fatherAddress,
        motherName: registrations.motherName,
        motherPhone: registrations.motherPhone,
        motherOccupation: registrations.motherOccupation,
        motherAddress: registrations.motherAddress,
        extraData: registrations.extraData,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        programTitle: admissionPrograms.title,
        majorName: admissionMajors.name,
      })
      .from(registrations)
      .leftJoin(admissionPrograms, eq(registrations.programId, admissionPrograms.id))
      .leftJoin(admissionMajors, eq(registrations.majorId, admissionMajors.id))
      .where(eq(registrations.id, id))
      .limit(1);

    if (reg.length === 0) {
      return new Response(
        JSON.stringify({ error: "Pendaftar tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get status history
    const statusLogs = await db
      .select()
      .from(registrationStatusLogs)
      .where(eq(registrationStatusLogs.registrationId, id))
      .orderBy(desc(registrationStatusLogs.createdAt));

    return new Response(
      JSON.stringify({
        ...reg[0],
        statusHistory: statusLogs,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[admissions/registrations/[id] GET]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PATCH /api/admissions/registrations/[id]
 * Admin-only: update status and/or admin note. Creates audit log.
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
    const { status, adminNote } = body;

    const validStatuses = ["pending", "verified", "interview", "accepted", "rejected", "waitlisted"];
    if (status && !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Status tidak valid. Gunakan: ${validStatuses.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get current registration
    const current = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1);

    if (current.length === 0) {
      return new Response(
        JSON.stringify({ error: "Pendaftar tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    const previousStatus = current[0].status || "pending";
    const newStatus = status || previousStatus;

    // Update registration
    const updateData: Record<string, any> = { updatedAt: now };
    if (status) updateData.status = status;
    if (typeof adminNote === "string") updateData.adminNote = adminNote;

    const result = await db
      .update(registrations)
      .set(updateData)
      .where(eq(registrations.id, id))
      .returning();

    // Create status log if status changed
    if (status && status !== previousStatus) {
      const user = locals.user;
      await db
        .insert(registrationStatusLogs)
        .values({
          registrationId: id,
          previousStatus,
          newStatus: status,
          changedBy: user?.id || null,
          adminNote: adminNote || null,
          createdAt: now,
        })
        .catch((err: any) => console.error("Status log failed:", err));

      // Activity log
      await db
        .insert(activityLogs)
        .values({
          userId: user?.id || null,
          userName: user?.name || "Admin",
          userAvatar: user?.photoUrl || null,
          action: `mengubah status pendaftar "${current[0].fullName}" dari ${previousStatus} ke ${status}`,
          moduleName: "Penerimaan",
          status: "Berhasil",
          createdAt: now,
        })
        .catch((err: any) => console.error("Activity log failed:", err));
    }

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admissions/registrations/[id] PATCH]", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
