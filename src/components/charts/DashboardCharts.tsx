import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface MonthlySeriesPoint {
  month: string;
  revenue: number;
  members: number;
}

export function MonthlyRevenueChart({ data }: { data: MonthlySeriesPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxRevenue = Math.max(10000, ...data.map((d) => d.revenue));

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-display font-semibold text-white">Monthly Revenue</h3>
          <p className="mt-0.5 text-xs text-slate-400">6-month fee collection trend</p>
        </div>
        <span className="text-xs font-mono tabular-nums text-emerald-400">
          {hoveredIdx !== null
            ? `${data[hoveredIdx].month}: ${formatCurrency(data[hoveredIdx].revenue)}`
            : `Latest: ${formatCurrency(data[data.length - 1]?.revenue ?? 0)}`}
        </span>
      </div>

      <div className="mt-6 h-44 flex items-end justify-between gap-3">
        {data.map((point, idx) => {
          const pct = Math.max(6, Math.round((point.revenue / maxRevenue) * 100));
          const isLast = idx === data.length - 1;
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={point.month}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 h-full flex flex-col items-center justify-end gap-2 cursor-default"
            >
              <div className="w-full flex-1 flex items-end">
                <div
                  style={{ height: `${pct}%` }}
                  className={`w-full rounded-t-md transition-colors duration-150 ${
                    isHovered
                      ? 'bg-emerald-400'
                      : isLast
                        ? 'bg-emerald-500'
                        : 'bg-[#1F2D49] hover:bg-emerald-500/70'
                  }`}
                  title={`${point.month}: ${formatCurrency(point.revenue)}`}
                />
              </div>
              <span className="text-xs font-mono text-slate-400">{point.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MemberGrowthChart({ data }: { data: MonthlySeriesPoint[] }) {
  const maxMembers = Math.max(5, ...data.map((d) => d.members));
  const width = 360;
  const height = 140;
  const padX = 16;
  const padY = 16;

  const points = data.map((d, idx) => {
    const x =
      data.length <= 1
        ? width / 2
        : padX + (idx / (data.length - 1)) * (width - padX * 2);
    const y =
      height - padY - (d.members / maxMembers) * (height - padY * 2);
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${padX},${height - padY} ${polylinePoints} ${width - padX},${height - padY}`;

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-display font-semibold text-white">Member Growth</h3>
          <p className="mt-0.5 text-xs text-slate-400">Cumulative registered members</p>
        </div>
        <span className="text-xs font-mono tabular-nums text-sky-400">
          {data[data.length - 1]?.members ?? 0} total
        </span>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
          <defs>
            <linearGradient id="memberGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#memberGrowthFill)" />
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
          {points.map((pt) => (
            <g key={pt.month}>
              <circle cx={pt.x} cy={pt.y} r="3.5" fill="#090D16" stroke="#38BDF8" strokeWidth="2" />
            </g>
          ))}
        </svg>
        <div className="flex items-center justify-between px-1 mt-1">
          {data.map((d) => (
            <span key={d.month} className="text-xs font-mono text-slate-400">
              {d.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MemberStatusBreakdownChart({
  active,
  expiringSoon,
  pendingPayment,
  expired,
  inactive,
}: {
  active: number;
  expiringSoon: number;
  pendingPayment: number;
  expired: number;
  inactive: number;
}) {
  const total = Math.max(1, active + expiringSoon + pendingPayment + expired + inactive);
  const rows = [
    { label: 'Active & Settled', count: active, color: 'bg-emerald-500' },
    { label: 'Expiring Within 7d', count: expiringSoon, color: 'bg-amber-400' },
    { label: 'Pending Installment', count: pendingPayment, color: 'bg-sky-400' },
    { label: 'Expired', count: expired, color: 'bg-red-500' },
    { label: 'Inactive', count: inactive, color: 'bg-slate-500' },
  ];

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-display font-semibold text-white">Active vs Inactive Breakdown</h3>
        <p className="mt-0.5 text-xs text-slate-400">Live membership status distribution</p>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((row) => {
          const pct = Math.round((row.count / total) * 100);
          return (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{row.label}</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {row.count} · {pct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.color}`}
                  style={{ width: `${Math.max(row.count > 0 ? 4 : 0, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PaymentCollectionOverviewChart({
  collected,
  outstanding,
  byMethod,
}: {
  collected: number;
  outstanding: number;
  byMethod: Array<{ label: string; amount: number; color: string }>;
}) {
  const totalBilled = Math.max(1, collected + outstanding);
  const collectionRate = Math.round((collected / totalBilled) * 100);

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-display font-semibold text-white">Payment Collection Overview</h3>
          <p className="mt-0.5 text-xs text-slate-400">Settled fees vs outstanding balances</p>
        </div>
        <span className="text-xs font-mono tabular-nums text-emerald-400">
          {collectionRate}% collected
        </span>
      </div>

      <div className="mt-4">
        <div className="h-3 w-full rounded-full bg-red-500/25 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 tabular-nums">
          <span>Collected: {formatCurrency(collected)}</span>
          <span>Outstanding: {formatCurrency(outstanding)}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-2.5">
        {byMethod.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-300">{item.label}</span>
            <span className="font-mono tabular-nums text-slate-200">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
