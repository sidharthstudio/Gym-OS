import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_ATTENDANCE,
  INITIAL_GYMS,
  INITIAL_MEMBERS,
  INITIAL_MEMBERSHIPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENTS,
  INITIAL_PLANS,
  INITIAL_SAAS_SUBSCRIPTIONS,
  INITIAL_STAFF,
  INITIAL_USERS,
} from '../data/demoData';
import type {
  AttendanceRecord,
  BillingCycle,
  EnrichedMember,
  Gym,
  GymStaff,
  GymSubscription,
  Member,
  Membership,
  MembershipPlan,
  NavModule,
  NotificationItem,
  Payment,
  PaymentMethod,
  SaasPlanTier,
  User,
  UserRole,
} from '../types/gym';
import {
  APP_REFERENCE_DATE,
  addDaysToDate,
  calculateMembershipFinancials,
  calculateMembershipStatus,
} from '../utils/formatters';

interface PersistedState {
  gyms: Gym[];
  users: User[];
  staff: GymStaff[];
  plans: MembershipPlan[];
  members: Member[];
  memberships: Membership[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  notifications: NotificationItem[];
  subscriptions: GymSubscription[];
  currentUserId: string | null;
  activeGymId: string | null;
}

const STORAGE_KEY = 'gymos_prototype_state_v1';

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedState;
    }
  } catch {
    // Fallback to clean demo state if storage is unavailable
  }
  return {
    gyms: INITIAL_GYMS,
    users: INITIAL_USERS,
    staff: INITIAL_STAFF,
    plans: INITIAL_PLANS,
    members: INITIAL_MEMBERS,
    memberships: INITIAL_MEMBERSHIPS,
    payments: INITIAL_PAYMENTS,
    attendance: INITIAL_ATTENDANCE,
    notifications: INITIAL_NOTIFICATIONS,
    subscriptions: INITIAL_SAAS_SUBSCRIPTIONS,
    currentUserId: null,
    activeGymId: 'gym-ironvault',
  };
}

export interface AddMemberInput {
  fullName: string;
  phone: string;
  email: string;
  gender?: Member['gender'];
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  planId: string;
  startDate: string;
  initialPaymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentNotes?: string;
}

export interface UpdateMemberInput {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  gender?: Member['gender'];
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  accountStatus: 'active' | 'inactive';
}

