import React from 'react';

interface NewsItem {
  id: string | number;
  title: string;
  category: string;
  publishDate: string;
  excerpt: string;
  image: string;
  views: number;
}

interface AdminPopularNewsProps {
  news: NewsItem[];
  title?: string;
  showViews?: boolean;
}

function NewsThumbnail({ image, alt }: { image: string; alt: string }) {
  if (!image) {
    return (
      <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <span className="material-symbols-outlined text-slate-300 text-2xl">article</span>
      </div>
    );
  }
  return (
    <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-slate-100 overflow-hidden">
      <img
        src={image}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Replace broken image with branded placeholder
          const el = e.currentTarget;
          el.style.display = 'none';
          const parent = el.parentElement;
          if (parent) {
            parent.classList.add('bg-gradient-to-br', 'from-slate-100', 'to-slate-200', 'flex', 'items-center', 'justify-center');
            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined text-slate-300 text-2xl';
            icon.textContent = 'article';
            parent.appendChild(icon);
          }
        }}
      />
    </div>
  );
}

export function AdminPopularNews({ news, title = "Berita Populer", showViews = true }: AdminPopularNewsProps) {
  return (
    <section className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {showViews && news.length > 0 && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Berdasarkan views</span>
        )}
      </div>

      {news.length === 0 ? (
        <div className="py-12 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-slate-300 text-3xl">trending_up</span>
          </div>
          <p className="text-slate-500 font-semibold mb-1">Belum ada statistik kunjungan</p>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">Data berita populer akan muncul setelah pengunjung membaca artikel di website.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {news.map((item) => (
            <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
              <NewsThumbnail image={item.image} alt={item.title} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{item.category}</span>
                  <span className="text-[11px] text-slate-400">{item.publishDate}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{item.title}</h4>
              </div>
              {showViews && (
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <div className="flex items-center gap-1 text-blue-600">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    <span className="font-bold text-sm tabular-nums">{item.views.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">views</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
