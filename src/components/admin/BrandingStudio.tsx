import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { generateThemeTokens, darken, lighten } from "@/lib/themeEngine";

// --- Presets ---
const PRESETS = [
  { name: 'Biru Akademik', emoji: '🎓', colors: { themeColorPrimary: '#1e3a8a', themeColorBackground: '#f8fafc', themeColorSurface: '#ffffff', themeColorText: '#334155', themeColorHeading: '#0f172a', themeColorLink: '#1e40af', themeColorLinkHover: '#1e3a8a', themeColorBorder: '#e2e8f0', themeColorAccent: '#3b82f6', themeColorBadge: '#dbeafe' } },
  { name: 'Hijau Islami', emoji: '🕌', colors: { themeColorPrimary: '#15803d', themeColorBackground: '#f0fdf4', themeColorSurface: '#ffffff', themeColorText: '#1e293b', themeColorHeading: '#14532d', themeColorLink: '#16a34a', themeColorLinkHover: '#15803d', themeColorBorder: '#dcfce7', themeColorAccent: '#22c55e', themeColorBadge: '#dcfce7' } },
  { name: 'Merah Nasional', emoji: '🇮🇩', colors: { themeColorPrimary: '#b91c1c', themeColorBackground: '#fef2f2', themeColorSurface: '#ffffff', themeColorText: '#1e293b', themeColorHeading: '#450a0a', themeColorLink: '#dc2626', themeColorLinkHover: '#b91c1c', themeColorBorder: '#fecaca', themeColorAccent: '#ef4444', themeColorBadge: '#fee2e2' } },
  { name: 'Ungu Modern', emoji: '✨', colors: { themeColorPrimary: '#7c3aed', themeColorBackground: '#faf5ff', themeColorSurface: '#ffffff', themeColorText: '#1e293b', themeColorHeading: '#3b0764', themeColorLink: '#8b5cf6', themeColorLinkHover: '#7c3aed', themeColorBorder: '#e9d5ff', themeColorAccent: '#a855f7', themeColorBadge: '#f3e8ff' } },
  { name: 'Abu Minimalis', emoji: '🖤', colors: { themeColorPrimary: '#334155', themeColorBackground: '#f8fafc', themeColorSurface: '#ffffff', themeColorText: '#475569', themeColorHeading: '#0f172a', themeColorLink: '#334155', themeColorLinkHover: '#1e293b', themeColorBorder: '#e2e8f0', themeColorAccent: '#64748b', themeColorBadge: '#f1f5f9' } },
];

// --- Field Groups ---
const GROUPS = [
  { id: 'navbar', title: 'Header & Navigasi', emoji: '🧭', fields: [
    { key: 'themeColorPrimary', label: 'Warna Navbar & Brand' },
    { key: 'themeColorLink', label: 'Warna Link Menu' },
    { key: 'themeColorLinkHover', label: 'Warna Hover Link' },
  ]},
  { id: 'content', title: 'Konten Halaman', emoji: '📄', fields: [
    { key: 'themeColorBackground', label: 'Latar Belakang Halaman' },
    { key: 'themeColorHeading', label: 'Warna Judul Artikel' },
    { key: 'themeColorText', label: 'Warna Teks Paragraf' },
  ]},
  { id: 'cards', title: 'Kartu & Batas', emoji: '🃏', fields: [
    { key: 'themeColorSurface', label: 'Warna Permukaan Kartu' },
    { key: 'themeColorBorder', label: 'Warna Garis Pembatas' },
    { key: 'themeColorBadge', label: 'Warna Label / Badge' },
  ]},
  { id: 'accent', title: 'Aksen & Dekoratif', emoji: '🎨', fields: [
    { key: 'themeColorAccent', label: 'Warna Aksen Utama' },
  ]},
];

const SWATCHES = ['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#0f172a','#ffffff'];

