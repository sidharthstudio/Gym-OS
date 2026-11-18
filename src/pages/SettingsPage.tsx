import React, { useState } from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useGymOs } from '../context/GymOsContext';
import { getSupabaseReadiness } from '../lib/supabase/client';
import { formatCurrency } from '../utils/formatters';

export function SettingsPage() {
  const { currentUser, activeGym, updateActiveGymSettings } = useGymOs();
  const readiness = getSupabaseReadiness();

  const [name, setName] = useState(activeGym?.name ?? '');
  const [city, setCity] = useState(activeGym?.city ?? '');
  const [phone, setPhone] = useState(activeGym?.phone ?? '');
  const [email, setEmail] = useState(activeGym?.email ?? '');
  const [address, setAddress] = useState(activeGym?.address ?? '');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveGymSettings({ name, city, phone, email, address });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const schemaTables = [
    'gyms',
    'users',
    'gym_staff',
    'members',
    'membership_plans',
    'memberships',
    'payments',
    'attendance',
    'expenses',
    'notifications',
    'gym_subscriptions',
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-display text-xl font-semibold text-white">Workspace Settings</h2>
        <p className="mt-1 text-xs text-slate-400">
          Gym configuration, SaaS subscription summary, and Supabase database integration readiness.
        </p>
      </div>

      {currentUser?.role === 'GYM_OWNER' && activeGym && (
        <form
          onSubmit={handleSave}
          className="bg-[#111827] border border-white/[0.08] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-white">Gym Profile</h3>
              <p className="text-xs text-slate-400">Appears on member receipts and portal headers.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {activeGym.saasPlan} · {formatCurrency(activeGym.saasMonthlyFee)}/mo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Gym Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Studio Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D1320] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-emerald-400">
              {savedMsg ? 'Workspace profile updated.' : ''}
            </span>
            <Button type="submit">Save Workspace Settings</Button>
          </div>
        </form>
      )}

      {/* Supabase Integration Readiness Panel */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-display font-semibold text-white">
                Supabase & PostgreSQL Integration Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Multi-tenant RLS schema prepared for live Supabase Auth and PostgreSQL cutover.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-400 whitespace-nowrap">
            {readiness.mode === 'supabase_connected' ? 'Connected' : 'Prototype Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3.5 rounded-lg bg-[#0D1320] border border-white/[0.06]">
            <p className="text-slate-400">Client Environment Status</p>
            <p className="mt-1 font-mono text-slate-200">{readiness.urlPreview}</p>
            <p className="mt-1.5 text-slate-400">
              Configure <span className="font-mono text-slate-300">VITE_SUPABASE_URL</span> and{' '}
              <span className="font-mono text-slate-300">VITE_SUPABASE_ANON_KEY</span>. Service-role keys remain server-only.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0D1320] border border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>11 RLS-Protected Tables Defined</span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-slate-400 leading-relaxed">
              {schemaTables.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
