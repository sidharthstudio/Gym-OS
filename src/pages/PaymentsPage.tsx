import React, { useMemo, useState } from 'react';
import { FileText, Info, Plus, Printer, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useGymOs } from '../context/GymOsContext';
import type { EnrichedMember, Payment, PaymentMethod } from '../types/gym';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/formatters';

export function PaymentsPage() {
  const { activeGym, tenantMembers, tenantMemberships, tenantPayments, recordPayment } =
    useGymOs();

  const [viewTab, setViewTab] = useState<'ledger' | 'outstanding'>('ledger');
  const [search, setSearch] = useState('');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Record payment form state
  const membersWithBalances = useMemo(
    () => tenantMembers.filter((m) => m.outstandingBalance > 0 && m.currentMembership),
    [tenantMembers]
  );

  const [selectedMemberId, setSelectedMemberId] = useState(membersWithBalances[0]?.id ?? '');
  const [amountInput, setAmountInput] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi_manual');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => tenantMembers.find((m) => m.id === selectedMemberId) ?? null,
    [tenantMembers, selectedMemberId]
  );

  const openRecordModal = (preselectMember?: EnrichedMember) => {
    const target = preselectMember ?? membersWithBalances[0];
    setSelectedMemberId(target?.id ?? '');
    setAmountInput(target ? String(target.outstandingBalance) : '');
    setMethod('upi_manual');
    setNotes('');
    setFormError(null);
    setRecordModalOpen(true);
  };

  const handleMemberSelectChange = (memberId: string) => {
    setSelectedMemberId(memberId);
    const m = tenantMembers.find((item) => item.id === memberId);
    setAmountInput(m ? String(m.outstandingBalance) : '');
    setFormError(null);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedMember || !selectedMember.currentMembership) {
      setFormError('Select a member with an active membership balance.');
      return;
    }
    const amt = Number(amountInput);
    if (Number.isNaN(amt) || amt <= 0) {
      setFormError('Enter a valid amount greater than ₹0.');
      return;
    }
    const res = recordPayment({
      memberId: selectedMember.id,
      membershipId: selectedMember.currentMembership.id,
      amountPaid: amt,
      paymentMethod: method,
      notes,
    });
    if (!res.ok) {
      setFormError(res.error || 'Could not record payment.');
      return;
    }
    setRecordModalOpen(false);
    if (res.payment) setReceiptPayment(res.payment);
  };

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenantPayments;
    return tenantPayments.filter((p) => {
      const m = tenantMembers.find((mem) => mem.id === p.memberId);
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        (m?.fullName.toLowerCase().includes(q) ?? false) ||
        p.recordedByName.toLowerCase().includes(q)
      );
    });
  }, [tenantPayments, tenantMembers, search]);

  const paymentColumns: TableColumn<Payment>[] = [
    {
      key: 'receipt',
      header: 'Receipt & Date',
      render: (p) => (
        <div>
          <p className="text-sm font-mono font-medium text-white">{p.receiptNumber}</p>
          <p className="text-xs font-mono text-slate-400">{formatDateTime(p.paymentDate)}</p>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Member & Plan',
      render: (p) => {
        const m = tenantMembers.find((mem) => mem.id === p.memberId);
        const ms = tenantMemberships.find((sub) => sub.id === p.membershipId);
        return (
          <div>
            <p className="text-sm font-medium text-white">{m?.fullName ?? 'Member'}</p>
            <p className="text-xs text-slate-400">{ms?.planNameSnapshot ?? 'Membership'}</p>
          </div>
        );
      },
    },
    {
      key: 'method',
      header: 'Method & Source',
      render: (p) => (
        <div>
          <p className="text-sm text-slate-200">{getPaymentMethodLabel(p.paymentMethod)}</p>
          <p className="text-xs text-slate-400">
            {p.verificationSource === 'verified_payment_gateway'
              ? 'Gateway Verified'
              : `Manual Entry · By ${p.recordedByName}`}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (p) => (
        <span className="text-sm font-mono font-semibold tabular-nums text-emerald-400">
          {formatCurrency(p.amountPaid)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span className="text-xs font-medium text-emerald-400 capitalize">
          {p.transactionStatus}
        </span>
      ),
    },
    {
      key: 'receiptBtn',
      header: 'Receipt',
      align: 'right',
      render: (p) => (
        <Button size="sm" variant="ghost" onClick={() => setReceiptPayment(p)}>
          <FileText className="w-3.5 h-3.5" />
          <span>Receipt</span>
        </Button>
      ),
    },
  ];

  const outstandingColumns: TableColumn<EnrichedMember>[] = [
    {
      key: 'member',
      header: 'Member',
      render: (m) => (
        <div>
          <p className="text-sm font-medium text-white">{m.fullName}</p>
          <p className="text-xs font-mono text-slate-400">{m.memberCode}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Membership',
      render: (m) => (
        <span className="text-sm text-slate-200">{m.currentMembership?.planNameSnapshot}</span>
      ),
    },
    {
      key: 'fee',
      header: 'Total Fee',
      align: 'right',
      render: (m) => <span className="font-mono text-sm">{formatCurrency(m.totalFee)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid So Far',
      align: 'right',
      render: (m) => (
        <span className="font-mono text-sm text-emerald-400">{formatCurrency(m.totalPaid)}</span>
      ),
    },
    {
      key: 'due',
      header: 'Outstanding',
      align: 'right',
      render: (m) => (
        <span className="font-mono text-sm font-semibold text-amber-400">
          {formatCurrency(m.outstandingBalance)}
        </span>
      ),
    },
    {
      key: 'collect',
      header: 'Action',
      align: 'right',
      render: (m) => (
        <Button size="sm" onClick={() => openRecordModal(m)}>
          Record Installment
        </Button>
      ),
    },
  ];

  const receiptMember = receiptPayment
    ? tenantMembers.find((m) => m.id === receiptPayment.memberId)
    : null;
  const receiptMembership = receiptPayment
    ? tenantMemberships.find((ms) => ms.id === receiptPayment.membershipId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Payments & Ledger</h2>
          <p className="mt-1 text-xs text-slate-400">
            Append-only transaction ledger supporting full and partial installments.
          </p>
        </div>
        <Button onClick={() => openRecordModal()} disabled={membersWithBalances.length === 0}>
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </Button>
      </div>

      {/* Honest Gateway Distinction Notice */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-white">Manual vs. Verified Payments:</span> Cash, UPI, and POS card payments logged by desk staff are marked as <span className="font-mono text-slate-200">Manual Entry</span>. Online payment gateway verification is not yet connected in this prototype.
        </p>
      </div>

      {/* View Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-white/[0.08] rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setViewTab('ledger')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              viewTab === 'ledger' ? 'bg-[#1D2842] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Transaction Ledger ({tenantPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setViewTab('outstanding')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              viewTab === 'outstanding'
                ? 'bg-[#1D2842] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Outstanding Balances ({membersWithBalances.length})
          </button>
        </div>

        {viewTab === 'ledger' && (
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, member, or staff..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {viewTab === 'ledger' ? (
        <DataTable
          data={filteredPayments}
          columns={paymentColumns}
          keyExtractor={(p) => p.id}
          emptyTitle="No transactions recorded"
          emptyDescription="Payments recorded for memberships appear here as immutable ledger entries."
        />
      ) : (
        <DataTable
          data={membersWithBalances}
          columns={outstandingColumns}
          keyExtractor={(m) => m.id}
          emptyTitle="Zero outstanding balances"
          emptyDescription="All active memberships in this gym are fully settled."
        />
      )}

      {/* Record Payment Modal */}
      <Modal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Manual Payment"
        subtitle="Creates a new immutable transaction record without altering earlier installments."
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Member with Outstanding Balance
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => handleMemberSelectChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              {membersWithBalances.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode}) · Due {formatCurrency(m.outstandingBalance)}
                </option>
              ))}
            </select>
          </div>

          {selectedMember && (
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#0D1320] border border-white/[0.08] text-xs">
              <div>
                <span className="text-slate-400">Plan Fee</span>
                <p className="mt-1 font-mono font-semibold text-white">
                  {formatCurrency(selectedMember.totalFee)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Paid So Far</span>
                <p className="mt-1 font-mono font-semibold text-emerald-400">
                  {formatCurrency(selectedMember.totalPaid)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Remaining</span>
                <p className="mt-1 font-mono font-semibold text-amber-400">
                  {formatCurrency(selectedMember.outstandingBalance)}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={selectedMember?.outstandingBalance ?? undefined}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="cash">Cash (Manual)</option>
                <option value="upi_manual">UPI (Manual Entry)</option>
                <option value="card_manual">Card POS (Manual Entry)</option>
                <option value="other_manual">Other (Manual Entry)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reference / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Installment 3 of 3, UPI ref checked at desk"
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Transaction</Button>
          </div>
        </form>
      </Modal>

      {/* Printable Payment Receipt Modal */}
      <Modal
        open={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        title="Payment Receipt"
        maxWidthClass="max-w-md"
      >
        {receiptPayment && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#0D1320] border border-white/[0.08] space-y-3">
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <p className="font-display font-semibold text-white">{activeGym?.name}</p>
                  <p className="text-xs text-slate-400">{activeGym?.address}</p>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  {receiptPayment.receiptNumber}
                </span>
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Member</dt>
                  <dd className="text-white font-medium">
                    {receiptMember?.fullName} ({receiptMember?.memberCode})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Membership</dt>
                  <dd className="text-slate-200">{receiptMembership?.planNameSnapshot}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Payment Date</dt>
                  <dd className="font-mono text-slate-200">
                    {formatDateTime(receiptPayment.paymentDate)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Method</dt>
                  <dd className="text-slate-200">
                    {getPaymentMethodLabel(receiptPayment.paymentMethod)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Recorded By</dt>
                  <dd className="text-slate-200">{receiptPayment.recordedByName}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.08] text-sm">
                  <dt className="font-semibold text-white">Amount Paid</dt>
                  <dd className="font-mono font-semibold text-emerald-400">
                    {formatCurrency(receiptPayment.amountPaid)}
                  </dd>
                </div>
                {receiptMember && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-400">Remaining Membership Balance</dt>
                    <dd className="font-mono text-amber-300">
                      {formatCurrency(receiptMember.outstandingBalance)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setReceiptPayment(null)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
