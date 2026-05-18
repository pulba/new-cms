import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Loader2,
  Info,
  History as HistoryIcon,
  Share2,
  MessageSquare,
  Image as ImageIcon,
  Palette,
  Globe,
  Settings2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Mail,
  Phone,
  Layout
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { BrandingStudio } from "./BrandingStudio";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
}

function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-50 group">
          <img src={value} alt="Preview" className="w-full h-40 object-contain p-2" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => { onChange(""); setPickerOpen(true); }}>
              Ganti Gambar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-700/50 hover:bg-blue-50/30 transition-all block group"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
            <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-blue-700" />
          </div>
          <p className="text-sm font-bold text-blue-700">
            Pilih dari Media Library atau Upload Baru
          </p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
            ⚡ Gambar otomatis dikompres sebelum upload
          </p>
        </button>
      )}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onChange}
        title={`Pilih ${label}`}
      />
    </div>
  );
}

// --- Theme Utilities ---
function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const cleanHex = (hex || '#000000').replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return getLuminance(r, g, b) > 0.35 ? '#1a1b21' : '#ffffff';
}

function lighten(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const newR = Math.min(255, r + (255 - r) * (percent / 100));
  const newG = Math.min(255, g + (255 - g) * (percent / 100));
  const newB = Math.min(255, b + (255 - b) * (percent / 100));
  return rgbToHex(newR, newG, newB);
}

function darken(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const newR = Math.max(0, r * (1 - (percent / 100)));
  const newG = Math.max(0, g * (1 - (percent / 100)));
  const newB = Math.max(0, b * (1 - (percent / 100)));
  return rgbToHex(newR, newG, newB);
}

