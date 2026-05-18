import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Users,
  GraduationCap,
  Power,
  DoorOpen,
} from "lucide-react";
import { toast } from "sonner";

interface AdmissionProgram {
  id: number;
  title: string;
  slug: string;
  academicYear: string;
  isActive: boolean;
  registrationOpen: boolean;
  startDate: string | null;
  endDate: string | null;
  enableMajorSelection: boolean;
  maxApplicants: number | null;
  autoCloseWhenFull: boolean;
  description: string | null;
  totalRegistrations: number;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  title: "",
  academicYear: "",
  isActive: false,
  registrationOpen: false,
  startDate: "",
  endDate: "",
  enableMajorSelection: false,
  maxApplicants: "",
  autoCloseWhenFull: false,
  description: "",
};

interface Props {
  initialData?: AdmissionProgram[];
}

export function AdmissionProgramManager({ initialData }: Props) {
  const [programs, setPrograms] = useState<AdmissionProgram[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admissions/programs?all=true");
      const data = await res.json();
      setPrograms(data);
    } catch {
      toast.error("Gagal memuat program penerimaan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) fetchPrograms();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (p: AdmissionProgram) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      academicYear: p.academicYear,
      isActive: p.isActive,
      registrationOpen: p.registrationOpen,
      startDate: p.startDate?.substring(0, 10) || "",
      endDate: p.endDate?.substring(0, 10) || "",
      enableMajorSelection: p.enableMajorSelection,
      maxApplicants: p.maxApplicants?.toString() || "",
      autoCloseWhenFull: p.autoCloseWhenFull,
      description: p.description || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Judul program wajib diisi");
      return;
    }
    if (!form.academicYear.trim()) {
      toast.error("Tahun ajaran wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId
        ? `/api/admissions/programs/${editingId}`
        : "/api/admissions/programs";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        maxApplicants: form.maxApplicants ? parseInt(form.maxApplicants) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menyimpan");
      }

      toast.success(editingId ? "Program diperbarui" : "Program ditambahkan");
      setFormOpen(false);
      fetchPrograms();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan program");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: number, field: "isActive" | "registrationOpen", value: boolean) => {
    try {
      const res = await fetch(`/api/admissions/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !value }),
      });
      if (res.ok) {
        const label = field === "isActive"
          ? (!value ? "Program diaktifkan" : "Program dinonaktifkan")
          : (!value ? "Pendaftaran dibuka" : "Pendaftaran ditutup");
        toast.success(label);
        fetchPrograms();
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admissions/programs/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Program dihapus");
        fetchPrograms();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Gagal menghapus");
      }
    } catch {
      toast.error("Gagal menghapus program");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Program Penerimaan</h1>
          <p className="text-muted-foreground text-sm">
            Kelola program penerimaan peserta didik baru (misal: SPMB 2026, PPDB Gelombang 1).
          </p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Program
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : programs.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <GraduationCap className="mx-auto h-12 w-12 opacity-20 mb-4" />
          <p className="text-lg font-medium text-foreground">Belum ada program penerimaan</p>
          <p className="text-sm">Buat program pertama untuk mulai menerima pendaftaran.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {programs.map((p) => (
            <Card key={p.id} className={!p.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{p.title}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      TA {p.academicYear}
                      {p.startDate && ` • ${new Date(p.startDate).toLocaleDateString("id-ID")}`}
                      {p.endDate && ` — ${new Date(p.endDate).toLocaleDateString("id-ID")}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant={p.isActive ? "default" : "secondary"}>
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                    {p.registrationOpen && (
                      <Badge variant="default" className="bg-green-600">
                        Buka
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-900">{p.totalRegistrations}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendaftar</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-900">{p.maxApplicants || "∞"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Kuota</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-900">
                      {p.enableMajorSelection ? "Ya" : "Tidak"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jurusan</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between items-center border-t px-6 py-3 bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${p.id}`}
                      checked={p.isActive}
                      onCheckedChange={() => handleToggle(p.id, "isActive", p.isActive)}
                    />
                    <Label htmlFor={`active-${p.id}`} className="text-xs cursor-pointer">
                      <Power className="h-3 w-3 inline mr-1" />
                      Aktif
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`open-${p.id}`}
                      checked={p.registrationOpen}
                      onCheckedChange={() => handleToggle(p.id, "registrationOpen", p.registrationOpen)}
                    />
                    <Label htmlFor={`open-${p.id}`} className="text-xs cursor-pointer">
                      <DoorOpen className="h-3 w-3 inline mr-1" />
                      Buka
                    </Label>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Program" : "Tambah Program Baru"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Judul Program <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Contoh: SPMB 2026/2027"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tahun Ajaran <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Contoh: 2026/2027"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Berakhir</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kuota Maksimal (Opsional)</Label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak ada batas"
                value={form.maxApplicants}
                onChange={(e) => setForm({ ...form, maxApplicants: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi (Opsional)</Label>
              <Textarea
                placeholder="Deskripsi singkat tentang program ini..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="form-major"
                  checked={form.enableMajorSelection}
                  onCheckedChange={(c) => setForm({ ...form, enableMajorSelection: c })}
                />
                <Label htmlFor="form-major" className="cursor-pointer">
                  Aktifkan pemilihan jurusan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="form-autoclose"
                  checked={form.autoCloseWhenFull}
                  onCheckedChange={(c) => setForm({ ...form, autoCloseWhenFull: c })}
                />
                <Label htmlFor="form-autoclose" className="cursor-pointer">
                  Otomatis tutup saat kuota penuh
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="form-active"
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm({ ...form, isActive: c })}
                />
                <Label htmlFor="form-active" className="cursor-pointer">
                  Program aktif
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="form-open"
                  checked={form.registrationOpen}
                  onCheckedChange={(c) => setForm({ ...form, registrationOpen: c })}
                />
                <Label htmlFor="form-open" className="cursor-pointer">
                  Pendaftaran dibuka
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Simpan" : "Buat Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Program?</DialogTitle>
            <DialogDescription>
              Program hanya dapat dihapus jika belum memiliki pendaftar. Jika sudah ada pendaftar, nonaktifkan saja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
