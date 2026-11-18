/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppShell } from './components/layout/AppShell';
import { GymOsProvider, useGymOs } from './context/GymOsContext';
import { AttendancePage } from './pages/AttendancePage';
import { DashboardPage } from './pages/DashboardPage';
import { MemberPortalPage } from './pages/MemberPortalPage';
import { MembersPage } from './pages/MembersPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffPage } from './pages/StaffPage';
import { SuperAdminPage } from './pages/SuperAdminPage';

function GymOsRouter() {
  const { currentUser, activeNav, canAccessModule } = useGymOs();

  if (!currentUser) {
    return <AuthScreen />;
  }

  const renderModule = () => {
    if (!canAccessModule(activeNav)) {
      return (
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-8 text-center">
          <h2 className="font-display text-base font-semibold text-white">Access Restricted</h2>
          <p className="mt-1 text-xs text-slate-400">
            Your role does not have permission to access this module.
          </p>
        </div>
      );
    }

    switch (activeNav) {
      case 'dashboard':
        return <DashboardPage />;
      case 'members':
        return <MembersPage />;
      case 'memberships':
        return <MembershipsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'staff':
        return <StaffPage />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'super_admin':
        return <SuperAdminPage />;
      case 'member_portal':
        return <MemberPortalPage />;
    }
  };

  return <AppShell>{renderModule()}</AppShell>;
}

export default function App() {
  return (
    <GymOsProvider>
      <GymOsRouter />
    </GymOsProvider>
  );
}
