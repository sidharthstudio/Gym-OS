import React from 'react';
import { ArrowUpRight, Lock, UserPlus, Wallet } from 'lucide-react';
import {
  MemberGrowthChart,
  MemberStatusBreakdownChart,
  MonthlyRevenueChart,
  PaymentCollectionOverviewChart,
} from '../components/charts/DashboardCharts';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { MembershipStatusText } from '../components/ui/StatusText';
import { useGymOs } from '../context/GymOsContext';
import { HISTORICAL_MONTHLY_REVENUE } from '../data/demoData';
import {
  APP_REFERENCE_DATE,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
} from '../utils/formatters';

export function DashboardPage() {
  const {
    activeGym,
    currentUser,
    tenantMembers,
    tenantPayments,
    canViewOwnerFinancials,
    setActiveNav,
  } = useGymOs();

  if (!activeGym) return null;

  const totalMembers = tenantMembers.length;
  const activeMembers = tenantMembers.filter(
    (m) => m.computedStatus === 'active' || m.computedStatus === 'pending_payment'
  ).length;
  const inactiveMembers = tenantMembers.filter((m) => m.computedStatus === 'inactive').length;
  const expiredMemberships = tenantMembers.filter((m) => m.computedStatus === 'expired').length;
  const expiringSoonMembers = tenantMembers.filter((m) => m.computedStatus === 'expiring_soon');
  const membersWithDues = tenantMembers.filter((m) => m.outstandingBalance > 0);
  const totalPendingAmount = membersWithDues.reduce((sum, m) => sum + m.outstandingBalance, 0);

  const todaysPayments = tenantPayments.filter(
    (p) => p.transactionStatus === 'completed' && p.paymentDate.slice(0, 10) === APP_REFERENCE_DATE
  );
  const todaysCollection = todaysPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  const currentMonthPrefix = APP_REFERENCE_DATE.slice(0, 7); // 2026-11
  const currentMonthRevenue = tenantPayments
    .filter(
      (p) => p.transactionStatus === 'completed' && p.paymentDate.slice(0, 7) === currentMonthPrefix
    )
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const history = HISTORICAL_MONTHLY_REVENUE[activeGym.id] ?? [];
  const chartSeries = [
    ...history,
    { month: 'Nov', revenue: currentMonthRevenue, members: totalMembers },
  ];

  // Breakdown counts
  const countActiveSettled = tenantMembers.filter((m) => m.computedStatus === 'active').length;
  const countPending = tenantMembers.filter((m) => m.computedStatus === 'pending_payment').length;

  // Collection overview
  const totalCollectedCurrent = tenantMembers.reduce((sum, m) => sum + m.totalPaid, 0);
  const byMethod = [
    {
      label: 'Cash (Manual)',
      amount: tenantPayments
        .filter((p) => p.paymentMethod === 'cash')
        .reduce((s, p) => s + p.amountPaid, 0),
      color: 'bg-emerald-500',
    },
    {
      label: 'UPI (Manual Entry)',
      amount: tenantPayments
        .filter((p) => p.paymentMethod === 'upi_manual')
        .reduce((s, p) => s + p.amountPaid, 0),
      color: 'bg-sky-400',
    },
    {
      label: 'Card POS (Manual Entry)',
      amount: tenantPayments
        .filter((p) => p.paymentMethod === 'card_manual')
        .reduce((s, p) => s + p.amountPaid, 0),
      color: 'bg-amber-400',
    },
  ];

  const recentRegistrations = [...tenantMembers]
    .sort((a, b) => b.joiningDate.localeCompare(a.joiningDate))
    .slice(0, 5);

  const recentTransactions = tenantPayments.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Workspace Intro & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">
            {activeGym.name} Operations
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            <span>{activeGym.city}</span>
            <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
            <span>Signed in as {currentUser?.fullName}</span>
            <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
            <span>Live calculations from workspace records</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setActiveNav('payments')}>
            <Wallet className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Button>
          <Button size="sm" onClick={() => setActiveNav('members')}>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Members"
          value={totalMembers}
          subtext="Registered in workspace"
          onClick={() => setActiveNav('members')}
        />
        <KpiCard
          label="Active Members"
          value={activeMembers}
          subtext="Valid floor access"
          tone="positive"
          onClick={() => setActiveNav('members')}
        />
        <KpiCard
          label="Inactive Members"
          value={inactiveMembers}
          subtext="Paused accounts"
          onClick={() => setActiveNav('members')}
        />
        <KpiCard
          label="Expired Memberships"
          value={expiredMemberships}
          subtext="Requires renewal"
          tone={expiredMemberships > 0 ? 'danger' : 'neutral'}
          onClick={() => setActiveNav('memberships')}
        />
        <KpiCard
          label="Pending Payments"
          value={formatCurrency(totalPendingAmount)}
          subtext={`${membersWithDues.length} member(s) with dues`}
          tone={totalPendingAmount > 0 ? 'warning' : 'positive'}
          onClick={() => setActiveNav('payments')}
        />
        <KpiCard
          label="Today's Collection"
          value={formatCurrency(todaysCollection)}
          subtext={`${todaysPayments.length} receipt(s) today`}
          tone="positive"
          onClick={() => setActiveNav('payments')}
        />
        {canViewOwnerFinancials ? (
          <KpiCard
            label="Monthly Revenue"
            value={formatCurrency(currentMonthRevenue)}
            subtext="Nov 2026 settled fees"
            tone="positive"
            onClick={() => setActiveNav('reports')}
          />
        ) : (
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Monthly Revenue</span>
            <div className="mt-2.5 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Owner Access Only</span>
            </div>
            <span className="mt-2 text-xs text-slate-500">Restricted by role policy</span>
          </div>
        )}
        <KpiCard
          label="Expiring Soon"
          value={expiringSoonMembers.length}
          subtext="Within next 7 days"
          tone={expiringSoonMembers.length > 0 ? 'warning' : 'neutral'}
          onClick={() => setActiveNav('memberships')}
        />
      </section>

      {/* 4 Charts Grid */}
      <section aria-label="Analytics Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {canViewOwnerFinancials ? (
          <MonthlyRevenueChart data={chartSeries} />
        ) : (
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[240px]">
            <Lock className="w-6 h-6 text-slate-500 mb-2" />
            <h3 className="text-sm font-display font-semibold text-white">
              Owner Financial Chart Restricted
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs">
              Receptionist accounts cannot view historical monthly revenue totals. Use Payments to log daily collections.
            </p>
          </div>
        )}

        <MemberGrowthChart data={chartSeries} />

        <MemberStatusBreakdownChart
          active={countActiveSettled}
          expiringSoon={expiringSoonMembers.length}
          pendingPayment={countPending}
          expired={expiredMemberships}
          inactive={inactiveMembers}
        />

        <PaymentCollectionOverviewChart
          collected={totalCollectedCurrent}
          outstanding={totalPendingAmount}
          byMethod={byMethod}
        />
      </section>

      {/* 4 Operational Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Registrations */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-white">Recent Registrations</h3>
              <p className="text-xs text-slate-400">Latest members onboarded</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('members')}
              className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {recentRegistrations.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member.fullName} src={member.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">
                      <span className="font-mono">{member.memberCode}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span>{member.currentMembership?.planNameSnapshot ?? 'No Plan'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <MembershipStatusText status={member.computedStatus} />
                  <p className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-400">
                    {formatDate(member.joiningDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Append-only receipt entries</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('payments')}
              className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {recentTransactions.map((tx) => {
              const member = tenantMembers.find((m) => m.id === tx.memberId);
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {member?.fullName ?? 'Member'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      <span className="font-mono">{tx.receiptNumber}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span>{getPaymentMethodLabel(tx.paymentMethod)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold tabular-nums text-emerald-400">
                      {formatCurrency(tx.amountPaid)}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-400">
                      {formatDate(tx.paymentDate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Membership Expirations */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-white">
                Upcoming Membership Expirations
              </h3>
              <p className="text-xs text-slate-400">Expiring within 7 days or already expired</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('memberships')}
              className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {tenantMembers.filter(
            (m) => m.computedStatus === 'expiring_soon' || m.computedStatus === 'expired'
          ).length === 0 ? (
            <p className="py-6 text-xs text-slate-400 text-center">
              No memberships expiring in the next 7 days.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {tenantMembers
                .filter(
                  (m) => m.computedStatus === 'expiring_soon' || m.computedStatus === 'expired'
                )
                .map((member) => (
                  <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{member.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">
                        <span>{member.currentMembership?.planNameSnapshot}</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span>Expires {formatDate(member.currentMembership?.expiryDate)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <MembershipStatusText status={member.computedStatus} />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveNav('memberships')}
                      >
                        Renew
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Members with Outstanding Balances */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-white">
                Members with Outstanding Balances
              </h3>
              <p className="text-xs text-slate-400">Partial payment installments pending</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('payments')}
              className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Collect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {membersWithDues.length === 0 ? (
            <p className="py-6 text-xs text-slate-400 text-center">
              All active memberships are fully paid.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {membersWithDues.map((member) => (
                <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-400 truncate tabular-nums">
                      Paid {formatCurrency(member.totalPaid)} of {formatCurrency(member.totalFee)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono font-semibold tabular-nums text-amber-400">
                      {formatCurrency(member.outstandingBalance)} due
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setActiveNav('payments')}
                    >
                      Collect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
