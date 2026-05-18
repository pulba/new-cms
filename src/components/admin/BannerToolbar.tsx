import React from 'react';

interface BannerToolbarProps {
  onAdd: () => void;
}

export function BannerToolbar({ onAdd }: BannerToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Manajemen Banner & Slider</h1>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="material-symbols-outlined text-lg">info</span>
          <p className="text-sm">Drag and drop cards to reorder banners on the homepage.</p>
        </div>
      </div>
      <button 
        onClick={onAdd}
        className="bg-blue-900 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-blue-800 transition-all active:scale-95"
      >
        <span className="material-symbols-outlined">add</span>
        Tambah Banner
      </button>
    </div>
  );
}
