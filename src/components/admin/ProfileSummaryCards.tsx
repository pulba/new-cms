import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Plus, Target, MessageSquare, History, Building2, CheckCircle2 } from "lucide-react";

interface SummaryCardProps {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onEdit: () => void;
  children: React.ReactNode;
  actionText?: string;
  actionIcon?: React.ElementType;
}

export function SummaryCard({ 
  title, 
  icon: Icon, 
  iconBg, 
  iconColor, 
  onEdit, 
  children, 
  actionText = "Edit",
  actionIcon: ActionIcon = Edit2
}: SummaryCardProps) {
  return (
    <Card className="bg-white p-8 rounded-lg shadow-[0_4px_20px_rgba(30,64,175,0.04)] border border-slate-100 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEdit}
          className="text-blue-700 hover:bg-blue-50 font-semibold gap-1.5"
        >
          <ActionIcon size={14} />
          {actionText}
        </Button>
      </div>
      <div>
        {children}
      </div>
    </Card>
  );
}

export function PrincipalSummaryCard({ data, onEdit }: { data: any, onEdit: () => void }) {
  const messagePreview = Array.isArray(data.principalMessage) 
    ? data.principalMessage[0] 
    : (typeof data.principalMessage === 'string' && data.principalMessage.startsWith('[') 
        ? JSON.parse(data.principalMessage)[0] 
        : data.principalMessage);

  return (
    <SummaryCard 
      title="Sambutan Kepala Sekolah" 
      icon={MessageSquare} 
      iconBg="bg-blue-50" 
      iconColor="text-blue-700" 
      onEdit={onEdit}
    >
      <div className="flex gap-6 items-start">
        {data.principalImage ? (
          <img 
            src={data.principalImage} 
            alt="Kepala Sekolah" 
            className="w-32 h-32 rounded-lg object-cover shadow-sm border border-slate-100" 
          />
        ) : (
          <div className="w-32 h-32 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Nama & Gelar</label>
          <p className="text-lg font-bold text-slate-900 mb-4 truncate">{data.principalName || "Belum diatur"}</p>
          
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Isi Sambutan</label>
          <div className="bg-slate-50 p-5 rounded-lg text-slate-600 text-sm leading-relaxed italic border border-slate-100/50">
            <p className="line-clamp-3">"{messagePreview || "Belum ada sambutan..."}"</p>
          </div>
        </div>
      </div>
    </SummaryCard>
  );
}

export function VisionMissionCard({ data, onEdit }: { data: any, onEdit: () => void }) {
  const missions = Array.isArray(data.missionItems) 
    ? data.missionItems 
    : (typeof data.missionItems === 'string' && data.missionItems.startsWith('[') 
        ? JSON.parse(data.missionItems) 
        : []);

  return (
    <SummaryCard 
      title="Visi & Misi" 
      icon={Target} 
      iconBg="bg-orange-50" 
      iconColor="text-orange-700" 
      onEdit={onEdit}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Visi Utama</label>
          <p className="bg-blue-50/50 p-4 border-l-4 border-blue-700 rounded-r-xl font-semibold italic text-blue-900 text-sm">
            "{data.visionText || "Visi belum diatur..."}"
          </p>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Misi Sekolah</label>
          <ul className="space-y-2.5">
            {missions.slice(0, 3).map((mission: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-600 text-sm">
                <CheckCircle2 size={16} className="text-blue-700 mt-0.5 shrink-0" fill="currentColor" fillOpacity={0.1} />
                <span className="line-clamp-1">{mission}</span>
              </li>
            ))}
            {missions.length > 3 && (
              <li className="text-xs text-slate-400 font-medium pl-6">+{missions.length - 3} misi lainnya...</li>
            )}
            {missions.length === 0 && (
              <li className="text-sm text-slate-400 italic">Misi belum diatur...</li>
            )}
          </ul>
        </div>
      </div>
    </SummaryCard>
  );
}

export function HistorySummaryCard({ data, onEdit }: { data: any, onEdit: () => void }) {
  return (
    <SummaryCard 
      title="Sejarah Singkat" 
      icon={History} 
      iconBg="bg-slate-100" 
      iconColor="text-slate-700" 
      onEdit={onEdit}
    >
      <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 py-1">
        <div className="relative">
          <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-700 border-2 border-white shadow-sm"></div>
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Asal Usul</span>
          <p className="text-slate-600 text-sm mt-1 line-clamp-3">
            {data.historyText || "Sejarah belum diatur..."}
          </p>
        </div>
        <div className="relative">
          <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun Berdiri</span>
          <p className="text-slate-900 font-bold mt-0.5">{data.foundedYear || "-"}</p>
        </div>
      </div>
    </SummaryCard>
  );
}

export function FacilitiesSummaryCard({ stats, onEdit }: { stats: any[], onEdit: () => void }) {
  return (
    <SummaryCard 
      title="Fasilitas & Statistik" 
      icon={Building2} 
      iconBg="bg-green-50" 
      iconColor="text-green-700" 
      onEdit={onEdit}
      actionText="Kelola"
      actionIcon={Plus}
    >
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-lg bg-slate-50 border border-slate-100 p-4 hover:border-blue-700/30 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-blue-700 text-xl">{stat.iconName || 'school'}</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{stat.statValue}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.statLabel}</p>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="col-span-2 text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
            Belum ada statistik fasilitas
          </div>
        )}
      </div>
    </SummaryCard>
  );
}
