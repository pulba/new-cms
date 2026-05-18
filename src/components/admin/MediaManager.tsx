import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, UploadCloud, Trash2, Copy, Search, Image as ImageIcon, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getOptimizedMediaUrl } from "@/lib/cloudinary";

interface MediaItem {
  id: number;
  name: string;
  url: string;
  type: string | null;
  size: number | null;
  uploadedBy: string | null;
  createdAt: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Memoized Grid Item ───────────────────────────────────────────
const MediaGridItem = memo(function MediaGridItem({
  item,
  onCopy,
  onDelete,
  isDeleting,
  deleteId,
}: {
  item: MediaItem;
  onCopy: (url: string) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  deleteId: number | null;
}) {
  return (
    <div className="group relative rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {item.type?.startsWith("image") ? (
          <img
            src={getOptimizedMediaUrl(item.url, 400)}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
        )}
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => onCopy(item.url)} title="Copy URL">
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => onDelete(item.id)} title="Hapus File" disabled={isDeleting}>
          {isDeleting && deleteId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
      <div className="p-2 text-xs truncate">
        <p className="font-medium truncate" title={item.name}>{item.name}</p>
        <p className="text-muted-foreground mt-0.5">{formatBytes(item.size)}</p>
      </div>
    </div>
  );
});

function formatBytes(bytes: number | null) {
  if (!bytes) return "Unknown";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ─── Main Component ───────────────────────────────────────────────
export function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dependencyConflict, setDependencyConflict] = useState<{module: string, title: string}[] | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMedia = useCallback(async (page = 1, searchTerm = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "30");
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/media?${params}`);
      const data = await res.json();
      setMedia(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error("Gagal memuat media");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and when search/page changes
  useEffect(() => {
    fetchMedia(1, debouncedSearch);
  }, [debouncedSearch, fetchMedia]);

  const goToPage = useCallback((page: number) => {
    fetchMedia(page, debouncedSearch);
  }, [fetchMedia, debouncedSearch]);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      toast.success("File berhasil diupload");
      fetchMedia(1, debouncedSearch); // Refresh to page 1
    } catch {
      toast.error("Gagal upload file");
    } finally {
      setIsUploading(false);
    }
  }, [fetchMedia, debouncedSearch]);

  const handleDelete = useCallback(async () => {
    if (!deleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/media/${deleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setDependencyConflict(data.dependencies || []);
        setDeleteId(null);
        return;
      }

      if (res.ok) {
        if (data.isOrphanRecovered) {
          toast.success("Orphan Cleanup: File dibersihkan dari database.");
        } else {
          toast.success("File berhasil dihapus dari cloud & database.");
        }
        fetchMedia(pagination.page, debouncedSearch);
        setDeleteId(null);
      } else {
        toast.error(data.error || "Gagal menghapus file");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteId, isDeleting, fetchMedia, pagination.page, debouncedSearch]);

  const handleCopy = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL berhasil disalin");
  }, []);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteId(id);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Upload */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground text-sm">
            Kelola semua aset gambar dan file yang diupload.{" "}
            <span className="text-xs text-slate-400">({pagination.total} file)</span>
          </p>
        </div>
        <div>
          <label className="cursor-pointer">
            <Button asChild disabled={isUploading}>
              <span>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Upload File
              </span>
            </Button>
            <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari nama file..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <ImageIcon className="mx-auto h-12 w-12 opacity-20 mb-4" />
          <p className="text-lg font-medium text-foreground">Media Kosong</p>
          <p className="text-sm">{search ? "Tidak ada file yang cocok." : "Belum ada file yang diupload."}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {media.map((item) => (
              <MediaGridItem
                key={item.id}
                item={item}
                onCopy={handleCopy}
                onDelete={handleDeleteClick}
                isDeleting={isDeleting}
                deleteId={deleteId}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} file)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => { if (!isDeleting) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus File?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus file dari database dan Cloudinary secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dependency Conflict Dialog */}
      <Dialog open={dependencyConflict !== null} onOpenChange={() => setDependencyConflict(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Penghapusan Ditolak
            </DialogTitle>
            <DialogDescription>
              File media ini masih digunakan secara aktif oleh sistem. Anda harus mengganti atau menghapus referensinya terlebih dahulu.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Daftar Penggunaan:</h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-md bg-muted/30">
              {dependencyConflict?.map((dep, idx) => (
                <li key={idx} className="text-sm flex flex-col bg-card border p-2 rounded shadow-sm">
                  <span className="font-semibold text-primary">{dep.module}</span>
                  <span className="text-muted-foreground">{dep.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setDependencyConflict(null)}>Mengerti</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

