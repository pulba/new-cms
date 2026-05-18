import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const MENU_ITEMS = [
  { title: "Dashboard", href: "/admin", icon: "dashboard" },
  { title: "Banner & Gallery", href: "/admin/banners", icon: "view_carousel" },
  { title: "Berita", href: "/admin/posts", icon: "news" },
  { title: "Profil & Pengaturan", href: "/admin/settings", icon: "settings" },
  { title: "Guru & Staff", href: "/admin/staff", icon: "group" },
  { title: "Pengurus OSIS", href: "/admin/osis", icon: "groups" },
  { title: "Media Library", href: "/admin/media", icon: "image" },
  { title: "Pengumuman", href: "/admin/announcements", icon: "campaign" },
  { title: "Pesan Masuk", href: "/admin/inbox", icon: "mail" },
  { title: "Pengguna & Akses", href: "/admin/users", icon: "admin_panel_settings" },
  { title: "divider", href: "#", icon: "" },
  { title: "Program Penerimaan", href: "/admin/admissions/programs", icon: "school" },
  { title: "Jurusan", href: "/admin/admissions/majors", icon: "category" },
  { title: "Data Pendaftar", href: "/admin/admissions/registrations", icon: "how_to_reg" },
];

export function Sidebar({ className }: { className?: string }) {
  const [currentPath, setCurrentPath] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isMobileOpen) {
      root.setAttribute('data-sidebar-state', 'mobile-open');
    } else if (window.innerWidth < 768) {
      root.setAttribute('data-sidebar-state', 'mobile-closed');
    } else if (isCollapsed) {
      root.setAttribute('data-sidebar-state', 'collapsed');
    } else {
      root.setAttribute('data-sidebar-state', 'expanded');
    }
  }, [isCollapsed, isMobileOpen]);

  useEffect(() => {
    // Set active path, removing trailing slash if any
    const path = window.location.pathname;
    setCurrentPath(path);
    
    // Auto-close mobile menu on path change
    setIsMobileOpen(false);
  }, []);

  useEffect(() => {
    // Listen for custom Astro navigation event to update path
    const handleAstroNavigate = () => {
      setCurrentPath(window.location.pathname);
      setIsMobileOpen(false);
    };
    document.addEventListener('astro:page-load', handleAstroNavigate);

    const handleToggle = () => setIsMobileOpen(prev => !prev);
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('toggle-admin-sidebar', handleToggle);
    window.addEventListener('resize', handleResize);
    
    // Initialize resize state once on first mount (will be persisted by ViewTransitions)
    handleResize();

    return () => {
      document.removeEventListener('astro:page-load', handleAstroNavigate);
      window.removeEventListener('toggle-admin-sidebar', handleToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Dynamic import: Firebase SDK only loads when user clicks logout
      const [{ getFirebaseAuth }, { signOut }] = await Promise.all([
        import('@/lib/firebase'),
        import('firebase/auth'),
      ]);
      const auth = getFirebaseAuth();
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 h-full border-r border-slate-300 bg-white flex flex-col py-6 z-[70] transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className={cn("px-6 mb-8 flex items-center justify-between gap-3", isCollapsed && "px-0 justify-center")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined">school</span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h2 className="text-xl font-bold text-blue-900 leading-tight">Admin Panel</h2>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">School CMS</p>
              </div>
            )}
          </div>
          
          {/* Collapse Toggle for Desktop */}
          {!isMobileOpen && (
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "hidden lg:flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors",
                isCollapsed && "hidden"
              )}
            >
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {MENU_ITEMS.map((item, index) => {
            if (item.title === "divider") {
              return (
                <div key={`divider-${index}`} className={cn("pt-5 pb-2 mt-3", isCollapsed ? "px-2" : "px-2")}>
                  <div className="border-t-2 border-slate-200/80" />
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 mt-4 mb-1 pl-2 border-l-2 border-emerald-500">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-extrabold pl-1">Modul Penerimaan</p>
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="flex justify-center mt-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  )}
                </div>
              );
            }
            const isActive = currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative group",
                  isActive 
                    ? "text-blue-700 font-semibold bg-blue-50" 
                    : "text-slate-600 hover:text-blue-600 hover:bg-slate-50",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {!isCollapsed && <span className="text-sm">{item.title}</span>}
                {isActive && !isCollapsed && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-700 rounded-l-full" />}
              </a>
            );
          })}
        </nav>

        <div className={cn("mt-auto px-4 pt-6 border-t border-slate-100 space-y-1", isCollapsed && "px-2")}>
          <a 
            href="/" 
            target="_blank"
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors text-sm font-bold mb-2",
              isCollapsed ? "h-12 w-12 mx-auto" : "px-4 py-3"
            )}
            title={isCollapsed ? "Visit Site" : undefined}
          >
            <span className="material-symbols-outlined">globe</span>
            {!isCollapsed && "Visit Site"}
          </a>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors",
              isCollapsed ? "justify-center px-0 h-12" : "px-4 py-3"
            )}
            title={isCollapsed ? "Keluar" : undefined}
          >
            <span className="material-symbols-outlined">logout</span>
            {!isCollapsed && <span className="text-sm font-semibold">Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