const HIGHLIGHT_MAP: Record<string, string> = {
  themeColorPrimary: 'navbar', themeColorLink: 'navbar', themeColorLinkHover: 'navbar',
  themeColorBackground: 'body', themeColorHeading: 'content', themeColorText: 'content',
  themeColorSurface: 'card', themeColorBorder: 'card', themeColorBadge: 'card',
  themeColorAccent: 'accent',
};

// --- Color Field ---
function ColorField({ label, value, onChange, onFocus }: { label: string; value: string; onChange: (v: string) => void; onFocus: () => void }) {
  const val = value || '#000000';
  return (
    <div className="py-4 border-b border-slate-100 last:border-0" onFocus={onFocus}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <Label className="text-sm font-bold text-slate-700">{label}</Label>
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-slate-300 shrink-0">
            <input type="color" value={val} onChange={(e) => onChange(e.target.value)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" />
          </div>
          <Input value={val} onChange={(e) => onChange(e.target.value)} className="h-8 w-20 font-mono text-xs text-center shadow-none px-1" maxLength={7} />
        </div>
      </div>
      <div className="flex gap-1.5">
        {SWATCHES.map(s => (
          <button key={s} onClick={() => onChange(s)}
            className={cn("w-5 h-5 rounded-full border shadow-sm hover:scale-125 transition-transform", val.toLowerCase() === s ? 'ring-2 ring-offset-1 ring-blue-500' : 'border-slate-300')}
            style={{ backgroundColor: s }} title={s} />
        ))}
      </div>
    </div>
  );
}

// --- Mini Website Preview ---
function MiniPreview({ data, highlight }: { data: Record<string, any>; highlight: string | null }) {
  const p = generateThemeTokens(data);
  const glow = (zone: string) => highlight === zone ? `0 0 0 3px ${p.accent}80` : 'none';

  // CSS variables injected inline for hover states
  const hoverStyle = `
    .mini-link:hover { color: ${p.hoverLinkSafe} !important; text-decoration: underline; }
    .mini-btn:hover { background-color: ${p.hoverPrimarySafe} !important; }
    .mini-heading:hover { color: ${p.hoverHeadingSafe} !important; }
  `;


  return (
    <div className="rounded-xl border border-slate-300 overflow-hidden shadow-lg text-[10px] leading-relaxed select-none" style={{ fontFamily: `${p.fontFamily}, sans-serif`, backgroundColor: p.background, maxWidth: 380 }}>
      <style>{hoverStyle}</style>
      
      {/* Navbar */}
      <div style={{ backgroundColor: p.primary, color: p.onPrimaryText, padding: '10px 14px', boxShadow: glow('navbar'), transition: 'box-shadow 0.3s' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[8px] font-black" style={{ color: p.onPrimaryText }}>S</div>
            <span className="font-extrabold text-[11px]">Sekolah</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: p.onPrimaryText, opacity: 0.9 }} className="font-medium">Beranda</span>
            <span style={{ color: p.onPrimaryText, opacity: 0.7 }} className="font-medium">Profil</span>
            <span style={{ color: p.onPrimaryText, opacity: 0.7 }} className="font-medium">Berita</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ backgroundColor: p.softPrimaryBackground, padding: '20px 14px', borderBottom: `1px solid ${p.borderSoft}`, boxShadow: glow('content'), transition: 'box-shadow 0.3s' }}>
        <h2 style={{ color: p.heading, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Selamat Datang di Website Sekolah</h2>
        <p style={{ color: p.text, fontSize: 10 }}>Platform digital pendidikan berkualitas untuk generasi unggul.</p>
        <div className="flex gap-2 mt-3">
          <button className="mini-btn" style={{ backgroundColor: p.primary, color: p.onPrimaryText, borderRadius: p.radius === 'none' ? '0' : '4px', padding: '4px 10px', fontWeight: 700, fontSize: 9, border: 'none', transition: 'all 0.2s' }}>Daftar Sekarang</button>
          <button style={{ backgroundColor: 'transparent', color: p.primary, borderRadius: p.radius === 'none' ? '0' : '4px', padding: '4px 10px', fontWeight: 700, fontSize: 9, border: `1.5px solid ${p.primary}40` }}>Lihat Profil</button>
        </div>
      </div>

      {/* Content body */}
      <div style={{ padding: '14px', boxShadow: glow('body'), transition: 'box-shadow 0.3s' }}>
        {/* Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3" style={{ boxShadow: glow('card'), transition: 'box-shadow 0.3s', borderRadius: p.radius === 'none' ? '0' : '8px' }}>
          <div style={{ backgroundColor: p.surface, borderRadius: p.radius === 'none' ? '0' : '8px', border: `1px solid ${p.border}`, padding: '10px' }}>
            <span style={{ backgroundColor: p.badge, color: p.onAccentText, borderRadius: '99px', padding: '1px 6px', fontSize: 8, fontWeight: 700 }}>Berita</span>
            <h4 className="mini-heading" style={{ color: p.heading, fontWeight: 700, fontSize: 10, marginTop: 6, transition: 'all 0.2s' }}>Penerimaan Siswa Baru</h4>
            <p style={{ color: p.mutedText, fontSize: 9, marginTop: 2 }}>Pendaftaran PPDB tahun ajaran baru telah dibuka.</p>
            <a href="#" className="mini-link" onClick={e => e.preventDefault()} style={{ color: p.link, fontWeight: 600, fontSize: 9, marginTop: 4, display: 'inline-block', transition: 'all 0.2s' }}>Baca →</a>
          </div>
          <div style={{ backgroundColor: p.surface, borderRadius: p.radius === 'none' ? '0' : '8px', border: `1px solid ${p.border}`, padding: '10px' }}>
            <span style={{ backgroundColor: p.badge, color: p.onAccentText, borderRadius: '99px', padding: '1px 6px', fontSize: 8, fontWeight: 700 }}>Prestasi</span>
            <h4 className="mini-heading" style={{ color: p.heading, fontWeight: 700, fontSize: 10, marginTop: 6, transition: 'all 0.2s' }}>Juara Olimpiade Sains</h4>
            <p style={{ color: p.mutedText, fontSize: 9, marginTop: 2 }}>Siswa meraih medali emas tingkat nasional.</p>
            <a href="#" className="mini-link" onClick={e => e.preventDefault()} style={{ color: p.link, fontWeight: 600, fontSize: 9, marginTop: 4, display: 'inline-block', transition: 'all 0.2s' }}>Baca →</a>
          </div>
        </div>

        {/* Blockquote */}
        <div style={{ borderLeft: `3px solid ${p.accent}`, backgroundColor: p.softAccentBackground, padding: '6px 10px', margin: '8px 0', boxShadow: glow('accent'), transition: 'box-shadow 0.3s', borderRadius: `0 4px 4px 0` }}>
          <p style={{ color: p.text, fontStyle: 'italic', fontSize: 9 }}>"Pendidikan adalah senjata paling ampuh untuk mengubah dunia."</p>
          <span style={{ color: p.heading, fontWeight: 700, fontSize: 8 }}>— Kepala Sekolah</span>
        </div>

        {/* Paragraph with link */}
        <p style={{ color: p.text, fontSize: 9, marginTop: 8 }}>
          Informasi selengkapnya tentang program unggulan dan kegiatan ekstrakurikuler dapat dilihat di halaman{' '}
          <a href="#" className="mini-link" onClick={e => e.preventDefault()} style={{ color: p.link, fontWeight: 600 }}>Profil Sekolah</a>.
        </p>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: p.hoverPrimarySafe, color: p.onPrimaryText, padding: '8px 14px', fontSize: 8, textAlign: 'center' as const }}>
        © 2025 Sekolah — Dibuat dengan ❤️
      </div>
    </div>
  );
}

