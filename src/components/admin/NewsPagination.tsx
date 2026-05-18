import React from 'react';

interface NewsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsShown: number;
  onPageChange: (page: number) => void;
}

export function NewsPagination({ currentPage, totalPages, totalItems, itemsShown, onPageChange }: NewsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-between">
      <p className="text-sm text-slate-500">
        Menampilkan <span className="font-semibold">{itemsShown}</span> dari <span className="font-semibold">{totalItems}</span> berita
      </p>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
              currentPage === page 
                ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20' 
                : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            {page}
          </button>
        ))}

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
