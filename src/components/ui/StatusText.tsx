import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import type { GymAccountStatus, MembershipStatus } from '../../types/gym';
import { getMembershipStatusLabel } from '../../utils/formatters';

export function MembershipStatusText({ status }: { status: MembershipStatus }) {
  const config: Record<
    MembershipStatus,
    { color: string; Icon: React.ComponentType<{ className?: string }> }
  > = {
    active: { color: 'text-emerald-400', Icon: CheckCircle2 },
    expiring_soon: { color: 'text-amber-400', Icon: Clock },
    pending_payment: { color: 'text-amber-400', Icon: AlertTriangle },
    expired: { color: 'text-red-400', Icon: XCircle },
    inactive: { color: 'text-slate-400', Icon: MinusCircle },
  };

  const { color, Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{getMembershipStatusLabel(status)}</span>
    </span>
  );
}

export function GymAccountStatusText({ status }: { status: GymAccountStatus }) {
  const config: Record<
    GymAccountStatus,
    { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }
  > = {
    active: { label: 'Active', color: 'text-emerald-400', Icon: CheckCircle2 },
    trial: { label: 'Trial', color: 'text-sky-400', Icon: Clock },
    suspended: { label: 'Suspended', color: 'text-red-400', Icon: XCircle },
  };

  const { label, color, Icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
