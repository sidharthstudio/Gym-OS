import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useGymOs } from '../../context/GymOsContext';
import type { NavModule } from '../../types/gym';
import { Avatar } from '../ui/Avatar';

interface NavItem {
  id: NavModule;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const GYM_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'members', label: 'Members', Icon: Users },
  { id: 'memberships', label: 'Memberships', Icon: CreditCard },
  { id: 'payments', label: 'Payments', Icon: Wallet },
  { id: 'attendance', label: 'Attendance', Icon: CalendarCheck },
  { id: 'staff', label: 'Staff', Icon: UserCheck },
  { id: 'reports', label: 'Reports', Icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { id: 'super_admin', label: 'Platform Overview', Icon: ShieldAlert },
  { id: 'settings', label: 'Platform Config', Icon: Settings },
];

const MEMBER_NAV: NavItem[] = [
  { id: 'member_portal', label: 'My Membership', Icon: Users },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  GYM_OWNER: 'Gym Owner',
  RECEPTIONIST: 'Receptionist',
  GYM_MEMBER: 'Gym Member',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    activeGym,
    activeNav,
    setActiveNav,
    canAccessModule,
    tenantNotifications,
    logout,
    resetDemoData,
  } = useGymOs();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const navItems =
    currentUser.role === 'SUPER_ADMIN'
      ? SUPER_ADMIN_NAV
      : currentUser.role === 'GYM_MEMBER'
        ? MEMBER_NAV
        : GYM_NAV_ITEMS.filter((item) => canAccessModule(item.id));

  const unreadCount = tenantNotifications.filter((n) => !n.isRead).length;
  const activeNavTitle =
    navItems.find((item) => item.id === activeNav)?.label ?? 'Workspace';

  const handleSelectNav = (id: NavModule) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D1320] border-r border-white/[0.08]">
      {/* Brand Block */}
      <div className="px-5 py-5 border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            GYM OS
          </span>
          <span className="text-[11px] font-mono text-slate-400">SaaS</span>
        </div>
        <p className="mt-1 text-xs text-slate-400 truncate">
          {currentUser.role === 'SUPER_ADMIN'
            ? 'Platform Administration'
            : activeGym
              ? `${activeGym.name} · ${activeGym.city}`
              : 'Workspace'}
        </p>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary navigation">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectNav(id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#17233B] text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{label}</span>
              </span>
              {id === 'notifications' && unreadCount > 0 && (
                <span className="font-mono text-xs tabular-nums text-amber-400">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Prototype Indicator & User Profile */}
      <div className="p-3 border-t border-white/[0.08] space-y-3">
        <div className="px-3 py-2 rounded-lg bg-[#111827] border border-white/[0.06] flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 truncate">
            Prototype · Demo Data
          </span>
          <button
            type="button"
            onClick={resetDemoData}
            title="Reset prototype demonstration dataset"
            className="text-[11px] text-slate-300 hover:text-emerald-400 inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={currentUser.fullName} src={currentUser.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser.fullName}</p>
              <p className="text-[11px] text-slate-400 truncate">
                {ROLE_LABELS[currentUser.role]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-black/70 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-72 max-w-[85vw] h-full relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left — Single-line context & Sign Out / Switch on right */}
        <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 lg:px-8 bg-[#090D16]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                {currentUser.role === 'SUPER_ADMIN'
                  ? 'GYM OS Platform'
                  : activeGym?.name ?? 'Workspace'}
              </span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-white truncate">
                {activeNavTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {activeGym && currentUser.role !== 'SUPER_ADMIN' && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeGym.saasPlan} Plan</span>
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/[0.05] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Switch Account
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
