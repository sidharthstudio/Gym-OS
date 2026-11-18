import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { useGymOs } from '../context/GymOsContext';
import { downloadCsv, formatCurrency, getPaymentMethodLabel } from '../utils/formatters';

export function ReportsPage() {
  const { activeGym, tenantMembers, tenantPayments, tenantPlans } = useGymOs();

  const totalCollected = tenantPayments
    .filter((p) => p.transactionStatus === 'completed')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const totalOutstanding = tenantMembers.reduce((sum, m) => sum + m.outstandingBalance, 0);

  const planRevenueMap = tenantPlans.map((plan) => {
    const membersOnPlan = tenantMembers.filter((m) => m.currentMembership?.planId === plan.id);
    const collectedOnPlan = membersOnPlan.reduce((sum, m) => sum + m.totalPaid, 0);
    return {
      plan,
      memberCount: membersOnPlan.length,
      collected: collectedOnPlan,
    };
  });

  const handleExportPaymentsCsv = () => {
    downloadCsv(
      `${activeGym?.slug ?? 'gym'}-payments-ledger.csv`,
      tenantPayments.map((p) => {
        const m = tenantMembers.find((mem) => mem.id === p.memberId);
        return {
          Receipt: p.receiptNumber,
          Date: p.paymentDate,
          Member: m?.fullName ?? '',
          MemberCode: m?.memberCode ?? '',
          AmountINR: p.amountPaid,
          Method: getPaymentMethodLabel(p.paymentMethod),
          RecordedBy: p.recordedByName,
          Status: p.transactionStatus,
        };
      })
    );
  };

  const handleExportMembersCsv = () => {
    downloadCsv(
      `${activeGym?.slug ?? 'gym'}-members.csv`,
      tenantMembers.map((m) => ({
        MemberCode: m.memberCode,
        FullName: m.fullName,
        Phone: m.phone,
        Email: m.email,
        Plan: m.currentMembership?.planNameSnapshot ?? '',
        Status: m.computedStatus,
        TotalFee: m.totalFee,
        TotalPaid: m.totalPaid,
        Outstanding: m.outstandingBalance,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Financial Reports</h2>
          <p className="mt-1 text-xs text-slate-400">
            Owner-level revenue distribution, plan performance, and CSV exports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleExportMembersCsv}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Members CSV</span>
          </Button>
          <Button size="sm" onClick={handleExportPaymentsCsv}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger CSV</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Cumulative Ledger Collected"
          value={formatCurrency(totalCollected)}
          subtext={`${tenantPayments.length} completed transaction(s)`}
          tone="positive"
        />
        <KpiCard
          label="Open Accounts Receivable"
          value={formatCurrency(totalOutstanding)}
          subtext="Pending partial installments"
          tone={totalOutstanding > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="Average Ticket Value"
          value={formatCurrency(
            tenantPayments.length > 0 ? Math.round(totalCollected / tenantPayments.length) : 0
          )}
          subtext="Per payment transaction"
        />
      </div>

      {/* Revenue by Plan */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-white">
          Collection by Membership Plan
        </h3>
        <div className="mt-4 divide-y divide-white/[0.06]">
          {planRevenueMap.map(({ plan, memberCount, collected }) => (
            <div key={plan.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{plan.name}</p>
                <p className="text-xs text-slate-400">
                  {plan.durationDays} days · {formatCurrency(plan.price)} list price ·{' '}
                  {memberCount} current member(s)
                </p>
              </div>
              <span className="text-sm font-mono font-semibold tabular-nums text-emerald-400">
                {formatCurrency(collected)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
