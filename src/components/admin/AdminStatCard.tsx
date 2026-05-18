import React from 'react';
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: string;
  badgeText?: string;
  badgeColor?: string;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  linkText?: string;
  linkHref?: string;
  sparklineData?: any[];
  sparklineColor?: string;
}

const defaultSparkline = [
  { value: 10 }, { value: 20 }, { value: 15 }, { value: 30 },
  { value: 25 }, { value: 40 }, { value: 35 }, { value: 45 }
];

export function AdminStatCard({
  title,
  value,
  icon,
  badgeText,
  badgeColor = "bg-green-50 text-green-600",
  className,
  trend = 'up',
  linkText = "Lihat semua",
  linkHref = "#",
  sparklineData = defaultSparkline,
  sparklineColor = "#22c55e"
}: AdminStatCardProps) {

  // Determine gradient colors based on badgeColor or a default
  let iconBg = "bg-blue-50 text-blue-700";
  let chartColor = sparklineColor;
  let TrendIcon = "arrow_drop_up";

  if (badgeColor.includes('green')) {
    iconBg = "bg-green-50 text-green-600";
    chartColor = "#22c55e"; // green-500
    TrendIcon = "arrow_drop_up";
  } else if (badgeColor.includes('orange') || badgeColor.includes('red')) {
    iconBg = "bg-orange-50 text-orange-600";
    chartColor = "#f97316"; // orange-500
    TrendIcon = "arrow_drop_down";
  } else if (badgeColor.includes('slate')) {
    iconBg = "bg-amber-50 text-amber-600";
    chartColor = "#f59e0b"; // amber-500
    TrendIcon = "remove";
  }

  return (
    <div className={cn("admin-card flex flex-col relative overflow-hidden group", className)}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={cn("p-2.5 md:p-3 rounded-lg md:rounded-xl", iconBg)}>
          <span className="material-symbols-outlined text-fluid-h3">{icon}</span>
        </div>
        {badgeText && (
          <span className={cn("flex items-center text-[10px] font-bold px-2 py-0.5 md:py-1 rounded-md", badgeColor)}>
            <span className="material-symbols-outlined text-[12px] md:text-[14px] leading-none">{TrendIcon}</span>
            {badgeText}
          </span>
        )}
      </div>

      <div className="relative z-10 mb-4 md:mb-6">
        <p className="text-slate-500 text-xs md:text-sm font-semibold mb-1">{title}</p>
        <h2 className="text-fluid-h2 text-slate-900">{value}</h2>
        <p className="text-[10px] md:text-[11px] text-slate-400 mt-1">dari minggu lalu</p>
      </div>


      <div className="relative z-10 mt-auto pt-2 border-t border-slate-50">
        <a href={linkHref} className="inline-flex items-center text-[11px] md:text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          {linkText}
          <span className="material-symbols-outlined text-[12px] md:text-[14px] ml-1">arrow_forward</span>
        </a>
      </div>
    </div>
  );
}

