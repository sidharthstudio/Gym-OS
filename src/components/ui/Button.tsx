import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs min-h-[34px]' : 'px-4 py-2 text-sm min-h-[40px]';

  const variantClass = {
    primary: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold',
    secondary:
      'bg-[#162036] text-slate-100 border border-white/10 hover:bg-[#1E2A45] hover:border-white/20',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/[0.06]',
    danger: 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25',
  }[variant];

  return (
    <button className={`${base} ${sizeClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
