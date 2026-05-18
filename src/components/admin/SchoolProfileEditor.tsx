import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Loader2,
  ChevronRight,
  Globe,
  Settings2,
  Image as ImageIcon,
  Share2,
  Info,
  History as HistoryIcon,
  MessageSquare,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { 
  PrincipalSummaryCard, 
  VisionMissionCard, 
  HistorySummaryCard, 
  FacilitiesSummaryCard 
} from "@/components/admin/ProfileSummaryCards";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

// Comprehensive editable groups preserving ALL original fields
const EDIT_SECTIONS = {
  BASIC_INFO: {
    title: "Informasi Dasar",
    icon: Info,
    description: "Kelola identitas utama sekolah, logo, dan akreditasi.",
    fields: [
      { key: "schoolName", title: "Nama Sekolah", type: "text" },
      { key: "schoolLogo", title: "Logo Sekolah", type: "image" },
      { key: "schoolFavicon", title: "Favicon Sekolah", type: "image" },
      { key: "shortDescription", title: "Deskripsi Singkat (Footer)", type: "textarea" },
      { key: "foundedYear", title: "Tahun Berdiri", type: "text" },
      { key: "npsn", title: "NPSN", type: "text" },
      { key: "accreditation", title: "Akreditasi", type: "text" },
      { key: "curriculum", title: "Kurikulum", type: "text" },
    ]
  },
  CONTACT_SOCIAL: {
    title: "Kontak & Sosial Media",
    icon: Share2,
    description: "Perbarui alamat, telepon, email, dan tautan sosial media.",
    fields: [
      { key: "address", title: "Alamat Lengkap", type: "textarea" },
      { key: "phone", title: "Telepon", type: "text" },
      { key: "email", title: "Email", type: "text" },
      { key: "googleMapsEmbedUrl", title: "Google Maps Embed URL", type: "textarea" },
      { key: "socialFacebook", title: "Facebook URL", type: "text" },
      { key: "socialInstagram", title: "Instagram URL", type: "text" },
      { key: "socialYoutube", title: "YouTube Channel URL", type: "text" },
    ]
  },
  EDITORIAL: {
    title: "Visi, Misi & Sejarah",
    icon: HistoryIcon,
    description: "Kelola narasi visi, misi, dan perjalanan sejarah sekolah.",
    fields: [
      { key: "visionText", title: "Visi Utama", type: "textarea", rows: 4 },
      { key: "missionItems", title: "Misi (JSON Array Format)", type: "textarea", rows: 6 },
      { key: "historyText", title: "Narasi Sejarah", type: "textarea", rows: 8 },
      { key: "historyImage", title: "Foto Sejarah Utama", type: "image" },
    ]
  },
  PRINCIPAL: {
    title: "Kepala Sekolah",
    icon: MessageSquare,
    description: "Informasi, foto, dan pesan resmi dari kepala sekolah.",
    fields: [
      { key: "principalName", title: "Nama Kepala Sekolah", type: "text" },
      { key: "principalSignature", title: "Label Tanda Tangan", type: "text" },
      { key: "principalQuote", title: "Kutipan Kepala Sekolah", type: "textarea" },
      { key: "principalMessage", title: "Sambutan (JSON Array)", type: "textarea", rows: 8 },
      { key: "principalImage", title: "Foto Kepala Sekolah", type: "image" },
    ]
  },
  HERO_PROFILE: {
    title: "Hero Halaman Profil",
    icon: ImageIcon,
    description: "Konfigurasi tampilan utama (banner) pada halaman profil website.",
    fields: [
      { key: "profileHeroTitle", title: "Judul Hero Profil", type: "text" },
      { key: "profileHeroSubtitle", title: "Subjudul Hero Profil", type: "textarea" },
      { key: "profileHeroImage", title: "Gambar Hero Profil", type: "image" },
    ]
  }
};

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      onChange(data.url);
      toast.success("Gambar berhasil diupload");
    } catch {
      toast.error("Gagal upload gambar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative rounded-lg overflow-hidden border bg-slate-50 group">
          <img src={value} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => onChange("")}>Ganti Gambar</Button>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-700/50 hover:bg-blue-50/30 transition-all block">
          {isUploading ? <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-700" /> : <ImageIcon className="h-6 w-6 mx-auto mb-2 text-slate-400" />}
          <p className="text-sm font-medium text-slate-600">{isUploading ? "Mengupload..." : "Klik untuk upload gambar"}</p>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
        </label>
      )}
    </div>
  );
}

