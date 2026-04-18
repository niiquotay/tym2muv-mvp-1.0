import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center gap-1 sm:gap-2 group cursor-pointer ${className}`}>
    <div className="relative w-8 h-8 sm:w-12 sm:h-12 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 overflow-hidden rounded-lg">
      <img 
        src="https://lh3.googleusercontent.com/d/1nXeWtvOyKeF8bk9Ph3Y6euvNKzLuSVV5" 
        alt="tym2muv logo" 
        className="w-full h-full object-contain"
      />
    </div>
    <div className="flex flex-col justify-center">
      <span className="font-bold text-lg sm:text-2xl tracking-tight leading-none text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-600 group-hover:to-fuchsia-500 transition-all font-display">
        tym2muv
      </span>
    </div>
  </div>
);