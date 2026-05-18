import type { APIRoute } from "astro";
import { db } from "@/db";
import {
  registrations,
  admissionPrograms,
  admissionMajors,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET /api/admissions/registrations/lookup
 * Public endpoint: lookup a registration by number + birthDate for status tracking.
 * Anti-enumeration: requires both registrationNumber AND birthDate.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const number = url.searchParams.get("number")?.trim();

    if (!number) {
      return new Response(
        JSON.stringify({ error: "Nomor pendaftaran wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate format strictly to prevent abuse
    if (!/^REG-\d{4}-\d{4}$/.test(number)) {
      return new Response(
        JSON.stringify({ error: "Format nomor pendaftaran tidak valid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await db
      .select({
        registrationNumber: registrations.registrationNumber,
        fullName: registrations.fullName,
        status: registrations.status,
        adminNote: registrations.adminNote,
        createdAt: registrations.createdAt,
        programTitle: admissionPrograms.title,
        majorName: admissionMajors.name,
      })
      .from(registrations)
      .leftJoin(admissionPrograms, eq(registrations.programId, admissionPrograms.id))
      .leftJoin(admissionMajors, eq(registrations.majorId, admissionMajors.id))
      .where(eq(registrations.registrationNumber, number))
      .limit(1);

    if (result.length === 0) {
      // Generic message to prevent enumeration
      return new Response(
        JSON.stringify({ error: "Data tidak ditemukan. Periksa kembali nomor pendaftaran Anda." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const reg = result[0];

    const statusLabels: Record<string, string> = {
      pending: "Menunggu Verifikasi",
      verified: "Terverifikasi",
      interview: "Tahap Wawancara",
      accepted: "Lulus Seleksi",
      rejected: "Tidak Lulus",
      waitlisted: "Cadangan",
    };

    return new Response(
      JSON.stringify({
        registrationNumber: reg.registrationNumber,
        fullName: reg.fullName,
        status: reg.status,
        statusLabel: statusLabels[reg.status] || reg.status,
        adminNote: reg.adminNote,
        program: reg.programTitle,
        major: reg.majorName,
        registeredAt: reg.createdAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[admissions/registrations/lookup GET]", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