export function SchoolProfileEditor() {
  const [data, setData] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof typeof EDIT_SECTIONS | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/profile/stats")
        ]);
        const profileData = await profileRes.json();
        const statsData = await statsRes.json();
        setData(profileData || {});
        setStats(statsData || []);
      } catch {
        toast.error("Gagal memuat data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateField = (key: string, value: string) => {
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
      toast.success("Perubahan profil berhasil disimpan!");
      setActiveSection(null);
    } catch {
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header Region */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex text-[10px] font-bold text-slate-400 mb-2 gap-2 uppercase tracking-widest">
            <span>CMS</span>
            <ChevronRight size={10} className="mt-0.5" />
            <span className="text-blue-700">Profil Sekolah</span>
          </nav>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Profil Sekolah</h2>
          <p className="text-slate-500 mt-1">Kelola informasi publik yang ditampilkan pada portal utama sekolah.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-700 hover:bg-blue-800 rounded-lg px-6 h-12 shadow-lg shadow-blue-700/20 gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
          Publikasikan Perubahan
        </Button>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Editorial & Leadership */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <PrincipalSummaryCard data={data} onEdit={() => setActiveSection('PRINCIPAL')} />
          <HistorySummaryCard data={data} onEdit={() => setActiveSection('EDITORIAL')} />
          <Card className="bg-white p-8 rounded-lg shadow-[0_4px_20px_rgba(30,64,175,0.04)] border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-700">
                  <Share2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Kontak & Sosial Media</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveSection('CONTACT_SOCIAL')} className="text-blue-700 hover:bg-blue-50 font-semibold gap-1.5">
                <Settings2 size={14} />
                Kelola
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Email Resmi</label>
                <p className="text-sm font-medium text-slate-700">{data.email || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Telepon</label>
                <p className="text-sm font-medium text-slate-700">{data.phone || '-'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Identity & Facilities */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <VisionMissionCard data={data} onEdit={() => setActiveSection('EDITORIAL')} />
          <FacilitiesSummaryCard stats={stats} onEdit={() => toast.info("Gunakan menu Statistik untuk mengelola data ini")} />
          
          {/* Identity Quick Access */}
          <Card className="bg-slate-900 text-white p-8 rounded-lg border-none shadow-xl overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="font-bold text-lg">Identitas Sekolah</h4>
                  <p className="text-slate-400 text-xs">NPSN & Akreditasi Dasar</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setActiveSection('BASIC_INFO')} className="bg-white/10 hover:bg-white/20 border-none text-white gap-1.5">
                  <Settings2 size={14} />
                  Kelola
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">NPSN</label>
                  <p className="text-sm font-mono font-bold">{data.npsn || '-'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Akreditasi</label>
                  <p className="text-sm font-bold">{data.accreditation || '-'}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform">
              <Globe size={140} />
            </div>
          </Card>

          {/* Hero Section Card */}
          <Card className="bg-white p-8 rounded-lg shadow-[0_4px_20px_rgba(30,64,175,0.04)] border border-slate-100">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-700">
                    <ImageIcon size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Hero Website</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('HERO_PROFILE')} className="text-blue-700 hover:bg-blue-50 font-semibold gap-1.5">
                  <Settings2 size={14} />
                  Edit
                </Button>
              </div>
              {data.profileHeroImage && (
                <img src={data.profileHeroImage} alt="Hero" className="w-full h-32 object-cover rounded-lg border border-slate-100" />
              )}
          </Card>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!activeSection} onOpenChange={() => setActiveSection(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {activeSection && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {React.createElement(EDIT_SECTIONS[activeSection].icon, { size: 24, className: "text-blue-700" })}
                  <SheetTitle className="text-2xl font-bold">{EDIT_SECTIONS[activeSection].title}</SheetTitle>
                </div>
                <SheetDescription>{EDIT_SECTIONS[activeSection].description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-4">
                {EDIT_SECTIONS[activeSection].fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{field.title}</label>
                    {field.type === "text" && (
                      <Input
                        value={data[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="rounded-lg h-11 border-slate-300 focus:border-blue-700 focus:ring-blue-700/10"
                      />
                    )}
                    {field.type === "textarea" && (
                      <Textarea
                        rows={field.rows || 3}
                        value={data[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="rounded-lg border-slate-300 focus:border-blue-700 focus:ring-blue-700/10 min-h-[100px]"
                      />
                    )}
                    {field.type === "image" && (
                      <ImageUpload
                        value={data[field.key] || ""}
                        onChange={(url) => updateField(field.key, url)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <SheetFooter className="mt-8 border-t pt-6 sticky bottom-0 bg-white">
                <Button variant="outline" onClick={() => setActiveSection(null)} className="rounded-lg">Batal</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-blue-700 hover:bg-blue-800 rounded-lg px-8 gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Simpan Perubahan
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center p-0 transition-all hover:scale-110 z-50 group"
      >
        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Simpan Cepat
        </span>
      </Button>
    </div>
  );
}
