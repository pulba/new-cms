import React from 'react';

interface NewsAuthorMetaProps {
  name: string;
}

export function NewsAuthorMeta({ name }: NewsAuthorMetaProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-green-100 text-green-700'
  ];

  // Deterministic color based on name
  const colorIndex = name.length % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div className="flex items-center">
      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${colorClass} flex items-center justify-center text-xs font-bold mr-2`}>
        {initials || '??'}
      </div>
      <span className="text-xs text-slate-600 font-medium">{name}</span>
    </div>
  );
}
