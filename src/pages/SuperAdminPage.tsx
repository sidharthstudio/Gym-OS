import React, { useState } from 'react';
import { Ban, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { KpiCard } from '../components/ui/KpiCard';
import { ConfirmDialog } from '../components/ui/Modal';
import { GymAccountStatusText } from '../components/ui/StatusText';
import { useGymOs } from '../context/GymOsContext';
import type { Gym } from '../types/gym';
import { formatCurrency, formatDate } from '../utils/formatters';

export function SuperAdminPage() {
  const { gyms, subscriptions, toggleGymSuspension } = useGymOs();
  const [confirmGym, setConfirmGym] = useState<Gym | null>(null);

  const activeGymsCount = gyms.filter((g) => g.accountStatus === 'active').length;
  const trialGymsCount = gyms.filter((g) => g.accountStatus === 'trial').length;
  const suspendedGymsCount = gyms.filter((g) => g.accountStatus === 'suspended').length;
  const platformMrr = gyms
    .filter((g) => g.accountStatus !== 'suspended')
    .reduce((sum, g) => sum + g.saasMonthlyFee, 0);

  const columns: TableColumn<Gym>[] = [
    {
      key: 'gym',
      header: 'Registered Gym',
      render: (g) => (
        <div>
          <p className="text-sm font-medium text-white">{g.name}</p>
          <p className="text-xs text-slate-400">
            {g.city} · <span className="font-mono">{g.slug}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'SaaS Subscription',
      render: (g) => (
        <div>
          <p className="text-sm text-slate-200">
            {g.saasPlan} · <span className="capitalize">{g.billingCycle}</span>
          </p>
          <p className="text-xs font-mono tabular-nums text-emerald-400">
            {formatCurrency(g.saasMonthlyFee)}/mo
          </p>
        </div>
      ),
    },
    {
      key: 'renewal',
      header: 'Period End',
      render: (g) => {
        const sub = subscriptions.find((s) => s.gymId === g.id);
        return (
          <span className="text-xs font-mono tabular-nums text-slate-300">
            {formatDate(sub?.currentPeriodEnd)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (g) => <GymAccountStatusText status={g.accountStatus} />,
    },
    {
      key: 'created',
      header: 'Onboarded',
      align: 'right',
      render: (g) => (
        <span className="text-xs font-mono tabular-nums text-slate-400">
          {formatDate(g.createdAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Account Control',
      align: 'right',
      render: (g) => (
        <Button
          size="sm"
          variant={g.accountStatus === 'suspended' ? 'primary' : 'danger'}
          onClick={() => setConfirmGym(g)}
        >
          {g.accountStatus === 'suspended' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reactivate</span>
            </>
          ) : (
            <>
              <Ban className="w-3.5 h-3.5" />
              <span>Suspend</span>
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold text-white">
          Platform Super Admin Console
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Manage registered tenant gyms, SaaS subscription billing, and workspace account states. Tenant member records remain strictly isolated.
        </p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Platform MRR"
          value={formatCurrency(platformMrr)}
          subtext="Active & trial gym subscriptions"
          tone="positive"
        />
        <KpiCard
          label="Registered Gyms"
          value={gyms.length}
          subtext={`${activeGymsCount} active · ${trialGymsCount} trial`}
        />
        <KpiCard
          label="Active Subscriptions"
          value={subscriptions.filter((s) => s.status === 'active').length}
          subtext="In good billing standing"
          tone="positive"
        />
        <KpiCard
          label="Suspended Workspaces"
          value={suspendedGymsCount}
          subtext="Blocked from workspace login"
          tone={suspendedGymsCount > 0 ? 'danger' : 'neutral'}
        />
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-base font-semibold text-white">
          Registered Gym Accounts
        </h3>
        <DataTable
          data={gyms}
          columns={columns}
          keyExtractor={(g) => g.id}
          emptyTitle="No gyms registered"
          emptyDescription="New gym workspaces registered from the authentication screen appear here."
        />
      </section>

      <ConfirmDialog
        open={Boolean(confirmGym)}
        title={
          confirmGym?.accountStatus === 'suspended'
            ? `Reactivate ${confirmGym?.name}?`
            : `Suspend ${confirmGym?.name}?`
        }
        description={
          confirmGym?.accountStatus === 'suspended'
            ? 'Owners, staff, and members of this gym will immediately regain access to their isolated workspace.'
            : 'Suspending this gym workspace blocks all owner, staff, and member logins until reactivated.'
        }
        confirmLabel={
          confirmGym?.accountStatus === 'suspended' ? 'Reactivate Gym' : 'Suspend Gym'
        }
        destructive={confirmGym?.accountStatus !== 'suspended'}
        onConfirm={() => {
          if (confirmGym) toggleGymSuspension(confirmGym.id);
        }}
        onCancel={() => setConfirmGym(null)}
      />
    </div>
  );
}
