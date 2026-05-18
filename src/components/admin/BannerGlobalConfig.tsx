import React from 'react';
import { Switch } from "@/components/ui/switch";

export function BannerGlobalConfig() {
  return (
    <div className="admin-card">
      <h4 className="text-fluid-h3 font-bold text-slate-900 mb-6">Konfigurasi Global</h4>
      <div className="space-y-6">
        <div>
          <label className="block text-fluid-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kecepatan Transisi (detik)</label>
          <select className="w-full bg-slate-50 border-slate-300 rounded-xl text-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 font-medium">
            <option>3 Detik</option>
            <option selected>5 Detik</option>
            <option>7 Detik</option>
            <option>Manual Only</option>
          </select>
        </div>

        <div>
          <label className="block text-fluid-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Animasi Slider</label>
          <div className="responsive-grid-2">
            <button className="px-4 py-2.5 text-xs font-bold border-2 border-blue-900 bg-blue-50 text-blue-900 rounded-xl transition-all">Slide</button>
            <button className="px-4 py-2.5 text-xs font-bold border-2 border-transparent bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">Fade</button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-fluid-sm font-semibold text-slate-600">Tampilkan Navigasi Panah</span>
          <Switch checked />
        </div>
      </div>

      <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
        Simpan Pengaturan
      </button>
    </div>
  );
}
