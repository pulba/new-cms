import React from 'react';
import { cn } from "@/lib/utils";

interface NewsStatusBadgeProps {
  status: string;
}

export function NewsStatusBadge({ status }: NewsStatusBadgeProps) {
  const isPublished = status.toLowerCase() === 'published';

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold",
      isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
