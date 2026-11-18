import React, { useMemo, useState } from 'react';
import { Edit3, Eye, Search, UserPlus } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Modal, SlideOver } from '../components/ui/Modal';
import { MembershipStatusText } from '../components/ui/StatusText';
import { useGymOs } from '../context/GymOsContext';
import type { EnrichedMember, Member, MembershipStatus, PaymentMethod } from '../types/gym';
import {
  APP_REFERENCE_DATE,
  formatCurrency,
  formatDate,
  formatDateTime,
  getPaymentMethodLabel,
} from '../utils/formatters';

type StatusFilter = 'all' | MembershipStatus;

export function MembersPage() {
  const {
    tenantMembers,
    tenantPlans,
    tenantMemberships,
    tenantPayments,
    tenantAttendance,
    addMember,
    updateMember,
  } = useGymOs();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Modals & Slide-over
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EnrichedMember | null>(null);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'memberships' | 'payments' | 'attendance'>('overview');

  // Add Member form state
  const activePlans = tenantPlans.filter((p) => p.status === 'active');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Member['gender']>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [planId, setPlanId] = useState(activePlans[0]?.id ?? '');
  const [startDate, setStartDate] = useState(APP_REFERENCE_DATE);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<string>(
    String(activePlans[0]?.price ?? 0)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi_manual');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Member form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGender, setEditGender] = useState<Member['gender']>('Male');
  const [editDob, setEditDob] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergency, setEditEmergency] = useState('');
  const [editAccountStatus, setEditAccountStatus] = useState<'active' | 'inactive'>('active');

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenantMembers.filter((m) => {
      const matchesStatus = statusFilter === 'all' || m.computedStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [tenantMembers, search, statusFilter]);

  const viewingMember = useMemo(
    () => tenantMembers.find((m) => m.id === viewingMemberId) ?? null,
    [tenantMembers, viewingMemberId]
  );

  const openAddModal = () => {
    const firstPlan = activePlans[0];
    setPlanId(firstPlan?.id ?? '');
    setInitialPaymentAmount(String(firstPlan?.price ?? 0));
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setEmergencyContact('');
    setDateOfBirth('');
    setStartDate(APP_REFERENCE_DATE);
    setFormError(null);
    setAddModalOpen(true);
  };

  const handlePlanChangeInAdd = (nextPlanId: string) => {
    setPlanId(nextPlanId);
    const chosen = activePlans.find((p) => p.id === nextPlanId);
    if (chosen) setInitialPaymentAmount(String(chosen.price));
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsedAmount = Number(initialPaymentAmount || 0);
    if (Number.isNaN(parsedAmount)) {
      setFormError('Enter a valid payment amount.');
      return;
    }
    const res = addMember({
      fullName,
      phone,
      email,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      planId,
      startDate,
      initialPaymentAmount: parsedAmount,
      paymentMethod,
    });
    if (!res.ok) {
      setFormError(res.error || 'Could not add member.');
      return;
    }
    setAddModalOpen(false);
  };

  const openEditModal = (member: EnrichedMember) => {
    setEditingMember(member);
    setEditName(member.fullName);
    setEditPhone(member.phone);
    setEditEmail(member.email);
    setEditGender(member.gender ?? 'Prefer not to say');
    setEditDob(member.dateOfBirth ?? '');
    setEditAddress(member.address ?? '');
    setEditEmergency(member.emergencyContact ?? '');
    setEditAccountStatus(member.accountStatus);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    updateMember({
      id: editingMember.id,
      fullName: editName,
      phone: editPhone,
      email: editEmail,
      gender: editGender,
      dateOfBirth: editDob,
      address: editAddress,
      emergencyContact: editEmergency,
      accountStatus: editAccountStatus,
    });
    setEditingMember(null);
  };

  const columns: TableColumn<EnrichedMember>[] = [
    {
      key: 'member',
      header: 'Member',
      render: (m) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar name={m.fullName} src={m.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{m.fullName}</p>
            <p className="text-xs text-slate-400 font-mono truncate">
              {m.memberCode}
              <span className="mx-1.5 text-slate-600 font-sans">·</span>
              <span className="font-sans">{m.phone}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Current Plan',
      render: (m) => (
        <div className="min-w-[140px]">
          <p className="text-sm text-slate-200">{m.currentMembership?.planNameSnapshot ?? 'None'}</p>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            Exp {formatDate(m.currentMembership?.expiryDate)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <MembershipStatusText status={m.computedStatus} />,
    },
    {
      key: 'balance',
      header: 'Balance Due',
      align: 'right',
      render: (m) => (
        <span
          className={`font-mono text-sm tabular-nums ${
            m.outstandingBalance > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          {m.outstandingBalance > 0 ? formatCurrency(m.outstandingBalance) : 'Settled'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      align: 'right',
      render: (m) => (
        <span className="text-xs font-mono tabular-nums text-slate-400">
          {formatDate(m.joiningDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setViewingMemberId(m.id);
              setProfileTab('overview');
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            title="View full profile"
            aria-label={`View ${m.fullName}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(m)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            title="Edit member"
            aria-label={`Edit ${m.fullName}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filterOptions: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'expiring_soon', label: 'Expiring Soon' },
    { id: 'pending_payment', label: 'Pending Dues' },
    { id: 'expired', label: 'Expired' },
    { id: 'inactive', label: 'Inactive' },
  ];

  const viewingHistory = viewingMember
    ? tenantMemberships.filter((ms) => ms.memberId === viewingMember.id)
    : [];
  const viewingPayments = viewingMember
    ? tenantPayments.filter((p) => p.memberId === viewingMember.id)
    : [];
  const viewingAttendance = viewingMember
    ? tenantAttendance.filter((a) => a.memberId === viewingMember.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Member Directory</h2>
          <p className="mt-1 text-xs text-slate-400 tabular-nums">
            {filteredMembers.length} of {tenantMembers.length} member(s) shown
          </p>
        </div>
        <Button onClick={openAddModal} disabled={activePlans.length === 0}>
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </Button>
      </div>

      {/* Search & Segmented Status Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, member ID, phone, or email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-white/[0.08] rounded-lg overflow-x-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatusFilter(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === opt.id
                  ? 'bg-[#1E2A45] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Table */}
      <DataTable
        data={filteredMembers}
        columns={columns}
        keyExtractor={(m) => m.id}
        onRowClick={(m) => {
          setViewingMemberId(m.id);
          setProfileTab('overview');
        }}
        emptyTitle="No matching members"
        emptyDescription="Adjust your search query or register a new gym member to get started."
        emptyActionLabel="Add Member"
        onEmptyAction={openAddModal}
      />

      {/* Add Member Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Member"
        subtitle="Creates member profile, assigns initial plan, and logs any initial payment."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kabir Sinha"
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 11223"
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kabir@email.com"
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Member['gender'])}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name · +91 ..."
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional residential address"
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Membership Plan *
              </label>
              <select
                value={planId}
                onChange={(e) => handlePlanChangeInAdd(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationDays}d · {formatCurrency(p.price)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Initial Payment Received (₹)
              </label>
              <input
                type="number"
                min={0}
                value={initialPaymentAmount}
                onChange={(e) => setInitialPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Enter partial amount to record an installment balance.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Payment Method (Manual Entry)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="upi_manual">UPI (Manual Verification)</option>
                <option value="cash">Cash</option>
                <option value="card_manual">Card POS (Manual Entry)</option>
                <option value="other_manual">Other (Manual Entry)</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Member</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title={`Edit Member · ${editingMember?.memberCode ?? ''}`}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Account Status</label>
              <select
                value={editAccountStatus}
                onChange={(e) => setEditAccountStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive / Paused</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as Member['gender'])}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={editDob}
                onChange={(e) => setEditDob(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Emergency Contact
            </label>
            <input
              type="text"
              value={editEmergency}
              onChange={(e) => setEditEmergency(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Member Full Profile SlideOver */}
      <SlideOver
        open={Boolean(viewingMember)}
        onClose={() => setViewingMemberId(null)}
        title={viewingMember?.fullName ?? 'Member Profile'}
        subtitle={
          viewingMember
            ? `${viewingMember.memberCode} · Joined ${formatDate(viewingMember.joiningDate)}`
            : undefined
        }
      >
        {viewingMember && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <Avatar name={viewingMember.fullName} src={viewingMember.avatarUrl} size="lg" />
                <div>
                  <MembershipStatusText status={viewingMember.computedStatus} />
                  <p className="mt-1 text-xs text-slate-400">{viewingMember.email}</p>
                  <p className="text-xs text-slate-400 font-mono">{viewingMember.phone}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openEditModal(viewingMember)}>
                Edit Profile
              </Button>
            </div>

            {/* Profile Section Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#111827] border border-white/[0.08] rounded-lg overflow-x-auto">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'memberships', label: `Memberships (${viewingHistory.length})` },
                  { id: 'payments', label: `Payments (${viewingPayments.length})` },
                  { id: 'attendance', label: `Attendance (${viewingAttendance.length})` },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setProfileTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                    profileTab === t.id
                      ? 'bg-[#1D2842] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {profileTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[#111827] border border-white/[0.08]">
                  <div>
                    <p className="text-xs text-slate-400">Plan Fee</p>
                    <p className="mt-1 text-base font-mono font-semibold tabular-nums text-white">
                      {formatCurrency(viewingMember.totalFee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Paid</p>
                    <p className="mt-1 text-base font-mono font-semibold tabular-nums text-emerald-400">
                      {formatCurrency(viewingMember.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Outstanding</p>
                    <p
                      className={`mt-1 text-base font-mono font-semibold tabular-nums ${
                        viewingMember.outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {formatCurrency(viewingMember.outstandingBalance)}
                    </p>
                  </div>
                </div>

                <dl className="divide-y divide-white/[0.06] text-sm">
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-400">Current Plan</dt>
                    <dd className="text-white font-medium">
                      {viewingMember.currentMembership?.planNameSnapshot ?? 'None'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-400">Plan Window</dt>
                    <dd className="text-slate-200 font-mono text-xs">
                      {formatDate(viewingMember.currentMembership?.startDate)} →{' '}
                      {formatDate(viewingMember.currentMembership?.expiryDate)}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-400">Gender</dt>
                    <dd className="text-slate-200">{viewingMember.gender ?? '—'}</dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-400">Date of Birth</dt>
                    <dd className="text-slate-200 font-mono text-xs">
                      {formatDate(viewingMember.dateOfBirth)}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-400">Address</dt>
                    <dd className="text-slate-200 text-right">{viewingMember.address ?? '—'}</dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-400">Emergency Contact</dt>
                    <dd className="text-slate-200 text-right">
                      {viewingMember.emergencyContact ?? '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {profileTab === 'memberships' && (
              <div className="divide-y divide-white/[0.08]">
                {viewingHistory.map((ms) => (
                  <div key={ms.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {ms.planNameSnapshot} {ms.isCurrent ? '· Current' : ''}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {formatDate(ms.startDate)} → {formatDate(ms.expiryDate)}
                      </p>
                    </div>
                    <span className="text-sm font-mono tabular-nums text-slate-200">
                      {formatCurrency(ms.totalFee)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {profileTab === 'payments' && (
              <div className="divide-y divide-white/[0.08]">
                {viewingPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No payments recorded yet.</p>
                ) : (
                  viewingPayments.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white font-mono">
                          {p.receiptNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          {getPaymentMethodLabel(p.paymentMethod)} · By {p.recordedByName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold tabular-nums text-emerald-400">
                          {formatCurrency(p.amountPaid)}
                        </p>
                        <p className="text-xs font-mono text-slate-400">
                          {formatDateTime(p.paymentDate)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {profileTab === 'attendance' && (
              <div className="divide-y divide-white/[0.08]">
                {viewingAttendance.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No check-ins recorded yet.</p>
                ) : (
                  viewingAttendance.map((att) => (
                    <div key={att.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white font-mono">
                          {formatDateTime(att.checkInAt)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {att.method === 'front_desk' ? 'Front Desk Check-In' : 'QR Scan'} · Logged by{' '}
                          {att.recordedByName}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
