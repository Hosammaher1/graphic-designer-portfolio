import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  const variantClasses = {
    default: 'bg-white/5 text-neutral-300 border-white/10',
    published: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    draft: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    archived: 'bg-neutral-800/80 text-neutral-400 border-white/5',
    featured: 'bg-gradient-to-r from-[#842b45]/40 to-[#421a28]/40 text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm shadow-[#842b45]/20',
    rose: 'bg-[#842b45]/25 text-[#f4a496] border border-[#f4a496]/30',
    purple: 'bg-[#3b1940]/40 text-purple-200 border border-purple-400/25',
    blue: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    peach: 'bg-[#f4a496]/15 text-[#fcdcd4] border border-[#f4a496]/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-md transition-all ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {variant === 'published' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {variant === 'draft' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
      {variant === 'featured' && <span className="w-1.5 h-1.5 rounded-full bg-[#f4a496] animate-pulse" />}
      {children}
    </span>
  );
}
