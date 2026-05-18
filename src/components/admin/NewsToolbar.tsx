import React from 'react';

interface NewsToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onAddClick: () => void;
}

export function NewsToolbar({ search, onSearchChange, statusFilter, onStatusChange, onAddClick }: NewsToolbarProps) {
  return (
    <div className="admin-card !p-4 sm:!p-6 flex flex-col gap-4 w-full max-w-full min-w-0">
      {/* Search Row - always full width */}
      <div className="relative w-full min-w-0">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input 
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm" 
          placeholder="Cari judul berita..." 
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters + Add Button Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full min-w-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <select className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 flex-1 min-w-[110px] max-w-[180px]">
            <option>Kategori</option>
            <option>Akademik</option>
            <option>Event</option>
            <option>Prestasi</option>
          </select>
          <select 
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 flex-1 min-w-[110px] max-w-[180px]"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <input className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 flex-1 min-w-[130px] max-w-[180px]" type="date"/>
        </div>
        <button 
          onClick={onAddClick}
          className="w-full sm:w-auto bg-blue-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition-all flex items-center justify-center shadow-lg shadow-blue-900/10 active:scale-95 shrink-0 whitespace-nowrap"
        >
          <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'wght' 600" }}>add</span>
          Tambah Berita
        </button>
      </div>
    </div>
  );
}
