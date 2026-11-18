import React, { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { DEMO_AVATARS } from '../../data/demoData';
import { useGymOs } from '../../context/GymOsContext';
import type { BillingCycle, SaasPlanTier } from '../../types/gym';
import { Button } from '../ui/Button';

type AuthMode = 'signin' | 'register_gym' | 'forgot';

export function AuthScreen() {
  const { loginWithEmail, loginAsDemoUser, registerGymWorkspace } = useGymOs();
  const [mode, setMode] = useState<AuthMode>('signin');

  // Sign in state
  const [email, setEmail] = useState('rohan@ironvault.fit');
  const [password, setPassword] = useState('••••••••••••');
  const [authError, setAuthError] = useState<string | null>(null);

  // Register Gym Workspace state
  const [gymName, setGymName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [saasPlan, setSaasPlan] = useState<SaasPlanTier>('Pro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');

  // Forgot password feedback
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = loginWithEmail(email);
    if (!res.ok) setAuthError(res.error || 'Sign in failed.');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!gymName.trim() || !city.trim() || !ownerName.trim() || !ownerEmail.trim() || !phone.trim()) {
      setAuthError('Please complete all workspace and owner fields.');
      return;
    }
    const res = registerGymWorkspace({
      gymName,
      city,
      phone,
      ownerName,
      ownerEmail,
      saasPlan,
      billingCycle,
    });
    if (!res.ok) setAuthError(res.error || 'Could not register workspace.');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Brand Column */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-white/[0.08]">
        <img
          src={DEMO_AVATARS.backdrop}
          alt="Modern strength training club interior"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/80 to-[#090D16]/60" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              GYM OS
            </span>
          </div>
          <span className="text-xs text-slate-300 font-mono">Multi-Tenant SaaS Platform</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-medium text-emerald-400 tracking-wide">
            Run Your Gym. Smarter.
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white leading-tight [text-wrap:balance]">
            Commercial operations software built for independent gyms and athletic clubs.
          </h1>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-lg">
            Isolate every gym workspace, track partial and full fee installments without overwriting ledger entries, enforce staff permissions, and give members a clean self-service portal.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-6 pt-6 border-t border-white/15">
            <div>
              <p className="text-xs text-slate-400">Tenant Isolation</p>
              <p className="mt-1 text-sm font-semibold text-white">Row-Level Gym IDs</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Payment Ledger</p>
              <p className="mt-1 text-sm font-semibold text-white">Append-Only Receipts</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Access Control</p>
              <p className="mt-1 text-sm font-semibold text-white">4 Distinct User Roles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication & Prototype Switcher Column */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8">
            <span className="font-display text-xl font-bold text-white">GYM OS</span>
            <p className="text-xs text-emerald-400 mt-1">Run Your Gym. Smarter.</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#111827] border border-white/[0.08] rounded-lg mb-7">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setAuthError(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#1D2842] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register_gym');
                setAuthError(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'register_gym'
                  ? 'bg-[#1D2842] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Gym
            </button>
          </div>

          {mode === 'signin' && (
            <>
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">
                  Sign in to your workspace
                </h2>
                <p className="mt-1.5 text-xs text-slate-400">
                  Access your gym operations, member portal, or Super Admin console.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Work or Member Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourgym.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#111827] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setResetSent(false);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#111827] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                    {authError}
                  </p>
                )}

                <Button type="submit" className="w-full">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Quick Demonstration Access */}
              <div className="mt-8 pt-6 border-t border-white/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-300">
                    Prototype Quick Access (Demo Accounts)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Demo Data</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('usr-owner-iv')}
                    className="p-3 text-left rounded-lg bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#151F33] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Gym Owner</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 truncate">
                      IronVault · Rohan Deshmukh
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('usr-staff-iv')}
                    className="p-3 text-left rounded-lg bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#151F33] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>Receptionist</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 truncate">
                      IronVault · Meera Nair
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('usr-member-iv-1')}
                    className="p-3 text-left rounded-lg bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#151F33] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Gym Member</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 truncate">
                      Self-Service · Aarav Mehta
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('usr-super-admin')}
                    className="p-3 text-left rounded-lg bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#151F33] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>Super Admin</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 truncate">
                      Platform Console · 3 Gyms
                    </p>
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  Tip: You can also sign in as <span className="font-mono text-slate-400">kabir@apexconditioning.in</span> to verify strict multi-tenant data isolation for Apex Conditioning Studio.
                </p>
              </div>
            </>
          )}

          {mode === 'register_gym' && (
            <>
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">
                  Create a new gym workspace
                </h2>
                <p className="mt-1.5 text-xs text-slate-400">
                  Provisions an isolated multi-tenant gym account with your owner profile.
                </p>
              </div>

              <form onSubmit={handleRegister} className="mt-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Gym / Studio Name
                    </label>
                    <input
                      type="text"
                      required
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="Barbell House"
                      className="w-full px-3 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Pune"
                      className="w-full px-3 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Owner Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Aditi Kulkarni"
                      className="w-full px-3 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98220 00112"
                      className="w-full px-3 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="aditi@barbellhouse.in"
                    className="w-full px-3 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SaaS Plan
                    </label>
                    <select
                      value={saasPlan}
                      onChange={(e) => setSaasPlan(e.target.value as SaasPlanTier)}
                      className="w-full px-3 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Starter">Starter (₹2,499/mo)</option>
                      <option value="Pro">Pro (₹4,999/mo)</option>
                      <option value="Enterprise">Enterprise (₹8,999/mo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                      className="w-full px-3 py-2 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="annual">Annual (2 mos free)</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {authError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                    {authError}
                  </p>
                )}

                <Button type="submit" className="w-full mt-2">
                  <span>Create Gym Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <KeyRound className="w-5 h-5" />
                <h2 className="font-display text-xl font-semibold text-white">Reset password</h2>
              </div>
              <p className="text-xs text-slate-400">
                In production with Supabase Auth, this sends a secure magic recovery link to your registered email.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111827] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              {resetSent && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
                  Prototype notice: Password reset flow simulated for {email}.
                </p>
              )}
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setMode('signin')}>
                  Back to Sign In
                </Button>
                <Button onClick={() => setResetSent(true)}>Send Reset Link</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
