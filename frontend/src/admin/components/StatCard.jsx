import React from 'react';

export function StatCard({ title, value, change, icon: Icon, description, trend = 'up' }) {
  return (
    <div className="relative group p-5 sm:p-6 rounded-2xl glass-panel border border-[#f4a496]/15 hover:border-[#f4a496]/35 transition-all duration-300 shadow-xl shadow-black/50 overflow-hidden">
      {/* Ambient gradient glow on hover */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#842b45]/20 rounded-full blur-2xl group-hover:bg-[#f4a496]/20 transition-all duration-500 pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif tabular-nums">{value}</h3>
          {description && <p className="text-xs text-neutral-400 mt-1 font-light">{description}</p>}
        </div>

        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-[#842b45]/20 border border-[#f4a496]/20 flex items-center justify-center text-[#f4a496] shadow-inner group-hover:scale-105 group-hover:bg-[#842b45]/35 group-hover:border-[#f4a496]/40 transition-all duration-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {change && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs relative z-10">
          <span
            className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[11px] ${
              trend === 'up'
                ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/25'
                : 'text-[#f4a496] bg-[#842b45]/25 border border-[#f4a496]/30'
            }`}
          >
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
          <span className="text-neutral-500 text-[11px] font-light">vs previous month</span>
        </div>
      )}
    </div>
  );
}
