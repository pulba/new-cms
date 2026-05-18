import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileDown,
  ClipboardList,
  User,
  School,
  Users as UsersIcon,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────
interface Registration {
  id: number;
  registrationNumber: string;
  programId: number;
  majorId: number | null;
  status: string;
  adminNote: string | null;
  fullName: string;
  nickName: string | null;
  birthPlace: string;
  birthDate: string;
  gender: string;
  religion: string;
  phone: string | null;
  email: string | null;
  address: string;
  originSchool: string;
  originSchoolAddress: string | null;
  fatherName: string;
  fatherPhone: string | null;
  fatherOccupation: string | null;
  motherName: string;
  motherPhone: string | null;
  motherOccupation: string | null;
  createdAt: string;
  updatedAt: string;
  programTitle: string | null;
  majorName: string | null;
}

interface RegistrationDetail extends Registration {
  fatherAddress: string | null;
  motherAddress: string | null;
  extraData: string | null;
  statusHistory: StatusLog[];
}

interface StatusLog {
  id: number;
  previousStatus: string;
  newStatus: string;
  changedBy: string | null;
  adminNote: string | null;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Program {
  id: number;
  title: string;
}

interface Major {
  id: number;
  name: string;
  programId: number;
}

interface Props {
  initialData?: {
    data: Registration[];
    pagination: PaginationInfo;
  };
  initialPrograms?: Program[];
}

// ─── Status Config ──────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Menunggu", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  verified: { label: "Terverifikasi", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  interview: { label: "Wawancara", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
  accepted: { label: "Diterima", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  rejected: { label: "Ditolak", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
  waitlisted: { label: "Cadangan", color: "text-slate-700", bgColor: "bg-slate-50 border-slate-200" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────
export function RegistrationManager({ initialData, initialPrograms }: Props) {
  const [regs, setRegs] = useState<Registration[]>(initialData?.data || []);
  const [pagination, setPagination] = useState<PaginationInfo>(
    initialData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
  );
  const [programs, setPrograms] = useState<Program[]>(initialPrograms || []);
  const [majors, setMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(!initialData);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [majorFilter, setMajorFilter] = useState("all");

  // Detail dialog
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RegistrationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Status update dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const [hasInitialData] = useState(!!initialData);

  // ─── Fetch Programs ──────────────────────────────────────
  useEffect(() => {
    if (!initialPrograms) {
      fetch("/api/admissions/programs?all=true")
        .then((r) => r.json())
        .then(setPrograms)
        .catch(() => {});
    }
  }, []);

  // ─── Fetch Majors when program filter changes ────────────
  useEffect(() => {
    if (programFilter && programFilter !== "all") {
      fetch(`/api/admissions/majors?programId=${programFilter}&all=true`)
        .then((r) => r.json())
        .then(setMajors)
        .catch(() => {});
    } else {
      setMajors([]);
      setMajorFilter("all");
    }
  }, [programFilter]);

  // ─── Fetch Registrations ─────────────────────────────────
  const fetchRegistrations = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (programFilter && programFilter !== "all") params.set("programId", programFilter);
      if (majorFilter && majorFilter !== "all") params.set("majorId", majorFilter);

      const res = await fetch(`/api/admissions/registrations?${params}`);
      const data = await res.json();
      setRegs(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error("Gagal memuat data pendaftar");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, programFilter, majorFilter]);

  useEffect(() => {
    if (hasInitialData && search === "" && statusFilter === "all" && programFilter === "all") return;
    const timer = setTimeout(() => fetchRegistrations(1), 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, programFilter, majorFilter]);

  // ─── View Detail ──────────────────────────────────────────
  const viewDetail = async (id: number) => {
    setSelectedId(id);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admissions/registrations/${id}`);
      const data = await res.json();
      setDetail(data);
    } catch {
      toast.error("Gagal memuat detail pendaftar");
      setSelectedId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ─── Status Update ───────────────────────────────────────
  const openStatusDialog = () => {
    if (!detail) return;
    setNewStatus(detail.status);
    setAdminNote(detail.adminNote || "");
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!detail) return;
    setIsSavingStatus(true);
    try {
      const res = await fetch(`/api/admissions/registrations/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memperbarui status");
      }

      toast.success("Status pendaftar diperbarui");
      setStatusDialogOpen(false);
      // Refresh detail and list
      viewDetail(detail.id);
      fetchRegistrations(pagination.page);
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui status");
    } finally {
      setIsSavingStatus(false);
    }
  };

  // ─── XLSX Export ───────────────────────────────────────────
  const handleExport = async () => {
    if (regs.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (programFilter && programFilter !== "all") params.set("programId", programFilter);
      if (majorFilter && majorFilter !== "all") params.set("majorId", majorFilter);

      const res = await fetch(`/api/admissions/registrations/export?${params}`);
      if (!res.ok) throw new Error("Gagal mengekspor data");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Extract filename from Content-Disposition if possible
      let filename = `pendaftar_${new Date().toISOString().split("T")[0]}.xlsx`;
      const disposition = res.headers.get("Content-Disposition");
      if (disposition && disposition.includes("filename=")) {
        const matches = /filename="([^"]+)"/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1];
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Data berhasil diekspor");
    } catch (err) {
      toast.error("Gagal mengekspor data");
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Pendaftar</h1>
          <p className="text-muted-foreground text-sm">
            Kelola dan verifikasi data pendaftaran peserta didik baru.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* ─── Toolbar / Filters ───────────────────────── */}
      <div className="admin-card flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama, no. pendaftaran, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Semua Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Program</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {majors.length > 0 && (
          <Select value={majorFilter} onValueChange={setMajorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {majors.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ─── Table ───────────────────────────────────── */}
      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">No. Pendaftaran</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead className="w-40">Program</TableHead>
                <TableHead className="w-32">Jurusan</TableHead>
                <TableHead className="w-32">Asal Sekolah</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-28">Tanggal</TableHead>
                <TableHead className="w-20 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-900 opacity-20" />
                    <p className="mt-3 text-muted-foreground">Memuat data pendaftar...</p>
                  </TableCell>
                </TableRow>
              ) : regs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-20 text-center text-muted-foreground">
                    <ClipboardList className="mx-auto h-10 w-10 opacity-10 mb-3" />
                    <p className="font-medium">Belum ada pendaftar</p>
                    <p className="text-sm">Data akan muncul setelah ada yang mendaftar.</p>
                  </TableCell>
                </TableRow>
              ) : (
                regs.map((r) => (
                  <TableRow key={r.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        {r.registrationNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.fullName}</p>
                        {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.programTitle || "-"}</TableCell>
                    <TableCell className="text-sm">{r.majorName || "-"}</TableCell>
                    <TableCell className="text-sm truncate max-w-[120px]">{r.originSchool}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => viewDetail(r.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Pagination ────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-muted-foreground">
              Menampilkan {regs.length} dari {pagination.total} pendaftar
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchRegistrations(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchRegistrations(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Dialog ───────────────────────────── */}
      <Dialog open={selectedId !== null} onOpenChange={() => { setSelectedId(null); setDetail(null); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detail Pendaftar
              {detail && (
                <code className="ml-2 text-sm font-normal bg-slate-100 px-2 py-0.5 rounded">
                  {detail.registrationNumber}
                </code>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Status & Actions */}
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={detail.status} />
                  <span className="text-sm text-muted-foreground">
                    {detail.programTitle}
                    {detail.majorName && ` — ${detail.majorName}`}
                  </span>
                </div>
                <Button size="sm" onClick={openStatusDialog}>
                  Ubah Status
                </Button>
              </div>

              {/* Admin Note */}
              {detail.adminNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                  <strong className="text-amber-800">Catatan Admin:</strong>
                  <p className="text-amber-700 mt-1">{detail.adminNote}</p>
                </div>
              )}

              {/* Personal Data */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" /> Data Pribadi
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <InfoRow label="Nama Lengkap" value={detail.fullName} />
                  <InfoRow label="Nama Panggilan" value={detail.nickName} />
                  <InfoRow label="Tempat Lahir" value={detail.birthPlace} />
                  <InfoRow label="Tanggal Lahir" value={detail.birthDate ? new Date(detail.birthDate).toLocaleDateString("id-ID") : "-"} />
                  <InfoRow label="Jenis Kelamin" value={detail.gender === "L" ? "Laki-laki" : "Perempuan"} />
                  <InfoRow label="Agama" value={detail.religion} />
                  <InfoRow label="No. HP" value={detail.phone} />
                  <InfoRow label="Email" value={detail.email} />
                  <InfoRow label="Alamat" value={detail.address} className="col-span-2" />
                </div>
              </div>

              {/* School Data */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <School className="h-4 w-4" /> Asal Sekolah
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <InfoRow label="Nama Sekolah" value={detail.originSchool} />
                  <InfoRow label="Alamat Sekolah" value={detail.originSchoolAddress} />
                </div>
              </div>

              {/* Parent Data */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <UsersIcon className="h-4 w-4" /> Data Orang Tua
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <InfoRow label="Nama Ayah" value={detail.fatherName} />
                  <InfoRow label="Nama Ibu" value={detail.motherName} />
                  <InfoRow label="HP Ayah" value={detail.fatherPhone} />
                  <InfoRow label="HP Ibu" value={detail.motherPhone} />
                  <InfoRow label="Pekerjaan Ayah" value={detail.fatherOccupation} />
                  <InfoRow label="Pekerjaan Ibu" value={detail.motherOccupation} />
                </div>
              </div>

              {/* Status History */}
              {detail.statusHistory && detail.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" /> Riwayat Status
                  </h3>
                  <div className="space-y-2">
                    {detail.statusHistory.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 text-sm border-l-2 border-slate-200 pl-3 py-1">
                        <StatusBadge status={log.newStatus} />
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.createdAt).toLocaleString("id-ID")}
                        </span>
                        {log.adminNote && (
                          <span className="text-xs text-muted-foreground italic">— {log.adminNote}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── Status Update Dialog ────────────────────── */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Ubah Status Pendaftar</DialogTitle>
            <DialogDescription>
              {detail?.fullName} — {detail?.registrationNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status Baru</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan Admin (Opsional)</Label>
              <Textarea
                rows={3}
                placeholder="Tambahkan catatan..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isSavingStatus}>
              {isSavingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Perbarui Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper Component ────────────────────────────────────────
function InfoRow({ label, value, className = "" }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}
