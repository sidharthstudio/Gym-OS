import React, { useState } from 'react';
import { CalendarCheck, FileText, QrCode, RefreshCw } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { Modal } from '../components/ui/Modal';
import { MembershipStatusText } from '../components/ui/StatusText';
import { useGymOs } from '../context/GymOsContext';
import type { Payment } from '../types/gym';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getPaymentMethodLabel,
} from '../utils/formatters';

export function MemberPortalPage() {
  const {
    activeGym,
    tenantMembers,
    tenantPlans,
    tenantPayments,
    tenantAttendance,
    submitMemberRenewalRequest,
  } = useGymOs();

  const member = tenantMembers[0] ?? null;
  const activePlans = tenantPlans.filter((p) => p.status === 'active');

  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(activePlans[0]?.id ?? '');
  const [renewalNote, setRenewalNote] = useState('');
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  if (!member || !activeGym) {
    return (
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-8 text-center">
        <p className="text-sm text-slate-300">Member profile could not be loaded.</p>
      </div>
    );
  }

  const handleSubmitRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitMemberRenewalRequest(selectedPlanId, renewalNote);
    if (res.ok) {
      setRenewModalOpen(false);
      setRenewalNote('');
      setRequestSuccess('Renewal request submitted to front desk. Staff will confirm shortly.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Personal Member Header */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={member.fullName} src={member.avatarUrl} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-semibold text-white">{member.fullName}</h2>
              <MembershipStatusText status={member.computedStatus} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              <span className="font-mono">{member.memberCode}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>{activeGym.name}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>Joined {formatDate(member.joiningDate)}</span>
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setSelectedPlanId(member.currentMembership?.planId ?? activePlans[0]?.id ?? '');
            setRenewModalOpen(true);
          }}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Request Renewal / Upgrade</span>
        </Button>
      </div>

      {requestSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-xs text-emerald-300">
          {requestSuccess}
        </div>
      )}

      {/* Personal Membership & Fee Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Plan"
          value={member.currentMembership?.planNameSnapshot ?? 'None'}
          subtext={`Valid until ${formatDate(member.currentMembership?.expiryDate)}`}
        />
        <KpiCard
          label="Days Remaining"
          value={
            member.daysRemaining !== null
              ? member.daysRemaining < 0
                ? 'Expired'
                : `${member.daysRemaining} days`
              : '—'
          }
          subtext="Calculated from plan expiry"
          tone={
            member.daysRemaining !== null && member.daysRemaining <= 7 ? 'warning' : 'positive'
          }
        />
        <KpiCard
          label="Total Paid"
          value={formatCurrency(member.totalPaid)}
          subtext={`Of ${formatCurrency(member.totalFee)} plan fee`}
          tone="positive"
        />
        <KpiCard
          label="Outstanding Balance"
          value={formatCurrency(member.outstandingBalance)}
          subtext={member.outstandingBalance > 0 ? 'Payable at front desk' : 'Fully settled'}
          tone={member.outstandingBalance > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Digital Member Pass + Personal Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-white">Member Pass ID</h3>
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Show your member code at the desk. QR turnstile scanning is marked ready for hardware rollout.
            </p>
          </div>
          <div className="my-5 p-4 rounded-lg bg-[#0D1320] border border-white/[0.08] text-center">
            <p className="text-xs text-slate-400">Member Code</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-white">
              {member.memberCode}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            Emergency Contact: {member.emergencyContact ?? 'Not provided'}
          </p>
        </div>

        {/* Own Payment History */}
        <div className="lg:col-span-7 bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-white">My Payment History</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Every installment receipt recorded on your account.
          </p>

          <div className="mt-4 divide-y divide-white/[0.06]">
            {tenantPayments.length === 0 ? (
              <p className="py-6 text-xs text-slate-400">No payments recorded yet.</p>
            ) : (
              tenantPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-mono font-medium text-white">{p.receiptNumber}</p>
                    <p className="text-xs text-slate-400">
                      {getPaymentMethodLabel(p.paymentMethod)} · {formatDateTime(p.paymentDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-semibold tabular-nums text-emerald-400">
                      {formatCurrency(p.amountPaid)}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setReceiptPayment(p)}>
                      <FileText className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Own Attendance History */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-display font-semibold text-white">
              My Attendance History
            </h3>
            <p className="text-xs text-slate-400">Recent gym floor check-ins</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300">
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <span>{tenantAttendance.length} visit(s)</span>
          </span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {tenantAttendance.length === 0 ? (
            <p className="py-4 text-xs text-slate-400">No check-ins recorded yet.</p>
          ) : (
            tenantAttendance.map((att) => (
              <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-200">{formatDateTime(att.checkInAt)}</span>
                <span className="text-slate-400">
                  {att.method === 'front_desk' ? 'Front Desk Check-In' : 'QR Scan'} · Verified by{' '}
                  {att.recordedByName}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submit Renewal Request Modal */}
      <Modal
        open={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Submit Membership Renewal Request"
        subtitle="Sends a renewal or plan upgrade request directly to your gym front desk."
      >
        <form onSubmit={handleSubmitRenewal} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Choose Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.durationDays} days · {formatCurrency(p.price)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Preferred Start / Note (Optional)
            </label>
            <input
              type="text"
              value={renewalNote}
              onChange={(e) => setRenewalNote(e.target.value)}
              placeholder="e.g., Will pay via UPI at morning desk"
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Send Request</Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Preview */}
      <Modal
        open={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        title="Payment Receipt"
        maxWidthClass="max-w-md"
      >
        {receiptPayment && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-[#0D1320] border border-white/[0.08] space-y-2">
              <div className="flex justify-between font-semibold text-white text-sm pb-2 border-b border-white/[0.08]">
                <span>{activeGym.name}</span>
                <span className="font-mono text-emerald-400">{receiptPayment.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member</span>
                <span className="text-white">{member.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span className="font-mono text-slate-200">
                  {formatDateTime(receiptPayment.paymentDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method</span>
                <span className="text-slate-200">
                  {getPaymentMethodLabel(receiptPayment.paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.08] text-sm font-semibold">
                <span className="text-white">Amount Paid</span>
                <span className="font-mono text-emerald-400">
                  {formatCurrency(receiptPayment.amountPaid)}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setReceiptPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
