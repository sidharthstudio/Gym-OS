import React, { useState } from 'react';
import { Archive, CalendarPlus, Edit3, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { MembershipStatusText } from '../components/ui/StatusText';
import { useGymOs } from '../context/GymOsContext';
import type { EnrichedMember, MembershipPlan } from '../types/gym';
import { APP_REFERENCE_DATE, formatCurrency, formatDate } from '../utils/formatters';

export function MembershipsPage() {
  const {
    currentUser,
    tenantPlans,
    tenantMembers,
    savePlan,
    archivePlan,
    renewOrChangeMembership,
    extendMembershipDays,
  } = useGymOs();

  const isOwner = currentUser?.role === 'GYM_OWNER';

  // Plan modal state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | undefined>(undefined);
  const [planName, setPlanName] = useState('');
  const [planCategory, setPlanCategory] = useState<MembershipPlan['category']>('Monthly');
  const [planDays, setPlanDays] = useState('30');
  const [planPrice, setPlanPrice] = useState('3000');
  const [planDesc, setPlanDesc] = useState('');
  const [planToArchive, setPlanToArchive] = useState<MembershipPlan | null>(null);

  // Renew / Change Plan modal
  const [actionMember, setActionMember] = useState<EnrichedMember | null>(null);
  const [actionMode, setActionMode] = useState<'renew' | 'change_plan'>('renew');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(APP_REFERENCE_DATE);

  // Extend modal
  const [extendMember, setExtendMember] = useState<EnrichedMember | null>(null);
  const [extendDays, setExtendDays] = useState('7');
  const [extendReason, setExtendReason] = useState('Travel freeze courtesy extension');

  const activePlans = tenantPlans.filter((p) => p.status === 'active');

  const openNewPlan = () => {
    setEditingPlanId(undefined);
    setPlanName('');
    setPlanCategory('Monthly');
    setPlanDays('30');
    setPlanPrice('3000');
    setPlanDesc('');
    setPlanModalOpen(true);
  };

  const openEditPlan = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanCategory(plan.category);
    setPlanDays(String(plan.durationDays));
    setPlanPrice(String(plan.price));
    setPlanDesc(plan.description);
    setPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    savePlan({
      id: editingPlanId,
      name: planName,
      category: planCategory,
      durationDays: Math.max(1, Number(planDays)),
      price: Math.max(0, Number(planPrice)),
      description: planDesc,
      status: 'active',
    });
    setPlanModalOpen(false);
  };

  const openRenewOrChange = (member: EnrichedMember, mode: 'renew' | 'change_plan') => {
    setActionMember(member);
    setActionMode(mode);
    setSelectedPlanId(member.currentMembership?.planId ?? activePlans[0]?.id ?? '');
    setStartDate(APP_REFERENCE_DATE);
  };

  const handleConfirmRenewOrChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionMember || !selectedPlanId) return;
    renewOrChangeMembership({
      memberId: actionMember.id,
      planId: selectedPlanId,
      startDate,
      mode: actionMode,
    });
    setActionMember(null);
  };

  const handleConfirmExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendMember?.currentMembership) return;
    extendMembershipDays(extendMember.currentMembership.id, Number(extendDays), extendReason);
    setExtendMember(null);
  };

  const subscriptionColumns: TableColumn<EnrichedMember>[] = [
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
      header: 'Assigned Plan',
      render: (m) => (
        <span className="text-sm text-slate-200">
          {m.currentMembership?.planNameSnapshot ?? 'No Active Plan'}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Validity Window',
      render: (m) => (
        <span className="text-xs font-mono tabular-nums text-slate-300">
          {formatDate(m.currentMembership?.startDate)} → {formatDate(m.currentMembership?.expiryDate)}
        </span>
      ),
    },
    {
      key: 'remaining',
      header: 'Days Left',
      align: 'right',
      render: (m) => {
        if (m.daysRemaining === null) return <span className="text-xs text-slate-500">—</span>;
        return (
          <span
            className={`text-xs font-mono tabular-nums ${
              m.daysRemaining < 0
                ? 'text-red-400'
                : m.daysRemaining <= 7
                  ? 'text-amber-400'
                  : 'text-slate-300'
            }`}
          >
            {m.daysRemaining < 0 ? `${Math.abs(m.daysRemaining)}d overdue` : `${m.daysRemaining}d`}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <MembershipStatusText status={m.computedStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => openRenewOrChange(m, 'renew')}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Renew</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openRenewOrChange(m, 'change_plan')}>
            Change
          </Button>
          {m.currentMembership && (
            <Button size="sm" variant="ghost" onClick={() => setExtendMember(m)}>
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Extend</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Configurable Plans Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Membership Plans</h2>
            <p className="mt-1 text-xs text-slate-400">
              Configurable tiers with custom duration, pricing, and status.
            </p>
          </div>
          {isOwner && (
            <Button onClick={openNewPlan}>
              <Plus className="w-4 h-4" />
              <span>Create Plan</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {tenantPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#111827] border rounded-xl p-5 flex flex-col justify-between ${
                plan.status === 'archived'
                  ? 'border-white/[0.04] opacity-60'
                  : 'border-white/[0.08]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span>{plan.category}</span>
                  <span className="font-mono">{plan.durationDays} days</span>
                </div>
                <h3 className="mt-2 font-display text-base font-semibold text-white">
                  {plan.name}
                </h3>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-400">
                  {formatCurrency(plan.price)}
                </p>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{plan.description}</p>
              </div>

              {isOwner && (
                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {plan.status === 'active' ? 'Active' : 'Archived'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditPlan(plan)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                      title="Edit plan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanToArchive(plan)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.06] cursor-pointer"
                      title={plan.status === 'active' ? 'Archive plan' : 'Reactivate plan'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Member Subscriptions Tracking */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Active & Expiring Subscriptions
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Status is calculated dynamically from start date, expiry date, and payment balances.
          </p>
        </div>

        <DataTable
          data={tenantMembers}
          columns={subscriptionColumns}
          keyExtractor={(m) => m.id}
          emptyTitle="No subscriptions yet"
          emptyDescription="Register a member to assign their first membership plan."
        />
      </section>

      {/* Create / Edit Plan Modal */}
      <Modal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlanId ? 'Edit Membership Plan' : 'Create Membership Plan'}
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Plan Name *</label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Strength & Conditioning 90D"
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={planCategory}
                onChange={(e) => {
                  const cat = e.target.value as MembershipPlan['category'];
                  setPlanCategory(cat);
                  if (cat === 'Monthly') setPlanDays('30');
                  if (cat === 'Quarterly') setPlanDays('90');
                  if (cat === 'Half-Yearly') setPlanDays('180');
                  if (cat === 'Annual') setPlanDays('365');
                }}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Annual">Annual</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                required
                min={1}
                value={planDays}
                onChange={(e) => setPlanDays(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Plan</Button>
          </div>
        </form>
      </Modal>

      {/* Renew or Change Plan Modal */}
      <Modal
        open={Boolean(actionMember)}
        onClose={() => setActionMember(null)}
        title={
          actionMode === 'renew'
            ? `Renew Membership · ${actionMember?.fullName ?? ''}`
            : `Change Plan · ${actionMember?.fullName ?? ''}`
        }
        subtitle="Creates a new membership cycle and sets its fee balance for collection."
      >
        <form onSubmit={handleConfirmRenewOrChange} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Plan</label>
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setActionMember(null)}>
              Cancel
            </Button>
            <Button type="submit">
              {actionMode === 'renew' ? 'Confirm Renewal' : 'Apply Plan Change'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Extend Membership Days Modal */}
      <Modal
        open={Boolean(extendMember)}
        onClose={() => setExtendMember(null)}
        title={`Extend Expiry · ${extendMember?.fullName ?? ''}`}
        subtitle={`Current expiry: ${formatDate(extendMember?.currentMembership?.expiryDate)}`}
      >
        <form onSubmit={handleConfirmExtend} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Additional Days
            </label>
            <input
              type="number"
              min={1}
              max={90}
              required
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Reason / Note</label>
            <input
              type="text"
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setExtendMember(null)}>
              Cancel
            </Button>
            <Button type="submit">Extend Expiry Date</Button>
          </div>
        </form>
      </Modal>

      {/* Archive Plan Confirmation */}
      <ConfirmDialog
        open={Boolean(planToArchive)}
        title={
          planToArchive?.status === 'active'
            ? `Archive "${planToArchive?.name}"?`
            : `Reactivate "${planToArchive?.name}"?`
        }
        description={
          planToArchive?.status === 'active'
            ? 'Archived plans cannot be assigned to new members, while existing member subscriptions remain intact.'
            : 'Reactivating this plan makes it available for new registrations and renewals.'
        }
        confirmLabel={planToArchive?.status === 'active' ? 'Archive Plan' : 'Reactivate Plan'}
        destructive={planToArchive?.status === 'active'}
        onConfirm={() => {
          if (planToArchive) archivePlan(planToArchive.id);
        }}
        onCancel={() => setPlanToArchive(null)}
      />
    </div>
  );
}
