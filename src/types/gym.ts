export type UserRole =
  | 'SUPER_ADMIN'
  | 'GYM_OWNER'
  | 'RECEPTIONIST'
  | 'GYM_MEMBER';

export type GymAccountStatus = 'active' | 'suspended' | 'trial';

export type SaasPlanTier = 'Starter' | 'Pro' | 'Enterprise';

export type BillingCycle = 'monthly' | 'annual';

export type MembershipStatus =
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'pending_payment'
  | 'inactive';

export type PaymentMethod =
  | 'cash'
  | 'upi_manual'
  | 'card_manual'
  | 'other_manual'
  | 'verified_gateway';

export type VerificationSource = 'manual_entry' | 'verified_payment_gateway';

export type TransactionStatus = 'completed' | 'voided';

export type NavModule =
  | 'dashboard'
  | 'members'
  | 'memberships'
  | 'payments'
  | 'attendance'
  | 'staff'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'super_admin'
  | 'member_portal';

export interface Gym {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  ownerUserId: string;
  currency: 'INR';
  accountStatus: GymAccountStatus;
  saasPlan: SaasPlanTier;
  billingCycle: BillingCycle;
  saasMonthlyFee: number;
  createdAt: string;
  updatedAt: string;
  isDemoData: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  gymId: string | null; // null for SUPER_ADMIN
  memberId?: string | null; // linked member record when role === 'GYM_MEMBER'
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GymStaff {
  id: string;
  gymId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'GYM_OWNER' | 'RECEPTIONIST';
  shiftLabel: string;
  isActive: boolean;
  joinedAt: string;
  isDemoData: boolean;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  category: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Custom';
  durationDays: number;
  price: number;
  description: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  isDemoData: boolean;
}

export interface Member {
  id: string;
  gymId: string;
  memberCode: string; // e.g., GYM-1001
  fullName: string;
  avatarUrl?: string;
  phone: string;
  email: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  joiningDate: string;
  accountStatus: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  isDemoData: boolean;
}

export interface Membership {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  planNameSnapshot: string;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  totalFee: number;
  isCurrent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDemoData: boolean;
}

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  membershipId: string;
  receiptNumber: string; // e.g., RCPT-2026-0041
  amountPaid: number;
  paymentDate: string; // ISO string
  paymentMethod: PaymentMethod;
  verificationSource: VerificationSource;
  recordedByUserId: string;
  recordedByName: string;
  transactionStatus: TransactionStatus;
  notes?: string;
  createdAt: string;
  isDemoData: boolean;
}

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  checkInAt: string; // ISO string
  method: 'front_desk' | 'qr_scan_prototype';
  recordedByName: string;
  isDemoData: boolean;
}

export interface NotificationItem {
  id: string;
  gymId: string;
  type: 'expiry_alert' | 'payment_due' | 'renewal_request' | 'system';
  title: string;
  message: string;
  relatedMemberId?: string;
  isRead: boolean;
  actionStatus?: 'pending' | 'approved' | 'dismissed';
  requestedPlanId?: string;
  createdAt: string;
  isDemoData: boolean;
}

export interface GymSubscription {
  id: string;
  gymId: string;
  planTier: SaasPlanTier;
  billingCycle: BillingCycle;
  amount: number;
  status: 'active' | 'past_due' | 'suspended';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  isDemoData: boolean;
}

export interface EnrichedMember extends Member {
  currentMembership: Membership | null;
  computedStatus: MembershipStatus;
  totalFee: number;
  totalPaid: number;
  outstandingBalance: number;
  daysRemaining: number | null;
  lastCheckInAt: string | null;
}
