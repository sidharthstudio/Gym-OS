import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-14 w-14 text-base'
        : 'h-9 w-9 text-xs';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${sizeClass} shrink-0 rounded-lg object-cover border border-white/10 bg-[#131B2E]`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} shrink-0 rounded-lg bg-[#1A243B] border border-white/10 text-slate-200 font-display font-semibold flex items-center justify-center select-none`}
    >
      {initials || 'GM'}
    </div>
  );
}
