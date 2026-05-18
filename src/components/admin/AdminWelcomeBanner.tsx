import React from 'react';

interface AdminWelcomeBannerProps {
  userName: string;
}

export function AdminWelcomeBanner({ userName }: AdminWelcomeBannerProps) {
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());


  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 admin-card !border-blue-100/50 overflow-hidden shadow-[0_4px_20px_rgba(30,64,175,0.03)] py-6 md:py-8 px-6 md:px-10 rounded-2xl mb-8">
      <div className="relative z-10 w-full md:w-3/5 lg:w-1/2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Selamat datang kembali, {userName}!
        </h1>
        <p className="text-sm md:text-base text-slate-500 leading-relaxed mb-4 w-[200px] md:w-full">
          Berikut ringkasan performa operasional CMS sekolah hari ini.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-xs font-semibold text-blue-700 shadow-sm border border-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          {currentDate}
        </div>
      </div>

      {/* Illustration - scaling based on screen size */}
      <div className="absolute -right-14 md:right-0 bottom-0 top-0 w-1/2 block opacity-90 pointer-events-none">
        <img
          src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
          alt="School Illustration"
          className="absolute right-8 bottom-0 h-[120%] object-contain object-bottom drop-shadow-xl"
        />
      </div>
    </div>
  );
}
