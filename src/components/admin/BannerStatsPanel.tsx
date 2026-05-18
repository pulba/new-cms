import React from 'react';

interface BannerStatsPanelProps {
  total: number;
  active: number;
  storageUsed?: string; // e.g. "4.5 GB"
  storageTotal?: string; // e.g. "10 GB"
  storagePercent?: number; // e.g. 45
}

export function BannerStatsPanel({ 
  total, 
  active, 
  storageUsed = "4.5 GB", 
  storageTotal = "10 GB", 
  storagePercent = 45 
}: BannerStatsPanelProps) {
  return (
    <div className="admin-card bg-blue-900 text-white !border-none relative overflow-hidden">
      <div className="relative z-10">
        <h4 className="text-fluid-xs font-bold uppercase tracking-wider text-blue-200 mb-4">Statistik Slider</h4>
        <div className="grid grid-cols-2 gap-[var(--admin-gap)]">
          <div>
            <p className="text-fluid-h2 font-bold">{total}</p>
            <p className="text-fluid-xs text-blue-200 opacity-80">Total Banner</p>
          </div>
          <div>
            <p className="text-fluid-h2 font-bold text-green-300">{active}</p>
            <p className="text-fluid-xs text-blue-200 opacity-80">Sedang Aktif</p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-fluid-sm font-medium mb-2">Penyimpanan Terpakai</p>
          <div className="w-full bg-blue-800 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full" 
              style={{ width: `${storagePercent}%` }}
            ></div>
          </div>
          <p className="text-[10px] mt-1 text-right font-bold">{storageUsed} / {storageTotal}</p>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-10">
        <span className="material-symbols-outlined text-[100px] lg:text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          analytics
        </span>
      </div>
    </div>
  );
}
