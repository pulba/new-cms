import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, ImageIcon, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

interface MediaItem {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
}

export function MediaPickerDialog({ open, onOpenChange, onSelect, title = "Pilih Gambar" }: MediaPickerDialogProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setMediaItems(data);
    } catch {
      toast.error("Gagal memuat media library");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMedia();
      setSelectedUrl(null);
      setCompressionInfo(null);
    }
  }, [open]);

  const handleUploadNew = async (file: File) => {
    setIsUploading(true);
    setCompressionInfo(null);
    try {
      const originalSize = (file.size / 1024).toFixed(0);
      const compressed = await compressImage(file);
      const compressedSize = (compressed.size / 1024).toFixed(0);
      
      if (compressed.size < file.size) {
        setCompressionInfo(`Dikompres: ${originalSize}KB → ${compressedSize}KB`);
      }

      const formData = new FormData();
      formData.append("file", compressed);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();

      toast.success("Gambar berhasil diunggah!");
      onSelect(data.url);
      onOpenChange(false);
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectExisting = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
    }
  };

  const filteredMedia = mediaItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-slate-100 p-1 rounded-xl shrink-0">
            <TabsTrigger value="library" className="rounded-lg px-6 py-2 font-bold gap-2 data-[state=active]:bg-white">
              <ImageIcon size={16} />
              Media Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="rounded-lg px-6 py-2 font-bold gap-2 data-[state=active]:bg-white">
              <Upload size={16} />
              Upload Baru
            </TabsTrigger>
          </TabsList>

          {/* Media Library Tab */}
          <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Cari gambar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl h-11 border-slate-300"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <ImageIcon size={48} className="mb-3 opacity-30" />
                  <p className="font-medium">Belum ada media</p>
                  <p className="text-sm">Upload gambar baru di tab "Upload Baru"</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-4">
                  {filteredMedia.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedUrl(item.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                        selectedUrl === item.url
                          ? "border-blue-700 ring-2 ring-blue-700/20 scale-[0.97]"
                          : "border-transparent hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedUrl === item.url && (
                        <div className="absolute inset-0 bg-blue-700/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                            <Check size={18} className="text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate font-medium">{item.name}</p>
                        <p className="text-white/70 text-[9px]">{formatFileSize(item.size)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 pt-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                Batal
              </Button>
              <Button
                onClick={handleSelectExisting}
                disabled={!selectedUrl}
                className="bg-blue-700 hover:bg-blue-800 rounded-xl px-8 font-bold gap-2"
              >
                <Check size={16} />
                Pilih Gambar
              </Button>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 mt-4">
            <label className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-700/50 hover:bg-blue-50/30 transition-all block group min-h-[300px]">
              {isUploading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-blue-700 mb-4" />
                  <p className="text-lg font-bold text-slate-700">Mengompres & Mengunggah...</p>
                  {compressionInfo && (
                    <p className="text-sm text-emerald-600 font-medium mt-2">✓ {compressionInfo}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-700" />
                  </div>
                  <p className="text-lg font-bold text-slate-700">Klik atau seret gambar ke sini</p>
                  <p className="text-sm text-slate-400 mt-2">Format: JPG, PNG, WebP, SVG (Maks. 10MB)</p>
                  <p className="text-xs text-blue-600 mt-3 font-medium">
                    ⚡ Gambar otomatis dikompres sebelum upload
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadNew(file);
                }}
              />
            </label>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