const SimpleColorRow = ({ label, desc, colorKey, value, onChange }: { label: string, desc?: string, colorKey: string, value: string, onChange: (k: string, v: string) => void }) => {
  const val = value || '#000000';
  const presets = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b', '#0f172a', '#ffffff', '#000000'];

  return (
    <div className="py-5 border-b border-slate-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 pr-4">
          <div className="text-sm font-bold text-slate-800">{label}</div>
          {desc && <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{desc}</div>}
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm border border-slate-300 shrink-0">
              <input
                type="color"
                value={val}
                onChange={(e) => onChange(colorKey, e.target.value)}
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
              />
            </div>
            <Input
              value={val}
              onChange={(e) => onChange(colorKey, e.target.value)}
              className="h-10 w-24 font-mono text-xs shadow-none text-center"
              maxLength={7}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 w-[140px]">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => onChange(colorKey, p)}
                className={`w-[22px] h-[22px] rounded-full border border-slate-300 shadow-sm hover:scale-110 transition-transform ${val.toLowerCase() === p ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                style={{ backgroundColor: p }}
                title={p}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PremiumSettingsCenterProps {
  defaultTab?: string;
}

export function PremiumSettingsCenter({ defaultTab = "identity" }: PremiumSettingsCenterProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Tab carousel scroll state ---
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabScroll = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    checkTabScroll();
    el.addEventListener('scroll', checkTabScroll, { passive: true });
    window.addEventListener('resize', checkTabScroll);
    return () => {
      el.removeEventListener('scroll', checkTabScroll);
      window.removeEventListener('resize', checkTabScroll);
    };
  }, [checkTabScroll]);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  const handleTabClick = (e: React.MouseEvent) => {
    const trigger = (e.target as HTMLElement).closest('[role="tab"]');
    if (trigger) {
      setTimeout(() => {
        trigger.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/profile");
        const profileData = await res.json();
        setData(profileData || {});
      } catch {
        toast.error("Gagal memuat data pengaturan");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateField = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success("Semua pengaturan berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-700 animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Memuat Pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span className="text-blue-700">Pengaturan Website</span>
          </nav>
          <h1 className="text-fluid-h1 font-extrabold text-slate-900 tracking-tight">
            Pengaturan Website
          </h1>
          <p className="text-slate-500 mt-2 text-fluid-base">
            Kelola identitas, branding, dan konfigurasi utama platform sekolah.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            className="rounded-xl px-3 sm:px-5 h-9 sm:h-11 font-bold border-slate-300 hover:bg-slate-50 text-xs sm:text-sm"
            onClick={() => window.open('/', '_blank')}
          >
            <Globe className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Lihat Situs
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-700 hover:bg-blue-800 rounded-xl px-4 sm:px-7 h-9 sm:h-11 shadow-lg shadow-blue-700/20 font-bold gap-1.5 sm:gap-2 text-xs sm:text-sm transition-all active:scale-95"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full space-y-8">
        {/* Tab Carousel Navigator */}
        <div className="sticky top-[80px] z-30 bg-slate-50/80 backdrop-blur-md py-2 -mx-4 px-4">
          <div className="relative">
            {/* Left fade + arrow */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 z-10 flex items-center transition-opacity duration-200 lg:hidden",
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent rounded-l-xl pointer-events-none" />
              <button
                onClick={() => scrollTabs('left')}
                className="relative z-10 ml-1 w-8 h-8 rounded-full bg-white/90 border border-slate-300 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-90"
                aria-label="Scroll tabs left"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Right fade + arrow */}
            <div className={cn(
              "absolute right-0 top-0 bottom-0 z-10 flex items-center transition-opacity duration-200 lg:hidden",
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent rounded-r-xl pointer-events-none" />
              <button
                onClick={() => scrollTabs('right')}
                className="relative z-10 mr-1 w-8 h-8 rounded-full bg-white/90 border border-slate-300 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-90"
                aria-label="Scroll tabs right"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Scrollable TabsList */}
            <div
              ref={tabScrollRef}
              className="overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <TabsList
                className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 inline-flex flex-nowrap h-auto min-w-full lg:flex lg:justify-center"
                onClick={handleTabClick}
              >
                <TabsTrigger value="identity" className="rounded-lg px-3 sm:px-5 py-3 sm:py-3.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none font-bold gap-1.5 sm:gap-2 text-slate-500 whitespace-nowrap shrink-0 text-xs sm:text-sm snap-start transition-colors">
                  <Info size={14} className="sm:w-4 sm:h-4" />
                  Identitas
                </TabsTrigger>
                <TabsTrigger value="academic" className="rounded-lg px-3 sm:px-5 py-3 sm:py-3.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none font-bold gap-1.5 sm:gap-2 text-slate-500 whitespace-nowrap shrink-0 text-xs sm:text-sm snap-start transition-colors">
                  <HistoryIcon size={14} className="sm:w-4 sm:h-4" />
                  Akademik
                </TabsTrigger>
                <TabsTrigger value="contact" className="rounded-lg px-3 sm:px-5 py-3 sm:py-3.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none font-bold gap-1.5 sm:gap-2 text-slate-500 whitespace-nowrap shrink-0 text-xs sm:text-sm snap-start transition-colors">
                  <Share2 size={14} className="sm:w-4 sm:h-4" />
                  Kontak & Sosmed
                </TabsTrigger>
                <TabsTrigger value="principal" className="rounded-lg px-3 sm:px-5 py-3 sm:py-3.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none font-bold gap-1.5 sm:gap-2 text-slate-500 whitespace-nowrap shrink-0 text-xs sm:text-sm snap-start transition-colors">
                  <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                  Kepala Sekolah
                </TabsTrigger>
                <TabsTrigger value="appearance" className="rounded-lg px-3 sm:px-5 py-3 sm:py-3.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none font-bold gap-1.5 sm:gap-2 text-slate-500 whitespace-nowrap shrink-0 text-xs sm:text-sm snap-start transition-colors">
                  <Palette size={14} className="sm:w-4 sm:h-4" />
                  Tampilan & Branding
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        {/* --- TAB: IDENTITAS --- */}
        <TabsContent value="identity" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700">
                      <Info size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-fluid-h3 font-bold">Informasi Dasar</CardTitle>
                      <CardDescription className="text-fluid-sm">Nama sekolah, deskripsi, dan identitas legal.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-[var(--admin-p)] space-y-6">
                  <div className="responsive-grid-2">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Nama Sekolah</Label>
                      <Input
                        value={data.schoolName || ""}
                        onChange={(e) => updateField("schoolName", e.target.value)}
                        className="rounded-xl h-12 border-slate-300 focus:border-blue-700 focus:ring-blue-700/10"
                        placeholder="Contoh: SMA Negeri 1 Jakarta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Tahun Berdiri</Label>
                      <Input
                        value={data.foundedYear || ""}
                        onChange={(e) => updateField("foundedYear", e.target.value)}
                        className="rounded-xl h-12 border-slate-300"
                        placeholder="Contoh: 1960"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Deskripsi Singkat (Moto)</Label>
                    <Textarea
                      value={data.shortDescription || ""}
                      onChange={(e) => updateField("shortDescription", e.target.value)}
                      className="rounded-xl border-slate-300 min-h-[100px]"
                      placeholder="Masukkan moto atau deskripsi singkat sekolah..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">NPSN</Label>
                      <Input
                        value={data.npsn || ""}
                        onChange={(e) => updateField("npsn", e.target.value)}
                        className="rounded-xl h-12 border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Akreditasi</Label>
                      <Input
                        value={data.accreditation || ""}
                        onChange={(e) => updateField("accreditation", e.target.value)}
                        className="rounded-xl h-12 border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Kurikulum</Label>
                      <Input
                        value={data.curriculum || ""}
                        onChange={(e) => updateField("curriculum", e.target.value)}
                        className="rounded-xl h-12 border-slate-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-lg font-bold">Logo & Favicon</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <ImageUpload
                    label="Logo Utama"
                    value={data.schoolLogo || ""}
                    onChange={(url) => updateField("schoolLogo", url)}
                  />
                  <Separator />
                  <ImageUpload
                    label="Favicon (Icon Browser)"
                    value={data.schoolFavicon || ""}
                    onChange={(url) => updateField("schoolFavicon", url)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- TAB: AKADEMIK & NARASI --- */}
        <TabsContent value="academic" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
          <div className="space-y-8">
            <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-700">
                    <HistoryIcon size={20} />
                  </div>
                  <CardTitle className="text-xl font-bold">Visi, Misi & Sejarah</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-[var(--admin-p)] space-y-8">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Visi Utama</Label>
                  <Textarea
                    value={data.visionText || ""}
                    onChange={(e) => updateField("visionText", e.target.value)}
                    className="rounded-xl border-slate-300 min-h-[120px] text-fluid-base font-medium"
                    placeholder="Masukkan visi sekolah..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Misi (JSON Format)</Label>
                  <Textarea
                    value={data.missionItems || ""}
                    onChange={(e) => updateField("missionItems", e.target.value)}
                    className="rounded-xl border-slate-300 font-mono text-xs min-h-[150px]"
                    placeholder='["Misi 1", "Misi 2", ...]'
                  />
                  <p className="text-fluid-xs text-slate-400">Masukkan dalam format JSON Array untuk tampilan list di website.</p>
                </div>

                <Separator />

                <div className="responsive-grid-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Narasi Sejarah</Label>
                    <Textarea
                      value={data.historyText || ""}
                      onChange={(e) => updateField("historyText", e.target.value)}
                      className="rounded-xl border-slate-300 min-h-[250px]"
                      placeholder="Tuliskan sejarah perjalanan sekolah..."
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageUpload
                      label="Foto Sejarah Utama"
                      value={data.historyImage || ""}
                      onChange={(url) => updateField("historyImage", url)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
          <div className="space-y-8">
            <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-fluid-h3 font-bold">Kontak & Alamat</CardTitle>
                    <CardDescription className="text-fluid-sm">Informasi kontak resmi dan lokasi sekolah.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-[var(--admin-p)] space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Alamat Lengkap</Label>
                  <Textarea
                    value={data.address || ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="rounded-xl border-slate-300 min-h-[100px]"
                    placeholder="Jl. Contoh No. 123..."
                  />
                </div>
                <div className="responsive-grid-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                      <Phone size={14} /> Telepon
                    </Label>
                    <Input
                      value={data.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="rounded-xl h-12 border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                      <Mail size={14} /> Email Resmi
                    </Label>
                    <Input
                      value={data.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="rounded-xl h-12 border-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Google Maps Embed URL</Label>
                  <Input
                    value={data.googleMapsEmbedUrl || ""}
                    onChange={(e) => updateField("googleMapsEmbedUrl", e.target.value)}
                    className="rounded-xl h-12 border-slate-300 font-mono text-xs"
                    placeholder="https://google.com/maps/embed?..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-100 rounded-xl text-pink-700">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-fluid-h3 font-bold">Sosial Media & Kontak Digital</CardTitle>
                    <CardDescription className="text-fluid-sm">Tautan media sosial dan saluran komunikasi publik sekolah.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-[var(--admin-p)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[
                    { key: 'socialFacebook', label: 'Facebook URL', placeholder: 'https://facebook.com/sekolah', icon: '🌐' },
                    { key: 'socialInstagram', label: 'Instagram URL', placeholder: 'https://instagram.com/sekolah', icon: '📷' },
                    { key: 'socialYoutube', label: 'YouTube URL', placeholder: 'https://youtube.com/@sekolah', icon: '▶️' },
                    { key: 'socialTiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@sekolah', icon: '🎵' },
                    { key: 'socialTwitter', label: 'X / Twitter URL', placeholder: 'https://x.com/sekolah', icon: '💬' },
                    { key: 'socialLinkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/school/...', icon: '💼' },
                    { key: 'socialTelegram', label: 'Telegram', placeholder: 'https://t.me/sekolah', icon: '✈️' },
                    { key: 'socialWhatsapp', label: 'WhatsApp Number', placeholder: '628xxxxxxxxxx', icon: '📱' },
                    { key: 'publicEmail', label: 'Email Kontak Publik', placeholder: 'info@sekolah.sch.id', icon: '✉️' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <span className="text-base leading-none">{field.icon}</span>
                        {field.label}
                      </Label>
                      <Input
                        value={data[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="rounded-xl h-12 border-slate-300"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB: KEPALA SEKOLAH --- */}
        <TabsContent value="principal" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
          <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                  <MessageSquare size={20} />
                </div>
                <CardTitle className="text-xl font-bold">Informasi Kepala Sekolah</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-[var(--admin-p)] space-y-8">
              <div className="responsive-grid-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Nama Lengkap Kepala Sekolah</Label>
                    <Input
                      value={data.principalName || ""}
                      onChange={(e) => updateField("principalName", e.target.value)}
                      className="rounded-xl h-12 border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Label Tanda Tangan (e.g. Kepala Sekolah)</Label>
                    <Input
                      value={data.principalSignature || ""}
                      onChange={(e) => updateField("principalSignature", e.target.value)}
                      className="rounded-xl h-12 border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Kutipan Singkat (Quote)</Label>
                    <Textarea
                      value={data.principalQuote || ""}
                      onChange={(e) => updateField("principalQuote", e.target.value)}
                      className="rounded-xl border-slate-300 min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <ImageUpload
                    label="Foto Kepala Sekolah"
                    value={data.principalImage || ""}
                    onChange={(url) => updateField("principalImage", url)}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Sambutan Lengkap (JSON Format)</Label>
                <Textarea
                  value={data.principalMessage || ""}
                  onChange={(e) => updateField("principalMessage", e.target.value)}
                  className="rounded-xl border-slate-300 font-mono text-xs min-h-[200px]"
                  placeholder='["Paragraf 1", "Paragraf 2", ...]'
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: TAMPILAN & SEO --- */}
        <TabsContent value="appearance" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12 space-y-6">
              <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
                      <Layout size={20} />
                    </div>
                    <CardTitle className="text-xl font-bold">Hero Halaman Profil</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Judul Hero Profil</Label>
                    <Input
                      value={data.profileHeroTitle || ""}
                      onChange={(e) => updateField("profileHeroTitle", e.target.value)}
                      className="rounded-xl h-12 border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Subjudul Hero Profil</Label>
                    <Textarea
                      value={data.profileHeroSubtitle || ""}
                      onChange={(e) => updateField("profileHeroSubtitle", e.target.value)}
                      className="rounded-xl border-slate-300 min-h-[80px]"
                    />
                  </div>
                  <ImageUpload
                    label="Gambar Background Hero"
                    value={data.profileHeroImage || ""}
                    onChange={(url) => updateField("profileHeroImage", url)}
                  />
                </CardContent>
              </Card>

              {/* BRANDING STUDIO V2 */}
              <BrandingStudio data={data} updateField={updateField} />


              {/* SEO Visual Section */}
              <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 rounded-xl text-orange-700">
                      <Settings2 size={20} />
                    </div>
                    <CardTitle className="text-xl font-bold">Konfigurasi Lanjutan</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <Label className="font-bold text-slate-900">Mode Perbaikan (Maintenance)</Label>
                      <p className="text-xs text-slate-500">Nonaktifkan website publik sementara.</p>
                    </div>
                    <Switch
                      checked={data.maintenance_mode === "true"}
                      onCheckedChange={(checked) => updateField("maintenance_mode", checked ? "true" : "false")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Google Analytics ID</Label>
                    <Input
                      value={data.google_analytics_id || ""}
                      onChange={(e) => updateField("google_analytics_id", e.target.value)}
                      className="rounded-xl h-12 border-slate-300"
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-300 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium italic">Sistem siap menerima perubahan.</span>
        </div>
        <div className="flex gap-2 sm:gap-4 ml-auto">
          <Button
            variant="ghost"
            className="rounded-xl px-3 sm:px-6 h-9 sm:h-11 font-bold text-slate-500 hover:text-slate-900 text-xs sm:text-sm"
            onClick={() => window.location.reload()}
          >
            Batalkan
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-950 text-white rounded-xl px-5 sm:px-10 h-9 sm:h-11 font-bold shadow-xl flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-all active:scale-95"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}
