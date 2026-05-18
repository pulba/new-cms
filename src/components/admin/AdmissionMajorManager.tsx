import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface AdmissionMajor {
  id: number;
  programId: number;
  name: string;
  slug: string;
  description: string | null;
  quota: number;
  currentApplicants: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Program {
  id: number;
  title: string;
  enableMajorSelection: boolean;
}

const emptyForm = {
  programId: "",
  name: "",
  description: "",
  quota: "0",
  isActive: true,
  sortOrder: "0",
};

interface Props {
  initialPrograms?: Program[];
}

export function AdmissionMajorManager({ initialPrograms }: Props) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms || []);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [majors, setMajors] = useState<AdmissionMajor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch programs if not SSR-provided
  useEffect(() => {
    if (!initialPrograms) {
      fetch("/api/admissions/programs?all=true")
        .then((r) => r.json())
        .then(setPrograms)
        .catch(() => toast.error("Gagal memuat program"));
    }
  }, []);

  // Set initial selection
  useEffect(() => {
    if (programs.length > 0 && !selectedProgramId) {
      setSelectedProgramId(programs[0].id.toString());
    }
  }, [programs]);

  // Fetch majors when program changes
  const fetchMajors = useCallback(async () => {
    if (!selectedProgramId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admissions/majors?programId=${selectedProgramId}&all=true`);
      const data = await res.json();
      setMajors(data);
    } catch {
      toast.error("Gagal memuat jurusan");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    fetchMajors();
  }, [selectedProgramId]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, programId: selectedProgramId });
    setFormOpen(true);
  };

  const openEditForm = (m: AdmissionMajor) => {
    setEditingId(m.id);
    setForm({
      programId: m.programId.toString(),
      name: m.name,
      description: m.description || "",
      quota: m.quota.toString(),
      isActive: m.isActive,
      sortOrder: m.sortOrder.toString(),
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama jurusan wajib diisi");
      return;
    }
    if (!form.programId) {
      toast.error("Pilih program terlebih dahulu");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId
        ? `/api/admissions/majors/${editingId}`
        : "/api/admissions/majors";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...form,
        quota: parseInt(form.quota) || 0,
        sortOrder: parseInt(form.sortOrder) || 0,
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

      toast.success(editingId ? "Jurusan diperbarui" : "Jurusan ditambahkan");
      setFormOpen(false);
      fetchMajors();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan jurusan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: number, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/admissions/majors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentValue }),
      });
      if (res.ok) {
        toast.success(!currentValue ? "Jurusan diaktifkan" : "Jurusan dinonaktifkan");
        fetchMajors();
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admissions/majors/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Jurusan dihapus");
        fetchMajors();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Gagal menghapus");
      }
    } catch {
      toast.error("Gagal menghapus jurusan");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const selectedProgram = programs.find((p) => p.id.toString() === selectedProgramId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Jurusan</h1>
          <p className="text-muted-foreground text-sm">
            Kelola jurusan/kompetensi keahlian per program penerimaan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Pilih Program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openAddForm} disabled={!selectedProgramId}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Jurusan
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      {selectedProgram && !selectedProgram.enableMajorSelection && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <strong>Info:</strong> Program <em>"{selectedProgram.title}"</em> belum mengaktifkan pemilihan jurusan.
          Jurusan yang ditambahkan di sini tidak akan muncul di form pendaftaran sampai fitur diaktifkan.
        </div>
      )}

      {/* Table */}
      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nama Jurusan</TableHead>
                <TableHead className="w-32">Kuota</TableHead>
                <TableHead className="w-32">Pendaftar</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-900 opacity-20" />
                    <p className="mt-3 text-muted-foreground">Memuat jurusan...</p>
                  </TableCell>
                </TableRow>
              ) : majors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 opacity-10 mb-3" />
                    <p className="font-medium">Belum ada jurusan</p>
                    <p className="text-sm">Tambah jurusan baru untuk program ini.</p>
                  </TableCell>
                </TableRow>
              ) : (
                majors.map((m, i) => {
                  const quotaPercent = m.quota > 0 ? Math.round((m.currentApplicants / m.quota) * 100) : 0;
                  return (
                    <TableRow key={m.id} className={!m.isActive ? "opacity-50" : ""}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{m.name}</p>
                          {m.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{m.quota}</p>
                          {m.quota > 0 && (
                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, quotaPercent)}%`,
                                  backgroundColor: quotaPercent >= 90 ? "#ef4444" : quotaPercent >= 70 ? "#f59e0b" : "#22c55e",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{m.currentApplicants}</span>
                        {m.quota > 0 && <span className="text-muted-foreground text-xs"> / {m.quota}</span>}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={m.isActive}
                          onCheckedChange={() => handleToggle(m.id, m.isActive)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(m.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Jurusan" : "Tambah Jurusan Baru"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Jurusan <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Contoh: Rekayasa Perangkat Lunak"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (Opsional)</Label>
              <Textarea
                placeholder="Deskripsi singkat jurusan..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kuota</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.quota}
                  onChange={(e) => setForm({ ...form, quota: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Switch
                id="major-active"
                checked={form.isActive}
                onCheckedChange={(c) => setForm({ ...form, isActive: c })}
              />
              <Label htmlFor="major-active" className="cursor-pointer">
                Jurusan aktif
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Jurusan?</DialogTitle>
            <DialogDescription>
              Jurusan hanya dapat dihapus jika belum memiliki pendaftar. Jika sudah ada pendaftar, nonaktifkan saja.
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
