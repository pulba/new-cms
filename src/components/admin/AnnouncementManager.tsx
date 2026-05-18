import React, { useState, useEffect } from "react";
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
import { Plus, Bell, Trash2, Pencil, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

const emptyForm = {
  title: "",
  content: "",
  isActive: true,
  expiresAt: "",
};

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data);
    } catch {
      toast.error("Gagal memuat pengumuman");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (item: Announcement) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      isActive: item.isActive,
      expiresAt: item.expiresAt ? item.expiresAt.substring(0, 10) : "", // Format YYYY-MM-DD for date input
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Judul dan isi pengumuman wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId ? `/api/announcements/${editingId}` : "/api/announcements";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...form,
        // Convert empty string to null for expiresAt, or ensure it's a valid ISO string/date
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success(
        editingId ? "Pengumuman diperbarui" : "Pengumuman ditambahkan"
      );
      setFormOpen(false);
      fetchAnnouncements();
    } catch {
      toast.error("Gagal menyimpan pengumuman");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Pengumuman dihapus");
        fetchAnnouncements();
      } else {
        toast.error("Gagal menghapus");
      }
    } catch {
      toast.error("Gagal menghapus pengumuman");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (res.ok) {
        toast.success(`Pengumuman di${!currentStatus ? "aktif" : "nonaktif"}kan`);
        fetchAnnouncements();
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengumuman</h1>
          <p className="text-muted-foreground text-sm">
            Kelola pengumuman penting yang akan tampil di website (contoh: banner atau popup).
          </p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Pengumuman
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <Bell className="mx-auto h-12 w-12 opacity-20 mb-4" />
          <p className="text-lg font-medium text-foreground">Belum ada pengumuman</p>
          <p className="text-sm">Buat pengumuman baru untuk ditampilkan ke pengunjung.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((item) => {
            const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
            const actuallyActive = item.isActive && !isExpired;

            return (
              <Card key={item.id} className={!actuallyActive ? "opacity-70" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1" title={item.title}>
                      {item.title}
                    </CardTitle>
                    <Badge variant={actuallyActive ? "default" : "secondary"}>
                      {actuallyActive ? "Aktif" : isExpired ? "Expired" : "Nonaktif"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Dibuat: {new Date(item.createdAt).toLocaleDateString("id-ID")}
                    {item.expiresAt && ` • Berakhir: ${new Date(item.expiresAt).toLocaleDateString("id-ID")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center border-t px-6 py-3 bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`status-${item.id}`}
                      checked={item.isActive}
                      onCheckedChange={() => toggleStatus(item.id, item.isActive)}
                    />
                    <Label htmlFor={`status-${item.id}`} className="text-xs cursor-pointer">
                      Tampilkan
                    </Label>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditForm(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Judul <span className="text-destructive">*</span></Label>
              <Input
                id="ann-title"
                placeholder="Contoh: Libur Nasional Semester Ganjil"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ann-content">Isi Pengumuman <span className="text-destructive">*</span></Label>
              <Textarea
                id="ann-content"
                placeholder="Tulis detail pengumuman..."
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ann-expires">Tanggal Berakhir (Opsional)</Label>
              <Input
                id="ann-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Pengumuman akan otomatis disembunyikan setelah tanggal ini.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t">
              <Switch
                id="ann-status"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="ann-status" className="cursor-pointer">
                Langsung aktifkan pengumuman ini
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Simpan" : "Buat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengumuman?</DialogTitle>
            <DialogDescription>
              Pengumuman ini akan dihapus secara permanen dari sistem.
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
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
