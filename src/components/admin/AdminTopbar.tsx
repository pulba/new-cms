import React from 'react';

interface AdminTopbarProps {
  userName?: string;
  userRole?: string;
  userPhoto?: string;
}

export function AdminTopbar({ userName = "Admin Profile", userRole = "Super Admin", userPhoto }: AdminTopbarProps) {
  return (
    <header className="flex justify-between items-center h-16 px-4 md:px-8 sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-300 z-40 w-full max-w-full overflow-hidden shrink-0">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'))}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden shrink-0"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Breadcrumb / context area — intentionally empty for now */}
        <div className="hidden sm:block" />
      </div>
      
      <div className="flex items-center gap-2 sm:gap-6 shrink-0 min-w-0">
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors hidden xs:flex">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
        
        <div className="h-8 w-[1px] bg-slate-200 shrink-0"></div>
        
        <div className="flex items-center gap-3 cursor-pointer min-w-0">
          <div className="text-right hidden sm:block min-w-0 max-w-[150px]">
            <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-blue-100 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
            {userPhoto ? (
              <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-slate-400">person</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
