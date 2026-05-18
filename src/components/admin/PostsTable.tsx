import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Import new sub-components
import { NewsToolbar } from "./NewsToolbar";
import { NewsListRow } from "./NewsListRow";
import { NewsPagination } from "./NewsPagination";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  featuredImage: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string | null;
  authorName: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PostsTableProps {
  initialData?: {
    data: Post[];
    pagination: PaginationInfo;
  };
}

export function PostsTable({ initialData }: PostsTableProps) {
  const [posts, setPosts] = useState<Post[]>(initialData?.data || []);
  const [pagination, setPagination] = useState<PaginationInfo>(
    initialData?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    }
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(!initialData);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track whether we've done the initial mount (to avoid refetching SSR data)
  const [hasInitialData] = useState(!!initialData);

  const fetchPosts = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10"); // Match reference feel
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Gagal memuat data berita");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip the initial mount fetch if SSR data was provided
    // Only fetch when search/filter actually changes
    if (hasInitialData && search === "" && statusFilter === "all") return;

    const timer = setTimeout(() => {
      fetchPosts(1);
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Berita berhasil dihapus");
        fetchPosts(pagination.page);
      } else {
        toast.error("Gagal menghapus berita");
      }
    } catch {
      toast.error("Gagal menghapus berita");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (id: number) => {
    window.location.href = `/admin/posts/${id}`;
  };

  const handlePreview = (id: number) => {
    const post = posts.find(p => p.id === id);
    if (post) {
      window.open(`/posts/${post.slug}`, '_blank');
    }
  };

  return (
    <div className="space-y-[var(--admin-gap)] w-full max-w-full min-w-0">
      <NewsToolbar 
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onAddClick={() => window.location.href = '/admin/posts/new'}
      />

      <div className="admin-card !p-0 overflow-hidden w-full max-w-full min-w-0">
        <div className="overflow-x-auto no-scrollbar w-full">
          <table className="w-full text-left border-collapse table-to-card min-w-0">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider w-28">Thumbnail</th>
                <th className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Judul Berita</th>
                <th className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider w-40">Penulis</th>
                <th className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider w-32">Status</th>
                <th className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider w-28">Tanggal</th>
                <th className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-900 opacity-20" />
                    <p className="mt-4 text-slate-400 font-medium">Memuat data berita...</p>
                  </td>
                </tr>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <NewsListRow 
                    key={post.id}
                    item={post}
                    onEdit={handleEdit}
                    onDelete={setDeleteId}
                    onPreview={handlePreview}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                    <span className="material-symbols-outlined text-6xl opacity-10 mb-4">newspaper</span>
                    <p className="font-medium">Belum ada berita ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <NewsPagination 
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsShown={posts.length}
          onPageChange={fetchPosts}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Berita?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Berita akan dihapus secara permanen.
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
