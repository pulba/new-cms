import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Loader2,
  Globe,
  Share2,
  Palette,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

// Sections configuration for Settings
const SETTINGS_SECTIONS = [
  {
    id: "seo",
    title: "SEO & Meta Data",
    description: "Pengaturan optimasi mesin pencari untuk halaman utama website",
    icon: Globe,
    fields: [
      { key: "seo_title", label: "Global SEO Title", type: "text", placeholder: "Contoh: SD Negeri 1 Jakarta | Sekolah Favorit" },
      { key: "seo_description", label: "Global Meta Description", type: "textarea", placeholder: "Deskripsi singkat sekolah untuk Google..." },
      { key: "seo_keywords", label: "Meta Keywords", type: "text", placeholder: "pendidikan, sd, jakarta, sekolah dasar" },
    ]
  },
  {
    id: "social",
    title: "Sosial Media",
    description: "Tautan ke akun sosial media resmi sekolah",
    icon: Share2,
    fields: [
      { key: "social_facebook", label: "Facebook URL", type: "text", placeholder: "https://facebook.com/..." },
      { key: "social_instagram", label: "Instagram URL", type: "text", placeholder: "https://instagram.com/..." },
      { key: "social_youtube", label: "YouTube Channel URL", type: "text", placeholder: "https://youtube.com/c/..." },
      { key: "social_twitter", label: "Twitter / X URL", type: "text", placeholder: "https://twitter.com/..." },
    ]
  },
  {
    id: "appearance",
    title: "Tampilan & Tema",
    description: "Pengaturan visual website",
    icon: Palette,
    fields: [
      { key: "theme_color_primary", label: "Warna Utama (Hex)", type: "text", placeholder: "#0f172a" },
      { key: "theme_color_secondary", label: "Warna Sekunder (Hex)", type: "text", placeholder: "#3b82f6" },
      { key: "custom_css", label: "Custom CSS", type: "textarea", placeholder: "/* Masukkan CSS tambahan di sini */" },
    ]
  },
  {
    id: "system",
    title: "Sistem",
    description: "Pengaturan sistem website",
    icon: ShieldAlert,
    fields: [
      { key: "maintenance_mode", label: "Mode Perbaikan (Maintenance)", type: "switch", description: "Aktifkan ini untuk menutup sementara website publik dari pengunjung." },
      { key: "google_analytics_id", label: "Google Analytics Measurement ID", type: "text", placeholder: "G-XXXXXXXXXX" },
    ]
  }
];

export function SettingsManager() {
  const [data, setData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // We reuse the profile API since it's a generic key-value store
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((profileData) => {
        setData(profileData);
      })
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setIsLoading(false));
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
      toast.success("Pengaturan berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground text-sm">
            Konfigurasi SEO, Sosial Media, Tema, dan Sistem Website.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Pengaturan
        </Button>
      </div>

      <Separator />

      {/* Settings Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => (
          <Card key={section.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/5">
                  <section.icon className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  
                  {field.type === "text" && (
                    <Input
                      id={field.key}
                      placeholder={field.placeholder}
                      value={data[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                    />
                  )}
                  
                  {field.type === "textarea" && (
                    <Textarea
                      id={field.key}
                      placeholder={field.placeholder}
                      rows={field.key === "custom_css" ? 6 : 3}
                      className={field.key === "custom_css" ? "font-mono text-xs" : ""}
                      value={data[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                    />
                  )}
                  
                  {field.type === "switch" && (
                    <div className="flex items-center space-x-3 pt-1">
                      <Switch
                        id={field.key}
                        checked={data[field.key] === "true"}
                        onCheckedChange={(checked) => updateField(field.key, checked ? "true" : "false")}
                      />
                      <p className="text-sm text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4 pb-8 border-t">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Semua Pengaturan
        </Button>
      </div>
    </div>
  );
}
