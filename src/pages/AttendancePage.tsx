import React, { useMemo, useState } from 'react';
import { QrCode, Search, UserCheck } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { KpiCard } from '../components/ui/KpiCard';
import { MembershipStatusText } from '../components/ui/StatusText';
import { useGymOs } from '../context/GymOsContext';
import type { AttendanceRecord } from '../types/gym';
import { APP_REFERENCE_DATE, formatDateTime } from '../utils/formatters';

export function AttendancePage() {
  const { tenantMembers, tenantAttendance, checkInMember } = useGymOs();
  const [selectedMemberId, setSelectedMemberId] = useState(tenantMembers[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const todaysCount = tenantAttendance.filter(
    (a) => a.checkInAt.slice(0, 10) === APP_REFERENCE_DATE
  ).length;

  const filteredAttendance = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenantAttendance;
    return tenantAttendance.filter((a) => {
      const member = tenantMembers.find((m) => m.id === a.memberId);
      return (
        (member?.fullName.toLowerCase().includes(q) ?? false) ||
        (member?.memberCode.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tenantAttendance, tenantMembers, search]);

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    const member = tenantMembers.find((m) => m.id === selectedMemberId);
    const res = checkInMember(selectedMemberId, 'front_desk');
    if (res.ok && member) {
      setFeedback(`Checked in ${member.fullName} (${member.memberCode}).`);
    }
  };

  const columns: TableColumn<AttendanceRecord>[] = [
    {
      key: 'member',
      header: 'Member',
      render: (att) => {
        const m = tenantMembers.find((mem) => mem.id === att.memberId);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={m?.fullName ?? 'Member'} src={m?.avatarUrl} size="sm" />
            <div>
              <p className="text-sm font-medium text-white">{m?.fullName ?? 'Unknown Member'}</p>
              <p className="text-xs font-mono text-slate-400">{m?.memberCode ?? ''}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Membership Status',
      render: (att) => {
        const m = tenantMembers.find((mem) => mem.id === att.memberId);
        return m ? <MembershipStatusText status={m.computedStatus} /> : <span>—</span>;
      },
    },
    {
      key: 'method',
      header: 'Check-In Method',
      render: (att) => (
        <span className="text-xs text-slate-300">
          {att.method === 'front_desk' ? 'Front Desk' : 'QR Scan (Prototype)'}
        </span>
      ),
    },
    {
      key: 'staff',
      header: 'Logged By',
      render: (att) => <span className="text-xs text-slate-400">{att.recordedByName}</span>,
    },
    {
      key: 'time',
      header: 'Check-In Time',
      align: 'right',
      render: (att) => (
        <span className="text-xs font-mono tabular-nums text-slate-200">
          {formatDateTime(att.checkInAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Attendance Tracking</h2>
          <p className="mt-1 text-xs text-slate-400">
            Front desk check-in log with architecture ready for QR turnstile scanning.
          </p>
        </div>
      </div>

      {/* Summary & Quick Check-In */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-[#111827] border border-white/[0.08] rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-white">Quick Member Check-In</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Select a member to log today&apos;s arrival timestamp.
          </p>

          <form onSubmit={handleCheckIn} className="mt-4 flex flex-col sm:flex-row gap-3">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              {tenantMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode}) · {m.computedStatus.replace('_', ' ')}
                </option>
              ))}
            </select>
            <Button type="submit">
              <UserCheck className="w-4 h-4" />
              <span>Log Check-In</span>
            </Button>
          </form>

          {feedback && (
            <p className="mt-3 text-xs text-emerald-400">{feedback}</p>
          )}
        </div>

        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <KpiCard
            label="Check-Ins Today"
            value={todaysCount}
            subtext="Recorded floor arrivals"
            tone="positive"
          />
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>QR Scanner</span>
              <QrCode className="w-4 h-4 text-sky-400" />
            </div>
            <p className="mt-2 text-sm font-semibold text-white">Architecture Ready</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Schema supports <span className="font-mono">qr_scan</span> method
            </p>
          </div>
        </div>
      </div>

      {/* Search & Attendance Log */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendance by member name or ID..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <DataTable
        data={filteredAttendance}
        columns={columns}
        keyExtractor={(a) => a.id}
        emptyTitle="No attendance records found"
        emptyDescription="Use the quick check-in form above to log member arrivals."
      />
    </div>
  );
}
