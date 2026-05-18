import React from 'react';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  primaryCtaText: string | null;
  primaryCtaHref: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

interface BannerManagerCardProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

export function BannerManagerCard({ banner, onEdit, onDelete, onToggleStatus }: BannerManagerCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 group hover:shadow-md transition-all">
      <div className="flex items-center pr-2">
        <span className="material-symbols-outlined text-slate-300 cursor-grab hover:text-slate-500 active:cursor-grabbing">
          drag_indicator
        </span>
      </div>
      
      <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-blue-900">{banner.title}</h3>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              banner.isActive ? "text-green-700 bg-green-100" : "text-slate-700 bg-slate-100"
            )}>
              {banner.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">link</span>
              <span>Tautan: {banner.primaryCtaHref || "/"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span>Diunggah: {banner.createdAt || "Baru saja"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onEdit(banner)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" 
              title="Edit"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button 
              onClick={() => onDelete(banner.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" 
              title="Hapus"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
          
          <Switch
            checked={banner.isActive}
            onCheckedChange={() => onToggleStatus(banner.id, banner.isActive)}
          />
        </div>
      </div>
    </div>
  );
}