export interface RecordPaymentInput {
  memberId: string;
  membershipId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface RegisterGymInput {
  gymName: string;
  city: string;
  phone: string;
  ownerName: string;
  ownerEmail: string;
  saasPlan: SaasPlanTier;
  billingCycle: BillingCycle;
}

interface GymOsContextValue {
  currentUser: User | null;
  activeGym: Gym | null;
  activeNav: NavModule;
  setActiveNav: (nav: NavModule) => void;
  // Tenant-isolated read selectors
  gyms: Gym[];
  subscriptions: GymSubscription[];
  tenantMembers: EnrichedMember[];
  tenantPlans: MembershipPlan[];
  tenantMemberships: Membership[];
  tenantPayments: Payment[];
  tenantAttendance: AttendanceRecord[];
  tenantStaff: GymStaff[];
  tenantNotifications: NotificationItem[];
  // Auth & RBAC
  loginWithEmail: (email: string) => { ok: boolean; error?: string };
  loginAsDemoUser: (userId: string) => void;
  registerGymWorkspace: (input: RegisterGymInput) => { ok: boolean; error?: string };
  logout: () => void;
  switchSuperAdminGymPreview: (gymId: string) => void;
  canAccessModule: (module: NavModule) => boolean;
  canViewOwnerFinancials: boolean;
  // Mutations (all enforce gymId + RBAC guard)
  addMember: (input: AddMemberInput) => { ok: boolean; error?: string };
  updateMember: (input: UpdateMemberInput) => { ok: boolean; error?: string };
  savePlan: (
    plan: Omit<MembershipPlan, 'id' | 'gymId' | 'createdAt' | 'updatedAt' | 'isDemoData'> & {
      id?: string;
    }
  ) => { ok: boolean; error?: string };
  archivePlan: (planId: string) => { ok: boolean; error?: string };
  renewOrChangeMembership: (params: {
    memberId: string;
    planId: string;
    startDate: string;
    mode: 'renew' | 'change_plan';
    notes?: string;
  }) => { ok: boolean; error?: string };
  extendMembershipDays: (membershipId: string, extraDays: number, reason: string) => { ok: boolean; error?: string };
  recordPayment: (input: RecordPaymentInput) => { ok: boolean; payment?: Payment; error?: string };
  checkInMember: (memberId: string, method?: AttendanceRecord['method']) => { ok: boolean; error?: string };
  addStaffMember: (input: {
    fullName: string;
    email: string;
    phone: string;
    role: 'GYM_OWNER' | 'RECEPTIONIST';
    shiftLabel: string;
  }) => { ok: boolean; error?: string };
  toggleStaffActive: (staffId: string) => void;
  markNotificationRead: (id: string) => void;
  approveRenewalRequest: (notificationId: string) => void;
  submitMemberRenewalRequest: (planId: string, note?: string) => { ok: boolean; error?: string };
  toggleGymSuspension: (gymId: string) => { ok: boolean; error?: string };
  updateActiveGymSettings: (updates: Partial<Pick<Gym, 'name' | 'city' | 'address' | 'phone' | 'email'>>) => void;
  resetDemoData: () => void;
}

const GymOsContext = createContext<GymOsContextValue | null>(null);

const ROLE_MODULES: Record<UserRole, NavModule[]> = {
  SUPER_ADMIN: ['super_admin', 'settings'],
  GYM_OWNER: [
    'dashboard',
    'members',
    'memberships',
    'payments',
    'attendance',
    'staff',
    'reports',
    'notifications',
    'settings',
  ],
  RECEPTIONIST: [
    'dashboard',
    'members',
    'memberships',
    'payments',
    'attendance',
    'notifications',
  ],
  GYM_MEMBER: ['member_portal'],
};

function defaultNavForRole(role: UserRole): NavModule {
  if (role === 'SUPER_ADMIN') return 'super_admin';
  if (role === 'GYM_MEMBER') return 'member_portal';
  return 'dashboard';
}

export function GymOsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeNav, setActiveNavState] = useState<NavModule>(() => {
    const initial = loadInitialState();
    const user = initial.users.find((u) => u.id === initial.currentUserId);
    return user ? defaultNavForRole(user.role) : 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const activeGym = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'SUPER_ADMIN') {
      return state.gyms.find((g) => g.id === state.activeGymId) ?? null;
    }
    return state.gyms.find((g) => g.id === currentUser.gymId) ?? null;
  }, [currentUser, state.gyms, state.activeGymId]);

  const effectiveGymId = currentUser?.role === 'SUPER_ADMIN' ? null : currentUser?.gymId ?? null;

  const canAccessModule = (module: NavModule): boolean => {
    if (!currentUser) return false;
    return ROLE_MODULES[currentUser.role].includes(module);
  };

  const setActiveNav = (nav: NavModule) => {
    if (!currentUser) return;
    if (ROLE_MODULES[currentUser.role].includes(nav)) {
      setActiveNavState(nav);
    }
  };

  const canViewOwnerFinancials =
    currentUser?.role === 'GYM_OWNER' || currentUser?.role === 'SUPER_ADMIN';

  // Strict multi-tenant isolation selectors (simulate backend RLS using gymId)
  const tenantPlans = useMemo(() => {
    if (!effectiveGymId) return [];
    return state.plans.filter((p) => p.gymId === effectiveGymId);
  }, [state.plans, effectiveGymId]);

  const tenantMemberships = useMemo(() => {
    if (!effectiveGymId) return [];
    return state.memberships.filter((ms) => ms.gymId === effectiveGymId);
  }, [state.memberships, effectiveGymId]);

  const tenantPayments = useMemo(() => {
    if (!effectiveGymId) return [];
    const base = state.payments.filter((p) => p.gymId === effectiveGymId);
    if (currentUser?.role === 'GYM_MEMBER' && currentUser.memberId) {
      return base.filter((p) => p.memberId === currentUser.memberId);
    }
    return base.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  }, [state.payments, effectiveGymId, currentUser]);

  const tenantAttendance = useMemo(() => {
    if (!effectiveGymId) return [];
    const base = state.attendance.filter((a) => a.gymId === effectiveGymId);
    if (currentUser?.role === 'GYM_MEMBER' && currentUser.memberId) {
      return base
        .filter((a) => a.memberId === currentUser.memberId)
        .sort((a, b) => b.checkInAt.localeCompare(a.checkInAt));
    }
    return base.sort((a, b) => b.checkInAt.localeCompare(a.checkInAt));
  }, [state.attendance, effectiveGymId, currentUser]);

  const tenantStaff = useMemo(() => {
    if (!effectiveGymId || currentUser?.role !== 'GYM_OWNER') return [];
    return state.staff.filter((s) => s.gymId === effectiveGymId);
  }, [state.staff, effectiveGymId, currentUser]);

  const tenantNotifications = useMemo(() => {
    if (!effectiveGymId) return [];
    return state.notifications
      .filter((n) => n.gymId === effectiveGymId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.notifications, effectiveGymId]);

  const tenantMembers: EnrichedMember[] = useMemo(() => {
    if (!effectiveGymId) return [];
    const rawMembers = state.members.filter((m) => {
      if (m.gymId !== effectiveGymId) return false;
      if (currentUser?.role === 'GYM_MEMBER' && currentUser.memberId) {
        return m.id === currentUser.memberId;
      }
      return true;
    });

    return rawMembers.map((member) => {
      const currentMembership =
        state.memberships.find(
          (ms) => ms.gymId === effectiveGymId && ms.memberId === member.id && ms.isCurrent
        ) ?? null;

      const memberPayments = state.payments.filter(
        (p) => p.gymId === effectiveGymId && p.memberId === member.id
      );

      const { totalFee, totalPaid, outstandingBalance } = calculateMembershipFinancials(
        currentMembership,
        memberPayments
      );
      const { status, daysRemaining } = calculateMembershipStatus(
        member.accountStatus,
        currentMembership,
        memberPayments,
        APP_REFERENCE_DATE
      );

      const lastAtt = state.attendance
        .filter((a) => a.gymId === effectiveGymId && a.memberId === member.id)
        .sort((a, b) => b.checkInAt.localeCompare(a.checkInAt))[0];

      return {
        ...member,
        currentMembership,
        computedStatus: status,
        totalFee,
        totalPaid,
        outstandingBalance,
        daysRemaining,
        lastCheckInAt: lastAtt ? lastAtt.checkInAt : null,
      };
    });
  }, [state.members, state.memberships, state.payments, state.attendance, effectiveGymId, currentUser]);

  const loginWithEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    const matched = state.users.find((u) => u.email.toLowerCase() === clean);
    if (!matched) {
      return {
        ok: false,
        error: 'No account found for that email. Try one of the quick demonstration logins below.',
      };
    }
    if (!matched.isActive) {
      return { ok: false, error: 'This user account has been deactivated by the gym owner.' };
    }
    if (matched.gymId) {
      const gym = state.gyms.find((g) => g.id === matched.gymId);
      if (gym?.accountStatus === 'suspended') {
        return {
          ok: false,
          error: `${gym.name} workspace is currently suspended. Contact GYM OS platform support.`,
        };
      }
    }
    setState((prev) => ({
      ...prev,
      currentUserId: matched.id,
      activeGymId: matched.gymId ?? prev.activeGymId,
    }));
    setActiveNavState(defaultNavForRole(matched.role));
    return { ok: true };
  };

  const loginAsDemoUser = (userId: string) => {
    const matched = state.users.find((u) => u.id === userId);
    if (!matched) return;
    setState((prev) => ({
      ...prev,
      currentUserId: matched.id,
      activeGymId: matched.gymId ?? prev.activeGymId,
    }));
    setActiveNavState(defaultNavForRole(matched.role));
  };

  const registerGymWorkspace = (input: RegisterGymInput) => {
    const emailClean = input.ownerEmail.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === emailClean)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const now = new Date().toISOString();
    const gymId = `gym-${Date.now()}`;
    const userId = `usr-${Date.now()}`;
    const staffId = `stf-${Date.now()}`;
    const slug = input.gymName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const feeMap: Record<SaasPlanTier, number> = {
      Starter: 2499,
      Pro: 4999,
      Enterprise: 8999,
    };

    const newGym: Gym = {
      id: gymId,
      name: input.gymName.trim(),
      slug: slug || gymId,
      city: input.city.trim(),
      address: `${input.city.trim()} Studio`,
      phone: input.phone.trim(),
      email: emailClean,
      ownerUserId: userId,
      currency: 'INR',
      accountStatus: 'active',
      saasPlan: input.saasPlan,
      billingCycle: input.billingCycle,
      saasMonthlyFee: feeMap[input.saasPlan],
      createdAt: now,
      updatedAt: now,
      isDemoData: false,
    };

    const newUser: User = {
      id: userId,
      email: emailClean,
      fullName: input.ownerName.trim(),
      role: 'GYM_OWNER',
      gymId,
      phone: input.phone.trim(),
      isActive: true,
      createdAt: now,
    };

    const newStaff: GymStaff = {
      id: staffId,
      gymId,
      userId,
      fullName: input.ownerName.trim(),
      email: emailClean,
      phone: input.phone.trim(),
      role: 'GYM_OWNER',
      shiftLabel: 'All Access',
      isActive: true,
      joinedAt: now.slice(0, 10),
      isDemoData: false,
    };

    const defaultPlan: MembershipPlan = {
      id: `pln-${Date.now()}`,
      gymId,
      name: 'Standard Monthly',
      category: 'Monthly',
      durationDays: 30,
      price: 2500,
      description: 'Default 30-day gym floor access plan.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      isDemoData: false,
    };

    const newSub: GymSubscription = {
      id: `sub-${Date.now()}`,
      gymId,
      planTier: input.saasPlan,
      billingCycle: input.billingCycle,
      amount: input.billingCycle === 'annual' ? feeMap[input.saasPlan] * 10 : feeMap[input.saasPlan],
      status: 'active',
      currentPeriodStart: APP_REFERENCE_DATE,
      currentPeriodEnd: addDaysToDate(APP_REFERENCE_DATE, input.billingCycle === 'annual' ? 365 : 30),
      isDemoData: false,
    };

    setState((prev) => ({
      ...prev,
      gyms: [...prev.gyms, newGym],
      users: [...prev.users, newUser],
      staff: [...prev.staff, newStaff],
      plans: [...prev.plans, defaultPlan],
      subscriptions: [...prev.subscriptions, newSub],
      currentUserId: userId,
      activeGymId: gymId,
    }));
    setActiveNavState('dashboard');
    return { ok: true };
  };

  const logout = () => {
    setState((prev) => ({ ...prev, currentUserId: null }));
  };

  const switchSuperAdminGymPreview = (gymId: string) => {
    setState((prev) => ({ ...prev, activeGymId: gymId }));
  };

  const addMember = (input: AddMemberInput) => {
    if (!currentUser || !effectiveGymId) return { ok: false, error: 'Unauthorized' };
    if (currentUser.role !== 'GYM_OWNER' && currentUser.role !== 'RECEPTIONIST') {
      return { ok: false, error: 'Only owners or receptionists can register members.' };
    }
    const plan = state.plans.find((p) => p.id === input.planId && p.gymId === effectiveGymId);
    if (!plan) return { ok: false, error: 'Selected membership plan not found for this gym.' };

    if (input.initialPaymentAmount < 0 || input.initialPaymentAmount > plan.price) {
      return { ok: false, error: 'Initial payment must be between ₹0 and the plan fee.' };
    }

    const now = new Date().toISOString();
    const memberId = `mem-${Date.now()}`;
    const membershipId = `mship-${Date.now()}`;
    const existingCount = state.members.filter((m) => m.gymId === effectiveGymId).length;
    const prefix = (activeGym?.name.slice(0, 2) || 'GM').toUpperCase();
    const memberCode = `${prefix}-${1041 + existingCount}`;

    const newMember: Member = {
      id: memberId,
      gymId: effectiveGymId,
      memberCode,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      gender: input.gender,
      dateOfBirth: input.dateOfBirth || undefined,
      address: input.address?.trim() || undefined,
      emergencyContact: input.emergencyContact?.trim() || undefined,
      joiningDate: input.startDate,
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
      isDemoData: false,
    };

    const newMembership: Membership = {
      id: membershipId,
      gymId: effectiveGymId,
      memberId,
      planId: plan.id,
      planNameSnapshot: plan.name,
      startDate: input.startDate,
      expiryDate: addDaysToDate(input.startDate, plan.durationDays),
      totalFee: plan.price,
      isCurrent: true,
      createdAt: now,
      updatedAt: now,
      isDemoData: false,
    };

    const newPayments: Payment[] = [];
    if (input.initialPaymentAmount > 0) {
      newPayments.push({
        id: `pay-${Date.now()}`,
        gymId: effectiveGymId,
        memberId,
        membershipId,
        receiptNumber: `${prefix}-RCPT-${Math.floor(1000 + Math.random() * 9000)}`,
        amountPaid: input.initialPaymentAmount,
        paymentDate: now,
        paymentMethod: input.paymentMethod,
        verificationSource:
          input.paymentMethod === 'verified_gateway' ? 'verified_payment_gateway' : 'manual_entry',
        recordedByUserId: currentUser.id,
        recordedByName: currentUser.fullName,
        transactionStatus: 'completed',
        notes: input.paymentNotes?.trim() || 'Initial registration payment',
        createdAt: now,
        isDemoData: false,
      });
    }

    setState((prev) => ({
      ...prev,
      members: [newMember, ...prev.members],
      memberships: [newMembership, ...prev.memberships],
      payments: [...newPayments, ...prev.payments],
    }));

    return { ok: true };
  };

  const updateMember = (input: UpdateMemberInput) => {
    if (!currentUser || !effectiveGymId) return { ok: false, error: 'Unauthorized' };
    if (currentUser.role !== 'GYM_OWNER' && currentUser.role !== 'RECEPTIONIST') {
      return { ok: false, error: 'Permission denied.' };
    }
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === input.id && m.gymId === effectiveGymId
          ? {
              ...m,
              fullName: input.fullName.trim(),
              phone: input.phone.trim(),
              email: input.email.trim(),
              gender: input.gender,
              dateOfBirth: input.dateOfBirth || undefined,
              address: input.address?.trim() || undefined,
              emergencyContact: input.emergencyContact?.trim() || undefined,
              accountStatus: input.accountStatus,
              updatedAt: now,
            }
          : m
      ),
    }));
    return { ok: true };
  };

  const savePlan = (
    planInput: Omit<MembershipPlan, 'id' | 'gymId' | 'createdAt' | 'updatedAt' | 'isDemoData'> & {
      id?: string;
    }
  ) => {
    if (!currentUser || !effectiveGymId || currentUser.role !== 'GYM_OWNER') {
      return { ok: false, error: 'Only Gym Owners can create or modify membership plans.' };
    }
    const now = new Date().toISOString();
    if (planInput.id) {
      setState((prev) => ({
        ...prev,
        plans: prev.plans.map((p) =>
          p.id === planInput.id && p.gymId === effectiveGymId
            ? {
                ...p,
                name: planInput.name.trim(),
                category: planInput.category,
                durationDays: planInput.durationDays,
                price: planInput.price,
                description: planInput.description.trim(),
                status: planInput.status,
                updatedAt: now,
                isDemoData: false,
              }
            : p
        ),
      }));
    } else {
      const newPlan: MembershipPlan = {
        id: `pln-${Date.now()}`,
        gymId: effectiveGymId,
        name: planInput.name.trim(),
        category: planInput.category,
        durationDays: planInput.durationDays,
        price: planInput.price,
        description: planInput.description.trim(),
        status: planInput.status,
        createdAt: now,
        updatedAt: now,
        isDemoData: false,
      };
      setState((prev) => ({ ...prev, plans: [newPlan, ...prev.plans] }));
    }
    return { ok: true };
  };

  const archivePlan = (planId: string) => {
    if (!currentUser || !effectiveGymId || currentUser.role !== 'GYM_OWNER') {
      return { ok: false, error: 'Only Gym Owners can archive plans.' };
    }
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) =>
        p.id === planId && p.gymId === effectiveGymId
          ? { ...p, status: p.status === 'active' ? 'archived' : 'active', updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    return { ok: true };
  };

  const renewOrChangeMembership = (params: {
    memberId: string;
    planId: string;
    startDate: string;
    mode: 'renew' | 'change_plan';
    notes?: string;
  }) => {
    if (!currentUser || !effectiveGymId) return { ok: false, error: 'Unauthorized' };
    if (currentUser.role !== 'GYM_OWNER' && currentUser.role !== 'RECEPTIONIST') {
      return { ok: false, error: 'Insufficient permissions.' };
    }
    const plan = state.plans.find((p) => p.id === params.planId && p.gymId === effectiveGymId);
    if (!plan) return { ok: false, error: 'Plan not found in this gym.' };

    const now = new Date().toISOString();
    const newMembership: Membership = {
      id: `mship-${Date.now()}`,
      gymId: effectiveGymId,
      memberId: params.memberId,
      planId: plan.id,
      planNameSnapshot: plan.name,
      startDate: params.startDate,
      expiryDate: addDaysToDate(params.startDate, plan.durationDays),
      totalFee: plan.price,
      isCurrent: true,
      notes:
        params.notes?.trim() ||
        (params.mode === 'renew' ? 'Membership renewed' : `Plan changed to ${plan.name}`),
      createdAt: now,
      updatedAt: now,
      isDemoData: false,
    };

    setState((prev) => ({
      ...prev,
      memberships: [
        newMembership,
        ...prev.memberships.map((ms) =>
          ms.memberId === params.memberId && ms.gymId === effectiveGymId
            ? { ...ms, isCurrent: false, updatedAt: now }
            : ms
        ),
      ],
      members: prev.members.map((m) =>
        m.id === params.memberId && m.gymId === effectiveGymId
          ? { ...m, accountStatus: 'active', updatedAt: now }
          : m
      ),
    }));
    return { ok: true };
  };

  const extendMembershipDays = (membershipId: string, extraDays: number, reason: string) => {
    if (!currentUser || !effectiveGymId) return { ok: false, error: 'Unauthorized' };
    if (currentUser.role !== 'GYM_OWNER' && currentUser.role !== 'RECEPTIONIST') {
      return { ok: false, error: 'Insufficient permissions.' };
    }
    if (extraDays <= 0) return { ok: false, error: 'Extension days must be greater than 0.' };

    setState((prev) => ({
      ...prev,
      memberships: prev.memberships.map((ms) =>
        ms.id === membershipId && ms.gymId === effectiveGymId
          ? {
              ...ms,
              expiryDate: addDaysToDate(ms.expiryDate, extraDays),
              notes: reason ? `Extended +${extraDays}d: ${reason}` : ms.notes,
              updatedAt: new Date().toISOString(),
            }
          : ms
      ),
    }));
    return { ok: true };
  };

  const recordPayment = (input: RecordPaymentInput) => {
    if (!currentUser || !effectiveGymId) return { ok: false, error: 'Unauthorized' };
    if (currentUser.role !== 'GYM_OWNER' && currentUser.role !== 'RECEPTIONIST') {
      return { ok: false, error: 'Insufficient permissions.' };
    }
    const membership = state.memberships.find(
      (ms) => ms.id === input.membershipId && ms.gymId === effectiveGymId
    );
    if (!membership) return { ok: false, error: 'Membership record not found.' };

    const { outstandingBalance } = calculateMembershipFinancials(
      membership,
      state.payments.filter((p) => p.gymId === effectiveGymId)
    );

    if (input.amountPaid <= 0) {
      return { ok: false, error: 'Payment amount must be greater than ₹0.' };
    }
    if (input.amountPaid > outstandingBalance) {
      return {
        ok: false,
        error: `Amount exceeds remaining balance of ₹${outstandingBalance.toLocaleString('en-IN')}.`,
      };
    }

    const now = new Date().toISOString();
    const prefix = (activeGym?.name.slice(0, 2) || 'GM').toUpperCase();
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      gymId: effectiveGymId,
      memberId: input.memberId,
      membershipId: input.membershipId,
      receiptNumber: `${prefix}-RCPT-${Math.floor(1000 + Math.random() * 9000)}`,
      amountPaid: input.amountPaid,
      paymentDate: now,
      paymentMethod: input.paymentMethod,
      verificationSource:
        input.paymentMethod === 'verified_gateway' ? 'verified_payment_gateway' : 'manual_entry',
      recordedByUserId: currentUser.id,
      recordedByName: currentUser.fullName,
      transactionStatus: 'completed',
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      isDemoData: false,
    };

    // Append-only transaction insert — never overwrite previous payment records
    setState((prev) => ({
      ...prev,
      payments: [newPayment, ...prev.payments],
    }));

    return { ok: true, payment: newPayment };
  };

  const checkInMember = (memberId: string, method: AttendanceRecord['method'] = 'front_desk') => {
    if (!currentUser || !effectiveGymId) return { ok: false, error: 'Unauthorized' };
    if (currentUser.role !== 'GYM_OWNER' && currentUser.role !== 'RECEPTIONIST') {
      return { ok: false, error: 'Only gym staff can log member check-ins.' };
    }
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      gymId: effectiveGymId,
      memberId,
      checkInAt: new Date().toISOString(),
      method,
      recordedByName: currentUser.fullName,
      isDemoData: false,
    };
    setState((prev) => ({
      ...prev,
      attendance: [newRecord, ...prev.attendance],
    }));
    return { ok: true };
  };

  const addStaffMember = (input: {
    fullName: string;
    email: string;
    phone: string;
    role: 'GYM_OWNER' | 'RECEPTIONIST';
    shiftLabel: string;
  }) => {
    if (!currentUser || !effectiveGymId || currentUser.role !== 'GYM_OWNER') {
      return { ok: false, error: 'Only Gym Owners can manage staff accounts.' };
    }
    const cleanEmail = input.email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { ok: false, error: 'A user with this email already exists.' };
    }
    const now = new Date().toISOString();
    const userId = `usr-${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: cleanEmail,
      fullName: input.fullName.trim(),
      role: input.role,
      gymId: effectiveGymId,
      phone: input.phone.trim(),
      isActive: true,
      createdAt: now,
    };
    const newStaff: GymStaff = {
      id: `stf-${Date.now()}`,
      gymId: effectiveGymId,
      userId,
      fullName: input.fullName.trim(),
      email: cleanEmail,
      phone: input.phone.trim(),
      role: input.role,
      shiftLabel: input.shiftLabel.trim(),
      isActive: true,
      joinedAt: now.slice(0, 10),
      isDemoData: false,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      staff: [...prev.staff, newStaff],
    }));
    return { ok: true };
  };

  const toggleStaffActive = (staffId: string) => {
    if (!currentUser || !effectiveGymId || currentUser.role !== 'GYM_OWNER') return;
    setState((prev) => {
      const target = prev.staff.find((s) => s.id === staffId && s.gymId === effectiveGymId);
      if (!target || target.userId === currentUser.id) return prev;
      const nextActive = !target.isActive;
      return {
        ...prev,
        staff: prev.staff.map((s) => (s.id === staffId ? { ...s, isActive: nextActive } : s)),
        users: prev.users.map((u) => (u.id === target.userId ? { ...u, isActive: nextActive } : u)),
      };
    });
  };

  const markNotificationRead = (id: string) => {
    if (!effectiveGymId) return;
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id && n.gymId === effectiveGymId ? { ...n, isRead: true } : n
      ),
    }));
  };

  const approveRenewalRequest = (notificationId: string) => {
    if (!currentUser || !effectiveGymId) return;
    const notif = state.notifications.find(
      (n) => n.id === notificationId && n.gymId === effectiveGymId
    );
    if (!notif || !notif.relatedMemberId || !notif.requestedPlanId) return;
    renewOrChangeMembership({
      memberId: notif.relatedMemberId,
      planId: notif.requestedPlanId,
      startDate: APP_REFERENCE_DATE,
      mode: 'renew',
      notes: 'Approved member portal renewal request',
    });
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId
          ? { ...n, isRead: true, actionStatus: 'approved' }
          : n
      ),
    }));
  };

  const submitMemberRenewalRequest = (planId: string, note?: string) => {
    if (!currentUser || !effectiveGymId || currentUser.role !== 'GYM_MEMBER' || !currentUser.memberId) {
      return { ok: false, error: 'Only logged-in members can submit renewal requests.' };
    }
    const plan = state.plans.find((p) => p.id === planId && p.gymId === effectiveGymId);
    if (!plan) return { ok: false, error: 'Selected plan not found.' };

    const notif: NotificationItem = {
      id: `not-${Date.now()}`,
      gymId: effectiveGymId,
      type: 'renewal_request',
      title: `Renewal request: ${currentUser.fullName}`,
      message: `${currentUser.fullName} requested renewal on ${plan.name} (₹${plan.price.toLocaleString('en-IN')}).${note ? ` Note: ${note}` : ''}`,
      relatedMemberId: currentUser.memberId,
      requestedPlanId: plan.id,
      actionStatus: 'pending',
      isRead: false,
      createdAt: new Date().toISOString(),
      isDemoData: false,
    };

    setState((prev) => ({
      ...prev,
      notifications: [notif, ...prev.notifications],
    }));
    return { ok: true };
  };

  const toggleGymSuspension = (gymId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { ok: false, error: 'Super Admin privilege required.' };
    }
    setState((prev) => ({
      ...prev,
      gyms: prev.gyms.map((g) =>
        g.id === gymId
          ? {
              ...g,
              accountStatus: g.accountStatus === 'suspended' ? 'active' : 'suspended',
              updatedAt: new Date().toISOString(),
            }
          : g
      ),
      subscriptions: prev.subscriptions.map((sub) =>
        sub.gymId === gymId
          ? { ...sub, status: sub.status === 'suspended' ? 'active' : 'suspended' }
          : sub
      ),
    }));
    return { ok: true };
  };

  const updateActiveGymSettings = (
    updates: Partial<Pick<Gym, 'name' | 'city' | 'address' | 'phone' | 'email'>>
  ) => {
    if (!currentUser || !effectiveGymId || currentUser.role !== 'GYM_OWNER') return;
    setState((prev) => ({
      ...prev,
      gyms: prev.gyms.map((g) =>
        g.id === effectiveGymId ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
      ),
    }));
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      gyms: INITIAL_GYMS,
      users: INITIAL_USERS,
      staff: INITIAL_STAFF,
      plans: INITIAL_PLANS,
      members: INITIAL_MEMBERS,
      memberships: INITIAL_MEMBERSHIPS,
      payments: INITIAL_PAYMENTS,
      attendance: INITIAL_ATTENDANCE,
      notifications: INITIAL_NOTIFICATIONS,
      subscriptions: INITIAL_SAAS_SUBSCRIPTIONS,
      currentUserId: currentUser?.id ?? null,
      activeGymId: currentUser?.gymId ?? 'gym-ironvault',
    });
  };

  return (
    <GymOsContext.Provider
      value={{
        currentUser,
        activeGym,
        activeNav,
        setActiveNav,
        gyms: state.gyms,
        subscriptions: state.subscriptions,
        tenantMembers,
        tenantPlans,
        tenantMemberships,
        tenantPayments,
        tenantAttendance,
        tenantStaff,
        tenantNotifications,
        loginWithEmail,
        loginAsDemoUser,
        registerGymWorkspace,
        logout,
        switchSuperAdminGymPreview,
        canAccessModule,
        canViewOwnerFinancials,
        addMember,
        updateMember,
        savePlan,
        archivePlan,
        renewOrChangeMembership,
        extendMembershipDays,
        recordPayment,
        checkInMember,
        addStaffMember,
        toggleStaffActive,
        markNotificationRead,
        approveRenewalRequest,
        submitMemberRenewalRequest,
        toggleGymSuspension,
        updateActiveGymSettings,
        resetDemoData,
      }}
    >
      {children}
    </GymOsContext.Provider>
  );
}

export function useGymOs(): GymOsContextValue {
  const ctx = useContext(GymOsContext);
  if (!ctx) throw new Error('useGymOs must be used inside GymOsProvider');
  return ctx;
}
