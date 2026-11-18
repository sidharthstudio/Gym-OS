import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  subtext,
  tone = 'neutral',
  onClick,
}: KpiCardProps) {
  const valueColor = {
    neutral: 'text-white',
    positive: 'text-emerald-400',
    warning: 'text-amber-300',
    danger: 'text-red-400',
  }[tone];

  const baseClass =
    'bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between text-left transition-colors duration-150';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} hover:border-white/20 hover:bg-[#141D31] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70`}
      >
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={`mt-2.5 text-2xl font-display font-semibold tracking-tight tabular-nums ${valueColor}`}>
          {value}
        </span>
        <span className="mt-2 text-xs text-slate-400 truncate">{subtext}</span>
      </button>
    );
  }

  return (
    <div className={baseClass}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className={`mt-2.5 text-2xl font-display font-semibold tracking-tight tabular-nums ${valueColor}`}>
        {value}
      </span>
      <span className="mt-2 text-xs text-slate-400 truncate">{subtext}</span>
    </div>
  );
}
