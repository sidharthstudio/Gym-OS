import React, { useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useGymOs } from '../context/GymOsContext';
import type { GymStaff } from '../types/gym';
import { formatDate } from '../utils/formatters';

export function StaffPage() {
  const { currentUser, tenantStaff, addStaffMember, toggleStaffActive } = useGymOs();
  const [modalOpen, setModalOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'GYM_OWNER' | 'RECEPTIONIST'>('RECEPTIONIST');
  const [shiftLabel, setShiftLabel] = useState('Morning Desk (06:00 - 14:00)');
  const [error, setError] = useState<string | null>(null);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = addStaffMember({ fullName, email, phone, role, shiftLabel });
    if (!res.ok) {
      setError(res.error || 'Could not add staff account.');
      return;
    }
    setModalOpen(false);
    setFullName('');
    setEmail('');
    setPhone('');
  };

  const columns: TableColumn<GymStaff>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (s) => (
        <div>
          <p className="text-sm font-medium text-white">{s.fullName}</p>
          <p className="text-xs text-slate-400">{s.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role & Access',
      render: (s) => (
        <span className="text-xs font-medium text-slate-200">
          {s.role === 'GYM_OWNER' ? 'Gym Owner (Full)' : 'Receptionist (Front Desk)'}
        </span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift / Scope',
      render: (s) => <span className="text-xs text-slate-300">{s.shiftLabel}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      align: 'right',
      render: (s) => (
        <span className="text-xs font-mono tabular-nums text-slate-400">
          {formatDate(s.joinedAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (s) => (
        <span
          className={`text-xs font-medium ${s.isActive ? 'text-emerald-400' : 'text-slate-500'}`}
        >
          {s.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (s) =>
        s.userId === currentUser?.id ? (
          <span className="text-xs text-slate-500">Current User</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => toggleStaffActive(s.id)}>
            {s.isActive ? 'Disable' : 'Enable'}
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Staff & Permissions</h2>
          <p className="mt-1 text-xs text-slate-400">
            Role-based access control isolating owner financials from front-desk receptionists.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </Button>
      </div>

      {/* RBAC Matrix Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Gym Owner Permissions</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Full workspace access: manage members, plans, payments, staff accounts, financial reports, and gym settings.
          </p>
        </div>
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Receptionist / Staff Permissions</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Register members, log manual payments, check in arrivals, and renew plans. Blocked from owner financial reports and settings.
          </p>
        </div>
      </div>

      <DataTable
        data={tenantStaff}
        columns={columns}
        keyExtractor={(s) => s.id}
        emptyTitle="No staff configured"
        emptyDescription="Add front-desk receptionists or co-owners to collaborate in your gym workspace."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Staff Account"
        subtitle="Creates a staff login scoped strictly to this gym workspace."
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'GYM_OWNER' | 'RECEPTIONIST')}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="RECEPTIONIST">Receptionist / Front Desk</option>
                <option value="GYM_OWNER">Co-Owner (Full Access)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shift Label</label>
              <input
                type="text"
                required
                value={shiftLabel}
                onChange={(e) => setShiftLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Staff Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
