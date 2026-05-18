import React, { useState, useEffect, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  UserPlus,
  ImageIcon,
  Search,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Filter,
  SortAsc,
} from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: number;
  name: string;
  title: string;
  subject: string | null;
  imageUrl: string | null;
  bio: string | null;
  category: string | null;
  sortOrder: number | null;
  // Preservation of NIP if API expects it
  nip?: string | null;
}

const emptyForm: Omit<StaffMember, "id"> = {
  name: "",
  title: "",
  subject: "",
  imageUrl: "",
  bio: "",
  category: "Guru",
  sortOrder: 0,
  nip: "",
};

export function StaffManager() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      // Normalized mapping for API compatibility
      const normalizedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        title: item.title || item.position || "",
        subject: item.subject || "",
        imageUrl: item.imageUrl || item.photo || "",
        bio: item.bio || item.description || "",
        category: item.category || "Guru",
        sortOrder: item.sortOrder || 0,
        nip: item.nip || "",
      }));
      setStaffList(normalizedData);
    } catch {
      toast.error("Gagal memuat data guru & staff");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (member: StaffMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      title: member.title,
      subject: member.subject || "",
      imageUrl: member.imageUrl || "",
      bio: member.bio || "",
      category: member.category || "Guru",
      sortOrder: member.sortOrder || 0,
      nip: member.nip || "",
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
      const url = editingId ? `/api/staff/${editingId}` : "/api/staff";
      const method = editingId ? "PUT" : "POST";

      // Map back to API expected keys while preserving schema
      const payload = {
        name: form.name,
        title: form.title,
        position: form.title, // Backward compatibility
        subject: form.subject,
        imageUrl: form.imageUrl,
        photo: form.imageUrl, // Backward compatibility
        bio: form.bio,
        description: form.bio, // Backward compatibility
        category: form.category,
        sortOrder: form.sortOrder,
        nip: form.nip,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success(
        editingId
          ? "Data guru berhasil diperbarui"
          : "Guru baru berhasil ditambahkan"
      );
      setFormOpen(false);
      fetchStaff();
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
      const res = await fetch(`/api/staff/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Data guru berhasil dihapus");
        fetchStaff();
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
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success("Foto berhasil diupload");
    } catch {
      toast.error("Gagal upload foto");
    } finally {
      setIsUploading(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalGuru = staffList.filter(s => s.category === "Guru").length;
    const totalStaff = staffList.filter(s => s.category !== "Guru").length;
    const mapelCount = new Set(staffList.map(s => s.subject).filter(Boolean)).size;
    return { totalGuru, totalStaff, mapelCount };
  }, [staffList]);

  // Filter staff by search and category
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.nip || "").includes(search);
    
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Guru & Staff</h2>
          <p className="text-slate-500 font-medium">Kelola data seluruh pengajar dan staf operasional sekolah Anda.</p>
        </div>
        <Button onClick={openAddForm} className="bg-blue-700 hover:bg-blue-800 shadow-md transition-all h-11 px-6 rounded-xl gap-2 font-semibold">
          <Plus className="h-5 w-5" />
          Tambah Guru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-blue-50 text-blue-700 flex items-center justify-center rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Guru</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalGuru}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-green-50 text-green-600 flex items-center justify-center rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hadir Hari Ini</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalGuru + stats.totalStaff}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 flex items-center justify-center rounded-xl">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</p>
            <p className="text-2xl font-black text-slate-900">{stats.mapelCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 flex items-center justify-center rounded-xl">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalStaff}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari guru atau staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-300 rounded-xl text-sm focus:ring-blue-500"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 font-semibold">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setCategoryFilter("all")}>Semua Kategori</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("Guru")}>Guru</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter("Staff")}>Staff</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            Menampilkan <span className="text-blue-700">{filteredStaff.length}</span> dari {staffList.length} Guru & Staff
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="px-8 py-4 font-bold text-xs uppercase tracking-widest text-slate-500">Foto & Nama</TableHead>
                <TableHead className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-500">Identitas / NIP</TableHead>
                <TableHead className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-500">Jabatan</TableHead>
                <TableHead className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-500">Mata Pelajaran</TableHead>
                <TableHead className="px-8 py-4 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-700" />
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium">
                    {search ? "Data tidak ditemukan." : "Belum ada data."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id} className="hover:bg-blue-50/30 transition-colors group">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-slate-100">
                          {member.imageUrl ? (
                            <img
                              src={member.imageUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-lg">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{member.name}</p>
                          <p className="text-xs text-slate-400 font-medium">Pengajar Terverifikasi</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-600">{member.nip || "—"}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID Pegawai</p>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        member.category === "Guru" 
                        ? "bg-blue-50 text-blue-700" 
                        : "bg-orange-50 text-orange-700"
                      }`}>
                        {member.title || "Guru"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      {member.subject ? (
                        <div className="flex gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-black uppercase tracking-tight">
                            {member.subject}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Bukan Tenaga Pengajar</span>
                      )}
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                          onClick={() => openEditForm(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          onClick={() => setDeleteId(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingId ? "Edit Profil" : "Tambah Guru/Staff Baru"}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Isi informasi lengkap guru atau staff untuk ditampilkan di website sekolah.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Photo Section */}
            <div className="col-span-2 flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div className="space-y-3 flex-1">
                <Label className="text-sm font-bold text-slate-700">Foto Profil</Label>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={isUploading}
                      className="rounded-xl border-slate-300 font-bold"
                    >
                      <span>
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Pilih Foto"}
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
                  {form.imageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-red-600 font-bold"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, imageUrl: "" }))
                      }
                    >
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="staff-name" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap *</Label>
              <Input
                id="staff-name"
                placeholder="Dian Sastro, M.Pd"
                value={form.name}
                className="rounded-xl h-11"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="staff-nip" className="text-xs font-bold text-slate-500 uppercase tracking-widest">NIP / Identitas</Label>
              <Input
                id="staff-nip"
                placeholder="19850312..."
                value={form.nip || ""}
                className="rounded-xl h-11"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nip: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="staff-title" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jabatan</Label>
              <Input
                id="staff-title"
                placeholder="Guru Tetap / Kepala Lab"
                value={form.title}
                className="rounded-xl h-11"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kategori</Label>
              <Select 
                value={form.category || "Guru"} 
                onValueChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guru">Guru</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="staff-subject" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mata Pelajaran</Label>
              <Input
                id="staff-subject"
                placeholder="Matematika / Bahasa Inggris"
                value={form.subject || ""}
                className="rounded-xl h-11"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="staff-sort" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Urutan (Sort Order)</Label>
              <Input
                id="staff-sort"
                type="number"
                value={form.sortOrder || 0}
                className="rounded-xl h-11"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) }))
                }
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="staff-desc" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Biografi / Deskripsi</Label>
              <Textarea
                id="staff-desc"
                placeholder="Ceritakan singkat tentang pengalaman mengajar..."
                rows={3}
                value={form.bio || ""}
                className="rounded-xl resize-none"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setFormOpen(false)} className="rounded-xl font-bold text-slate-500">
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-700 hover:bg-blue-800 rounded-xl font-bold px-8">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Simpan Perubahan" : "Terbitkan Profil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-[2rem] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Hapus Profil?</DialogTitle>
            <DialogDescription className="font-medium">
              Data guru ini akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="rounded-xl font-bold">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl font-bold px-8 bg-red-600 hover:bg-red-700"
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
