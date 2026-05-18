import React from 'react';
import { NewsStatusBadge } from "./NewsStatusBadge";
import { NewsAuthorMeta } from "./NewsAuthorMeta";
import { getOptimizedMediaUrl } from "@/lib/cloudinary";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  featuredImage: string | null;
  status: string;
  authorName: string | null;
  createdAt: string;
  category?: string;
}

interface NewsListRowProps {
  item: NewsItem;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onPreview: (id: number) => void;
}

export function NewsListRow({ item, onEdit, onDelete, onPreview }: NewsListRowProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const editUrl = `/admin/posts/${item.id}`;

  const renderThumbnail = (className: string) => (
    <a
      href={editUrl}
      className={`block rounded-lg overflow-hidden bg-slate-100 border border-slate-300/60 shrink-0 hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 transition-all cursor-pointer ${className}`}
      title="Edit berita"
    >
      {item.featuredImage ? (
        <img src={getOptimizedMediaUrl(item.featuredImage, 300)} alt={item.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <span className="material-symbols-outlined text-3xl">image</span>
        </div>
      )}
    </a>
  );

  return (
    <tr className="hover:bg-blue-50/30 transition-colors group border-b border-slate-100 last:border-0 relative block lg:table-row">

      {/* ========================================= */}
      {/* MOBILE / TABLET CARD LAYOUT               */}
      {/* ========================================= */}
      <td className="lg:hidden block p-4 sm:p-5 border-none" colSpan={6}>
        <div className="flex gap-4 sm:gap-5 items-start">

          {/* Left: Fixed Thumbnail Frame */}
          <a
            href={editUrl}
            className="block w-20 h-20 sm:w-28 sm:h-28 min-w-[5rem] sm:min-w-[7rem] max-w-[5rem] sm:max-w-[7rem] rounded-lg overflow-hidden bg-slate-100 border border-slate-300/60 shrink-0 hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 transition-all cursor-pointer relative"
            title="Edit berita"
          >
            {item.featuredImage ? (
              <img src={getOptimizedMediaUrl(item.featuredImage, 300)} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center text-slate-300">
                <span className="material-symbols-outlined text-3xl">image</span>
              </div>
            )}
          </a>

          {/* Right: Flexible Content Stack */}
          <div className="flex flex-col flex-1 min-w-0 min-h-[5rem] sm:min-h-[7rem]">

            {/* Zone A: Title & Category/Date */}
            <div className="mb-3">
              <a
                href={editUrl}
                className="block group/title cursor-pointer min-w-0 mb-2"
                title="Edit berita"
              >
                <span
                  className="block text-xs md:text-fluid-base font-bold text-slate-900 leading-snug group-hover/title:text-blue-700 transition-colors min-w-0"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}
                >
                  {item.title}
                </span>
              </a>

              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full shrink-0 max-w-[160px] truncate border border-slate-300/60">
                  {item.category || "Berita"}
                </span>
                <span className="text-[10px] text-slate-300 shrink-0">•</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium shrink-0">{formattedDate}</span>
              </div>
            </div>

            {/* Zone B: Author & Status */}
            <div className="flex items-center gap-2 min-w-0">
              <NewsAuthorMeta name={item.authorName || "Admin"} />
              <NewsStatusBadge status={item.status} />
            </div>

            {/* Zone C: Actions (Bottom Aligned) */}
            <div className="flex justify-end gap-1.5 mt-auto pt-3 border-t border-slate-100/60">
              <button onClick={() => onPreview(item.id)} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all active:scale-95" title="Preview">
                <span className="material-symbols-outlined text-lg">visibility</span>
              </button>
              <button onClick={() => onEdit(item.id)} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all active:scale-95" title="Edit">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button onClick={() => onDelete(item.id)} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-100 transition-all active:scale-95" title="Hapus">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>

          </div>
        </div>
      </td>

      {/* ========================================= */}
      {/* DESKTOP TABLE LAYOUT                        */}
      {/* ========================================= */}

      {/* Thumbnail */}
      <td className="hidden lg:table-cell px-6 py-5 w-28 align-middle">
        {renderThumbnail("w-24 h-16")}
      </td>

      {/* Title & Category */}
      <td className="hidden lg:table-cell px-6 py-5 min-w-0 align-middle">
        <a
          href={editUrl}
          className="block group/title cursor-pointer min-w-0 mb-2"
          title="Edit berita"
        >
          <span
            className="block text-fluid-base font-bold text-slate-900 leading-snug group-hover/title:text-blue-700 transition-colors min-w-0"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}
          >
            {item.title}
          </span>
        </a>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full shrink-0 max-w-[200px] truncate border border-slate-300/60">
            {item.category || "Berita"}
          </span>
        </div>
      </td>

      {/* Author */}
      <td className="hidden lg:table-cell px-6 py-5 w-40 align-middle">
        <NewsAuthorMeta name={item.authorName || "Administrator"} />
      </td>

      {/* Status */}
      <td className="hidden lg:table-cell px-6 py-5 w-32 align-middle">
        <NewsStatusBadge status={item.status} />
      </td>

      {/* Date */}
      <td className="hidden lg:table-cell px-6 py-5 text-sm text-slate-500 font-medium whitespace-nowrap w-28 align-middle">
        {formattedDate}
      </td>

      {/* Actions */}
      <td className="hidden lg:table-cell px-6 py-5 text-right w-32 align-middle">
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onPreview(item.id)} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all" title="Preview">
            <span className="material-symbols-outlined text-lg">visibility</span>
          </button>
          <button onClick={() => onEdit(item.id)} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all" title="Edit">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button onClick={() => onDelete(item.id)} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-100 transition-all" title="Hapus">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