// --- Main Component ---
interface BrandingStudioProps {
  data: Record<string, any>;
  updateField: (key: string, value: any) => void;
}

export function BrandingStudio({ data, updateField }: BrandingStudioProps) {
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [activeField, setActiveField] = useState<string | null>(null);

  const highlightZone = activeField ? (HIGHLIGHT_MAP[activeField] || null) : null;

  // Basic mode: auto-derive all colors from 3 masters
  const applyBasicDerivation = (key: string, value: string) => {
    updateField(key, value);
    const primary = key === 'themeColorPrimary' ? value : (data.themeColorPrimary || '#1e3a8a');
    const bg = key === 'themeColorBackground' ? value : (data.themeColorBackground || '#f8fafc');
    const text = key === 'themeColorText' ? value : (data.themeColorText || '#334155');

    updateField('themeColorHeading', darken(text, 30));
    updateField('themeColorLink', primary);
    updateField('themeColorLinkHover', darken(primary, 20));
    updateField('themeColorSurface', '#ffffff');
    updateField('themeColorBorder', lighten(text, 75));
    updateField('themeColorAccent', primary);
    updateField('themeColorBadge', lighten(primary, 85));
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    Object.entries(preset.colors).forEach(([k, v]) => updateField(k, v));
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => setMode('basic')} className={cn("px-5 py-2.5 rounded-lg text-sm font-bold transition-all", mode === 'basic' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700')}>
          🎯 Mode Dasar
        </button>
        <button onClick={() => setMode('advanced')} className={cn("px-5 py-2.5 rounded-lg text-sm font-bold transition-all", mode === 'advanced' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700')}>
          ⚙️ Mode Lengkap
        </button>
      </div>

      {/* Preset Palettes */}
      <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
          <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">🎨 Preset Palet Warna</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => (
              <button key={preset.name} onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-blue-300 hover:bg-blue-50/50 transition-all active:scale-95 group">
                <span className="text-lg">{preset.emoji}</span>
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">{preset.name}</span>
                <div className="flex -space-x-1 ml-1">
                  {[preset.colors.themeColorPrimary, preset.colors.themeColorBackground, preset.colors.themeColorAccent].map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two-column: Controls + Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* Preview (mobile: on top) */}
        <div className="xl:col-span-5 xl:order-2 xl:sticky xl:top-[140px]">
          <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 px-5">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-center text-slate-400">Pratinjau Langsung</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-slate-100/50 flex items-center justify-center">
              <MiniPreview data={data} highlight={highlightZone} />
            </CardContent>
          </Card>
        </div>

        {/* Controls (mobile: below preview) */}
        <div className="xl:col-span-7 xl:order-1 space-y-6">

          {mode === 'basic' ? (
            /* BASIC MODE: 3 master colors */
            <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 pb-5">
                <CardTitle className="text-lg font-bold text-slate-800">🎯 3 Warna Utama</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Pilih 3 warna dasar, sistem akan menghasilkan seluruh tema secara otomatis.</p>
              </CardHeader>
              <CardContent className="p-6 space-y-2">
                <ColorField label="Warna Brand Utama" value={data.themeColorPrimary || '#1e3a8a'} onChange={(v) => applyBasicDerivation('themeColorPrimary', v)} onFocus={() => setActiveField('themeColorPrimary')} />
                <ColorField label="Warna Latar Belakang" value={data.themeColorBackground || '#f8fafc'} onChange={(v) => applyBasicDerivation('themeColorBackground', v)} onFocus={() => setActiveField('themeColorBackground')} />
                <ColorField label="Warna Teks Utama" value={data.themeColorText || '#334155'} onChange={(v) => applyBasicDerivation('themeColorText', v)} onFocus={() => setActiveField('themeColorText')} />
              </CardContent>
            </Card>
          ) : (
            /* ADVANCED MODE: 4 grouped cards */
            <>
              {GROUPS.map(group => (
                <Card key={group.id} className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-lg">{group.emoji}</span> {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 py-2">
                    {group.fields.map(field => (
                      <ColorField key={field.key} label={field.label} value={data[field.key] || ''} onChange={(v) => updateField(field.key, v)} onFocus={() => setActiveField(field.key)} />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </>
          )}


        </div>
      </div>
    </div>
  );
}
