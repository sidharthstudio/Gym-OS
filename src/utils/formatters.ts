import type { Membership, MembershipStatus, Payment, PaymentMethod } from '../types/gym';

export const APP_REFERENCE_DATE = '2026-11-18';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function addDaysToDate(dateStr: string, days: number): string {
  const base = new Date(`${dateStr}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function getDaysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`);
  const to = new Date(`${toDateStr}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calculateMembershipFinancials(
  membership: Membership | null,
  payments: Payment[]
): { totalFee: number; totalPaid: number; outstandingBalance: number } {
  if (!membership) {
    return { totalFee: 0, totalPaid: 0, outstandingBalance: 0 };
  }
  const completedPayments = payments.filter(
    (p) => p.membershipId === membership.id && p.transactionStatus === 'completed'
  );
  const totalPaid = completedPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const outstandingBalance = Math.max(0, membership.totalFee - totalPaid);
  return {
    totalFee: membership.totalFee,
    totalPaid,
    outstandingBalance,
  };
}

export function calculateMembershipStatus(
  accountStatus: 'active' | 'inactive',
  membership: Membership | null,
  payments: Payment[],
  referenceDate: string = getTodayIsoDate()
): { status: MembershipStatus; daysRemaining: number | null } {
  if (accountStatus === 'inactive') {
    return { status: 'inactive', daysRemaining: null };
  }
  if (!membership) {
    return { status: 'expired', daysRemaining: null };
  }

  const daysRemaining = getDaysBetween(referenceDate, membership.expiryDate);
  const { outstandingBalance } = calculateMembershipFinancials(membership, payments);

  if (daysRemaining < 0) {
    return { status: 'expired', daysRemaining };
  }

  if (daysRemaining <= 7) {
    return { status: 'expiring_soon', daysRemaining };
  }

  if (outstandingBalance > 0) {
    return { status: 'pending_payment', daysRemaining };
  }

  return { status: 'active', daysRemaining };
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'Cash (Manual)';
    case 'upi_manual':
      return 'UPI (Manual Entry)';
    case 'card_manual':
      return 'Card POS (Manual Entry)';
    case 'other_manual':
      return 'Other (Manual Entry)';
    case 'verified_gateway':
      return 'Verified Online Gateway';
  }
}

export function getMembershipStatusLabel(status: MembershipStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'expiring_soon':
      return 'Expiring Soon';
    case 'expired':
      return 'Expired';
    case 'pending_payment':
      return 'Pending Payment';
    case 'inactive':
      return 'Inactive';
  }
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
