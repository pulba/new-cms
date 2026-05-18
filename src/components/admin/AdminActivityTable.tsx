import React from 'react';
import { cn } from "@/lib/utils";

interface Activity {
  user: string;
  action: string;
  time: string;
  status: 'Berhasil' | 'Diproses' | 'Gagal' | 'Info' | 'Pending';
  avatar?: string;
  module?: string;
}

interface AdminActivityTableProps {
  activities: Activity[];
}

const MODULE_ICONS: Record<string, string> = {
  'Berita': 'article',
  'Galeri': 'collections',
  'Banner': 'view_carousel',
  'Profil': 'settings',
  'Penerimaan': 'school',
  'Pendaftaran': 'how_to_reg',
  'Pengguna': 'admin_panel_settings',
  'Pengumuman': 'campaign',
  'Pesan': 'mail',
  'OSIS': 'groups',
  'Staff': 'group',
  'Sistem': 'terminal',
  'General': 'info',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  'Berhasil':   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Berhasil' },
  'Diproses':   { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Diproses' },
  'Gagal':      { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Gagal' },
  'Info':       { bg: 'bg-slate-100',   text: 'text-slate-600',   label: 'Info' },
  'Pending':    { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Pending' },
};

export function AdminActivityTable({ activities }: AdminActivityTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col h-auto">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-slate-900">Aktivitas Terbaru</h3>
      </div>

      <div className="flex-1 relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[9px] top-4 bottom-4 w-[2px] bg-slate-100 z-0"></div>

        <div className="space-y-5 relative z-10">
          {activities.map((activity, index) => {
            const moduleIcon = MODULE_ICONS[activity.module || ''] || 'info';
            const statusCfg = STATUS_CONFIG[activity.status] || STATUS_CONFIG['Info'];

            return (
              <div key={index} className="flex gap-4 items-start group">
                {/* Timeline Dot with module icon */}
                <div className="relative mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10">
                  <span className="material-symbols-outlined text-[10px] text-slate-400" style={{ fontSize: '10px' }}>
                    {moduleIcon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-600 leading-snug">
                    <span className="font-bold text-slate-900">{activity.user}</span>
                    {' '}
                    {activity.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-400">{activity.time}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-[11px] text-slate-400">{activity.module}</span>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider",
                      statusCfg.bg, statusCfg.text
                    )}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
