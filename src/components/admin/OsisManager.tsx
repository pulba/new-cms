import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  UserPlus,
  ImageIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface OsisMember {
  id: number;
  name: string;
  position: string | null;
  photo: string | null;
  description: string | null;
}

const emptyForm: Omit<OsisMember, "id"> = {
  name: "",
  position: "",
  photo: "",
  description: "",
};

export function OsisManager() {
  const [osisList, setOsisList] = useState<OsisMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOsis = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/osis");
      const data = await res.json();
      setOsisList(data);
    } catch {
      toast.error("Gagal memuat data pengurus OSIS");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOsis();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (member: OsisMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      position: member.position || "",
      photo: member.photo || "",
      description: member.description || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId ? `/api/osis/${editingId}` : "/api/osis";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success(
        editingId
          ? "Data pengurus berhasil diperbarui"
          : "Pengurus baru berhasil ditambahkan"
      );
      setFormOpen(false);
      fetchOsis();
    } catch {
      toast.error("Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/osis/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Data pengurus berhasil dihapus");
        fetchOsis();
      } else {
        toast.error("Gagal menghapus data");
      }
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      setForm((prev) => ({ ...prev, photo: data.url }));
      toast.success("Foto berhasil diupload");
    } catch {
      toast.error("Gagal upload foto");
    } finally {
      setIsUploading(false);
    }
  };

  // Filter staff by search
  const filteredOsis = osisList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.position || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pengurus OSIS
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola data anggota kepengurusan OSIS sekolah.
          </p>
        </div>
        <Button onClick={openAddForm}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Pengurus
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau jabatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Foto</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredOsis.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  {search
                    ? "Tidak ada hasil pencarian."
                    : "Belum ada data pengurus OSIS."}
                </TableCell>
              </TableRow>
            ) : (
              filteredOsis.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-left hover:underline underline-offset-4 text-green-700 font-medium"
                      onClick={() => openEditForm(member)}
                    >
                      {member.name}
                    </button>
                    {member.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {member.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {member.position || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(member)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(member.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Staff count */}
      <p className="text-sm text-muted-foreground">
        Total: {osisList.length} pengurus OSIS
      </p>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Pengurus OSIS" : "Tambah Pengurus OSIS Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {form.photo ? (
                  <img
                    src={form.photo}
                    alt="Foto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <Label>Foto</Label>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={isUploading}
                    >
                      <span>
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload Foto"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {form.photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, photo: "" }))
                      }
                    >
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="osis-name">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="osis-name"
                placeholder="Nama lengkap siswa"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="osis-position">Jabatan</Label>
              <Input
                id="osis-position"
                placeholder="Contoh: Ketua OSIS, Sekretaris"
                value={form.position || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, position: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="osis-desc">Deskripsi Singkat</Label>
              <Textarea
                id="osis-desc"
                placeholder="Bio singkat atau visi misi pengurus (opsional)"
                rows={3}
                value={form.description || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Pengurus?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara
              permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
