import React from 'react';

interface WebStatsProps {
  totalPageViews: number;
  totalPublishedPosts: number;
  totalRegistrations: number;
  activePrograms: number;
}

export function AdminWebStats({
  totalPageViews,
  totalPublishedPosts,
  totalRegistrations,
  activePrograms,
}: WebStatsProps) {
  const stats = [
    {
      label: 'Total Tayangan',
      value: totalPageViews.toLocaleString('id-ID'),
      icon: 'visibility',
      description: 'Akumulasi views semua berita',
    },
    {
      label: 'Berita Terbit',
      value: totalPublishedPosts.toLocaleString('id-ID'),
      icon: 'article',
      description: 'Jumlah berita published',
    },
    {
      label: 'Total Pendaftar',
      value: totalRegistrations.toLocaleString('id-ID'),
      icon: 'how_to_reg',
      description: 'Seluruh pendaftaran masuk',
    },
    {
      label: 'Program Aktif',
      value: activePrograms.toLocaleString('id-ID'),
      icon: 'school',
      description: 'Program penerimaan aktif',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[24px] leading-[1.4] font-bold text-slate-900">Statistik Website</h3>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data terbaru</span>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <span className="material-symbols-outlined text-[16px]">{stat.icon}</span>
              <span className="text-xs font-semibold">{stat.label}</span>
            </div>
            <p className="text-[24px] font-bold text-slate-900 mb-1">{stat.value}</p>
            <span className="text-[10px] text-slate-400">{stat.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
