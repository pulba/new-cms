import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ImageIcon, GripVertical, Plus, Trash2, Pencil, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { cn } from "@/lib/utils";
import { getOptimizedMediaUrl } from "@/lib/cloudinary";

// --- Types ---
interface Banner {
  id: number; title: string; subtitle: string; description: string; imageUrl: string;
  primaryCtaText: string | null; primaryCtaHref: string | null;
  secondaryCtaText: string | null; secondaryCtaHref: string | null;
  isActive: boolean; sortOrder: number;
}
interface GalleryItem {
  id: number; imageUrl: string; altText: string; category: string;
  span: string; sortOrder: number; isFeatured: boolean;
}

const emptyBannerForm = { title: "", subtitle: "", description: "", imageUrl: "", primaryCtaText: "", primaryCtaHref: "", secondaryCtaText: "", secondaryCtaHref: "", isActive: true, sortOrder: 0 };
const emptyGalleryForm = { imageUrl: "", altText: "", category: "Umum", span: "small", isFeatured: false, sortOrder: 0 };

// --- Sortable Banner Card ---
function SortableBannerCard({ banner, onEdit, onDelete, onToggle }: { banner: Banner; onEdit: (b: Banner) => void; onDelete: (id: number) => void; onToggle: (id: number, s: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="admin-card !p-0 flex flex-col sm:flex-row group hover:shadow-md transition-all overflow-hidden relative w-full max-w-full min-w-0">
      {/* Drag Handle */}
      <div 
        {...attributes} {...listeners} 
        className="absolute top-2 left-2 sm:static sm:flex items-center px-2 py-4 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 bg-white/80 sm:bg-transparent rounded-lg sm:rounded-none z-10 shrink-0"
      >
        <GripVertical size={20} />
      </div>

      {/* Thumbnail */}
      <div className="w-full sm:w-48 md:w-56 lg:w-64 h-48 sm:h-auto aspect-video sm:aspect-auto overflow-hidden bg-slate-100 border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0">
        <img src={getOptimizedMediaUrl(banner.imageUrl, 400)} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>

      {/* Content Area */}
      <div className="flex-1 p-[var(--admin-p-inner)] flex flex-col md:flex-row gap-4 md:items-center min-w-0 max-w-full">
        <div className="flex-1 min-w-0 max-w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0", 
              banner.isActive ? "text-green-700 bg-green-100" : "text-slate-700 bg-slate-100"
            )}>
              {banner.isActive ? "Aktif" : "Nonaktif"}
            </span>
            {banner.subtitle && <span className="text-[10px] text-slate-400 font-medium truncate max-w-full">{banner.subtitle}</span>}
          </div>
          <h3 className="text-fluid-h3 font-bold text-slate-900 leading-[1.3] mb-2 break-words max-w-full overflow-hidden">
            {banner.title}
          </h3>
          <div className="flex items-center gap-2 text-fluid-xs text-slate-500 min-w-0">
            <ImageIcon size={14} className="shrink-0" />
            <span className="truncate min-w-0">URL: {banner.primaryCtaHref || "/"}</span>
          </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-wrap items-center justify-start sm:justify-between md:flex-col md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 min-w-0 w-full md:w-auto">
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => onEdit(banner)} 
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors border border-slate-100 sm:border-none"
              title="Edit Banner"
            >
              <Pencil size={18} />
            </button>
            <button 
              onClick={() => onDelete(banner.id)} 
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors border border-slate-100 sm:border-none"
              title="Hapus Banner"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
             <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:block md:hidden">Status</span>
             <Switch 
               checked={banner.isActive} 
               onCheckedChange={() => onToggle(banner.id, banner.isActive)}
               className="scale-90"
             />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sortable Gallery Card ---
