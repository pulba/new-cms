import React from 'react';
import { cn } from "@/lib/utils";

interface Action {
  title: string;
  description: string;
  icon: string;
  href: string;
}

interface AdminQuickActionProps {
  actions: Action[];
}

export function AdminQuickAction({ actions }: AdminQuickActionProps) {
  const colors = [
    'text-amber-600 bg-amber-50 border-amber-100 group-hover:border-amber-300',
    'text-blue-600 bg-blue-50 border-blue-100 group-hover:border-blue-300',
    'text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:border-emerald-300',
    'text-purple-600 bg-purple-50 border-purple-100 group-hover:border-purple-300',
    'text-sky-600 bg-sky-50 border-sky-100 group-hover:border-sky-300',
    'text-rose-600 bg-rose-50 border-rose-100 group-hover:border-rose-300',
  ];

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-5 h-auto flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Aksi Cepat</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const colorClass = colors[index % colors.length];
          return (
            <a
              key={index}
              href={action.href}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-md transition-all group"
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0", colorClass)}>
                <span className="material-symbols-outlined text-xl">{action.icon}</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-[13px] text-slate-900 truncate">{action.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{action.description}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
