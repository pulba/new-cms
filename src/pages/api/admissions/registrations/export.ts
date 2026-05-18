import type { APIRoute } from "astro";
import { db } from "@/db";
import {
  registrations,
  admissionPrograms,
  admissionMajors,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import * as XLSX from "xlsx";

/**
 * GET /api/admissions/registrations/export
 * Admin-only: Export registrations as XLSX with human-readable columns.
 * Query params: status, programId, majorId
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get("status") || "";
    const programId = url.searchParams.get("programId") || "";
    const majorId = url.searchParams.get("majorId") || "";

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(registrations.status, status as any));
    }
    if (programId && programId !== "all") {
      conditions.push(eq(registrations.programId, parseInt(programId)));
    }
    if (majorId && majorId !== "all") {
      conditions.push(eq(registrations.majorId, parseInt(majorId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const regs = await db
      .select({
        registrationNumber: registrations.registrationNumber,
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
        status: registrations.status,
        adminNote: registrations.adminNote,
        createdAt: registrations.createdAt,
        programTitle: admissionPrograms.title,
        majorName: admissionMajors.name,
      })
      .from(registrations)
      .leftJoin(admissionPrograms, eq(registrations.programId, admissionPrograms.id))
      .leftJoin(admissionMajors, eq(registrations.majorId, admissionMajors.id))
      .where(whereClause)
      .orderBy(desc(registrations.createdAt));

    // Status label map
    const statusLabels: Record<string, string> = {
      pending: "Menunggu",
      verified: "Terverifikasi",
      interview: "Wawancara",
      accepted: "Diterima",
      rejected: "Ditolak",
      waitlisted: "Cadangan",
    };

    // Transform to human-readable rows
    const rows = regs.map((r, i) => ({
      "No": i + 1,
      "No. Pendaftaran": r.registrationNumber,
      "Nama Lengkap": r.fullName,
      "Nama Panggilan": r.nickName || "",
      "Tempat Lahir": r.birthPlace,
      "Tanggal Lahir": r.birthDate ? new Date(r.birthDate).toLocaleDateString("id-ID") : "",
      "Jenis Kelamin": r.gender === "L" ? "Laki-laki" : "Perempuan",
      "Agama": r.religion,
      "No. HP": r.phone || "",
      "Email": r.email || "",
      "Alamat": r.address,
      "Asal Sekolah": r.originSchool,
      "Alamat Sekolah": r.originSchoolAddress || "",
      "Nama Ayah": r.fatherName,
      "HP Ayah": r.fatherPhone || "",
      "Pekerjaan Ayah": r.fatherOccupation || "",
      "Nama Ibu": r.motherName,
      "HP Ibu": r.motherPhone || "",
      "Pekerjaan Ibu": r.motherOccupation || "",
      "Program": r.programTitle || "",
      "Jurusan": r.majorName || "-",
      "Status": statusLabels[r.status] || r.status,
      "Catatan Admin": r.adminNote || "",
      "Tanggal Daftar": r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Build workbook
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key] || "").length).slice(0, 50)) + 2,
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pendaftar");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `pendaftar_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[admissions/registrations/export GET]", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengekspor data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