function SortableGalleryCard({ item, onDelete, onToggleFeatured }: { item: GalleryItem; onDelete: (id: number) => void; onToggleFeatured: (id: number, f: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative admin-card !p-0 overflow-hidden border-slate-300 group aspect-square bg-slate-100 shadow-sm hover:shadow-md transition-all w-full min-w-0">
      <img src={getOptimizedMediaUrl(item.imageUrl, 400)} alt={item.altText} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-4 gap-2 px-2">
        <div className="flex gap-2 min-w-0 max-w-full flex-wrap justify-center">
          <button 
            {...attributes} {...listeners} 
            className="h-9 w-9 bg-white/90 rounded-xl flex items-center justify-center text-slate-700 cursor-grab active:cursor-grabbing shadow-sm shrink-0"
          >
            <GripVertical size={16} />
          </button>
          <button 
            onClick={() => onToggleFeatured(item.id, item.isFeatured)} 
            className="h-9 w-9 bg-white/90 rounded-xl flex items-center justify-center text-slate-700 shadow-sm shrink-0"
          >
            {item.isFeatured ? <Star size={16} className="text-yellow-500 fill-yellow-500" /> : <StarOff size={16} className="text-slate-400" />}
          </button>
          <button 
            onClick={() => onDelete(item.id)} 
            className="h-9 w-9 bg-white/90 rounded-xl flex items-center justify-center text-red-500 shadow-sm shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <span className="text-white text-[10px] font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 truncate max-w-full">
          {item.category}
        </span>
      </div>

      {/* Featured Badge */}
      {item.isFeatured && (
        <div className="absolute top-2 right-2 bg-yellow-400 p-1 rounded-lg shadow-lg z-10">
          <Star size={12} className="text-white fill-white" />
        </div>
      )}

      {/* Mobile Indicator */}
      <div className="absolute bottom-2 left-2 sm:hidden max-w-[calc(100%-1rem)]">
        <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm truncate block">
          {item.category}
        </span>
      </div>
    </div>
  );
}

// --- Main Component ---
export function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // Banner form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyBannerForm);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Gallery form
  const [galleryFormOpen, setGalleryFormOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [galleryDeleteId, setGalleryDeleteId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const fetchBanners = async () => { setIsLoading(true); try { const res = await fetch("/api/banners"); setBanners(await res.json()); } catch { toast.error("Gagal memuat banner"); } finally { setIsLoading(false); } };
  const fetchGallery = async () => { setGalleryLoading(true); try { const res = await fetch("/api/galleries"); setGallery(await res.json()); } catch { toast.error("Gagal memuat galeri"); } finally { setGalleryLoading(false); } };

  useEffect(() => { fetchBanners(); fetchGallery(); }, []);

  // --- Banner handlers ---
  const openAddBanner = () => { setEditingId(null); setForm({ ...emptyBannerForm, sortOrder: banners.length }); setFormOpen(true); };
  const openEditBanner = (item: Banner) => { setEditingId(item.id); setForm({ title: item.title, subtitle: item.subtitle || "", description: item.description || "", imageUrl: item.imageUrl, primaryCtaText: item.primaryCtaText || "", primaryCtaHref: item.primaryCtaHref || "", secondaryCtaText: item.secondaryCtaText || "", secondaryCtaHref: item.secondaryCtaHref || "", isActive: item.isActive, sortOrder: item.sortOrder }); setFormOpen(true); };

  const saveBanner = async () => {
    if (!form.title.trim() || !form.imageUrl.trim()) { toast.error("Judul dan gambar wajib diisi"); return; }
    setIsSaving(true);
    try {
      const url = editingId ? `/api/banners/${editingId}` : "/api/banners";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Banner diperbarui" : "Banner ditambahkan"); setFormOpen(false); fetchBanners();
    } catch { toast.error("Gagal menyimpan banner"); } finally { setIsSaving(false); }
  };

  const deleteBanner = async () => {
    if (!deleteId) return; setIsDeleting(true);
    try { await fetch(`/api/banners/${deleteId}`, { method: "DELETE" }); toast.success("Banner dihapus"); fetchBanners(); } catch { toast.error("Gagal menghapus"); } finally { setIsDeleting(false); setDeleteId(null); }
  };

  const toggleBanner = async (id: number, cur: boolean) => { try { await fetch(`/api/banners/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !cur }) }); fetchBanners(); } catch { toast.error("Gagal mengubah status"); } };

  const handleBannerDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = banners.findIndex(b => b.id === active.id);
    const newIdx = banners.findIndex(b => b.id === over.id);
    const reordered = arrayMove(banners, oldIdx, newIdx);
    setBanners(reordered);
    const items = reordered.map((b, i) => ({ id: b.id, sortOrder: i }));
    try { await fetch("/api/banners/reorder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }); toast.success("Urutan banner diperbarui"); } catch { toast.error("Gagal menyimpan urutan"); }
  };

  // --- Gallery handlers ---
  const openAddGallery = () => { setGalleryForm({ ...emptyGalleryForm, sortOrder: gallery.length }); setGalleryFormOpen(true); };

  const saveGallery = async () => {
    if (!galleryForm.imageUrl.trim()) { toast.error("Gambar wajib diisi"); return; }
    setGallerySaving(true);
    try {
      const res = await fetch("/api/galleries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(galleryForm) });
      if (!res.ok) throw new Error();
      toast.success("Foto galeri ditambahkan"); setGalleryFormOpen(false); fetchGallery();
    } catch { toast.error("Gagal menyimpan"); } finally { setGallerySaving(false); }
  };

  const deleteGallery = async () => {
    if (!galleryDeleteId) return;
    try { await fetch(`/api/galleries/${galleryDeleteId}`, { method: "DELETE" }); toast.success("Foto dihapus"); fetchGallery(); } catch { toast.error("Gagal menghapus"); } finally { setGalleryDeleteId(null); }
  };

  const toggleFeatured = async (id: number, cur: boolean) => { try { await fetch(`/api/galleries/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFeatured: !cur }) }); fetchGallery(); } catch { toast.error("Gagal mengubah status"); } };

  const handleGalleryDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = gallery.findIndex(g => g.id === active.id);
    const newIdx = gallery.findIndex(g => g.id === over.id);
    const reordered = arrayMove(gallery, oldIdx, newIdx);
    setGallery(reordered);
    const items = reordered.map((g, i) => ({ id: g.id, sortOrder: i }));
    try { await fetch("/api/galleries/reorder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }); } catch { toast.error("Gagal menyimpan urutan"); }
  };

  return (
    <div className="space-y-[var(--admin-gap)] w-full max-w-full min-w-0 overflow-hidden">
      <Tabs defaultValue="banners" className="w-full max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6 overflow-hidden w-full max-w-full">
          <div className="flex-1 min-w-0 max-w-full">
            <h1 className="text-fluid-h1 font-extrabold text-slate-900 tracking-tight mb-2 truncate max-w-full">
              Banner & Galeri
            </h1>
            <p className="text-fluid-base text-slate-500 max-w-full break-words">
              Kelola slider homepage dan galeri foto sekolah dengan sistem urutan cerdas.
            </p>
          </div>
          <div className="flex items-center overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 shrink-0 max-w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-auto shrink-0 flex-nowrap max-w-full">
              <TabsTrigger value="banners" className="rounded-lg px-4 sm:px-8 py-3 font-bold data-[state=active]:bg-white whitespace-nowrap">🖼️ Banner Slider</TabsTrigger>
              <TabsTrigger value="gallery" className="rounded-lg px-4 sm:px-8 py-3 font-bold data-[state=active]:bg-white whitespace-nowrap">📸 Galeri Foto</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* === BANNER TAB === */}
        <TabsContent value="banners" className="outline-none space-y-4 w-full max-w-full min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full max-w-full min-w-0">
            <p className="text-fluid-xs text-slate-400 flex items-center gap-2 max-w-full">
              <GripVertical size={14} className="shrink-0" /> 
              <span className="truncate">Seret kartu untuk mengatur ulang urutan banner.</span>
            </p>
            <Button 
              onClick={openAddBanner} 
              className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 rounded-xl px-6 h-12 font-bold gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95 shrink-0"
            >
              <Plus size={18} /> Tambah Banner
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-blue-900" /></div>
          ) : banners.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center text-slate-400"><ImageIcon className="mx-auto h-8 w-8 opacity-20 mb-4" /><p className="font-medium text-slate-900">Belum ada banner</p></div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBannerDragEnd}>
              <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">{banners.map(b => <SortableBannerCard key={b.id} banner={b} onEdit={openEditBanner} onDelete={id => setDeleteId(id)} onToggle={toggleBanner} />)}</div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* === GALLERY TAB === */}
        <TabsContent value="gallery" className="outline-none space-y-4 w-full max-w-full min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full max-w-full min-w-0">
            <p className="text-fluid-xs text-slate-400 truncate">{gallery.length} foto dalam galeri sekolah</p>
            <Button 
              onClick={openAddGallery} 
              className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 rounded-xl px-6 h-12 font-bold gap-2 shadow-lg shadow-blue-900/10 transition-all active:scale-95 shrink-0"
            >
              <Plus size={18} /> Tambah Foto Galeri
            </Button>
          </div>
          {galleryLoading ? (
            <div className="flex justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-blue-900" /></div>
          ) : gallery.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center text-slate-400"><ImageIcon className="mx-auto h-12 w-12 opacity-20 mb-4" /><p className="font-medium text-slate-900">Belum ada foto</p><p className="text-sm">Tambahkan foto aktivitas sekolah untuk ditampilkan di halaman Galeri.</p></div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGalleryDragEnd}>
              <SortableContext items={gallery.map(g => g.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{gallery.map(g => <SortableGalleryCard key={g.id} item={g} onDelete={id => setGalleryDeleteId(id)} onToggleFeatured={toggleFeatured} />)}</div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>
      </Tabs>

      {/* Banner Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Banner" : "Tambah Banner Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Gambar Banner <span className="text-destructive">*</span></Label>
              {form.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border group"><img src={getOptimizedMediaUrl(form.imageUrl, 400)} alt="Preview" className="w-full h-44 object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button variant="secondary" size="sm" onClick={() => { setForm({ ...form, imageUrl: "" }); setMediaPickerOpen(true); }}>Ganti Gambar</Button></div></div>
              ) : (
                <button type="button" onClick={() => setMediaPickerOpen(true)} className="w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center hover:border-blue-500/50 hover:bg-blue-50/30 transition-all bg-slate-50"><ImageIcon className="h-8 w-8 text-slate-300 mb-2" /><span className="text-sm font-bold text-blue-700">Pilih dari Media Library</span></button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label>Judul Utama *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Penerimaan Peserta Didik Baru" /></div>
              <div className="space-y-2"><Label>Subjudul</Label><Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Deskripsi</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tombol Utama (Teks)</Label><Input value={form.primaryCtaText || ""} onChange={e => setForm({ ...form, primaryCtaText: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tombol Utama (Link)</Label><Input value={form.primaryCtaHref || ""} onChange={e => setForm({ ...form, primaryCtaHref: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tombol Kedua (Teks)</Label><Input value={form.secondaryCtaText || ""} onChange={e => setForm({ ...form, secondaryCtaText: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tombol Kedua (Link)</Label><Input value={form.secondaryCtaHref || ""} onChange={e => setForm({ ...form, secondaryCtaHref: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t"><Switch id="bs" checked={form.isActive} onCheckedChange={c => setForm({ ...form, isActive: c })} /><Label htmlFor="bs">Tampilkan di homepage</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button><Button onClick={saveBanner} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Simpan" : "Tambah"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <MediaPickerDialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen} onSelect={url => setForm(p => ({ ...p, imageUrl: url }))} title="Pilih Gambar Banner" />

      {/* Gallery Add Dialog */}
      <Dialog open={galleryFormOpen} onOpenChange={setGalleryFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Foto Galeri</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Gambar *</Label>
              {galleryForm.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border group"><img src={getOptimizedMediaUrl(galleryForm.imageUrl, 400)} alt="Preview" className="w-full h-44 object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button variant="secondary" size="sm" onClick={() => { setGalleryForm({ ...galleryForm, imageUrl: "" }); setGalleryPickerOpen(true); }}>Ganti</Button></div></div>
              ) : (
                <button type="button" onClick={() => setGalleryPickerOpen(true)} className="w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center hover:border-blue-500/50 hover:bg-blue-50/30 transition-all bg-slate-50"><ImageIcon className="h-8 w-8 text-slate-300 mb-2" /><span className="text-sm font-bold text-blue-700">Pilih Gambar</span></button>
              )}
            </div>
            <div className="space-y-2"><Label>Deskripsi / Alt Text</Label><Input value={galleryForm.altText} onChange={e => setGalleryForm({ ...galleryForm, altText: e.target.value })} placeholder="Deskripsi foto..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={galleryForm.category} onValueChange={v => setGalleryForm({ ...galleryForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Umum">Umum</SelectItem><SelectItem value="Akademik">Akademik</SelectItem><SelectItem value="Ekstrakurikuler">Ekstrakurikuler</SelectItem><SelectItem value="Fasilitas">Fasilitas</SelectItem><SelectItem value="Kegiatan">Kegiatan</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ukuran</Label>
                <Select value={galleryForm.span} onValueChange={v => setGalleryForm({ ...galleryForm, span: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="small">Normal</SelectItem><SelectItem value="large">Besar (2x)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2"><Switch checked={galleryForm.isFeatured} onCheckedChange={c => setGalleryForm({ ...galleryForm, isFeatured: c })} /><Label>Tampilkan di homepage (Featured)</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setGalleryFormOpen(false)}>Batal</Button><Button onClick={saveGallery} disabled={gallerySaving}>{gallerySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <MediaPickerDialog open={galleryPickerOpen} onOpenChange={setGalleryPickerOpen} onSelect={url => setGalleryForm(p => ({ ...p, imageUrl: url }))} title="Pilih Foto Galeri" />

      {/* Delete Dialogs */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Hapus Banner?</DialogTitle><DialogDescription>Banner akan dihapus permanen.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button><Button variant="destructive" onClick={deleteBanner} disabled={isDeleting}>{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hapus</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={galleryDeleteId !== null} onOpenChange={() => setGalleryDeleteId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Hapus Foto?</DialogTitle><DialogDescription>Foto akan dihapus dari galeri.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setGalleryDeleteId(null)}>Batal</Button><Button variant="destructive" onClick={deleteGallery}>Hapus</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
