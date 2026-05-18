import React from 'react';

export function BannerTipsCard() {
  return (
    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
      <div className="flex gap-3">
        <span className="material-symbols-outlined text-yellow-600">tips_and_updates</span>
        <div>
          <p className="text-sm font-bold text-yellow-800">Tips Optimasi</p>
          <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
            Gunakan gambar dengan rasio 16:9 (minimal 1920x1080px) untuk hasil visual terbaik di semua perangkat.
          </p>
        </div>
      </div>
    </div>
  );
}
