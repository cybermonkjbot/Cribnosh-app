// Payroll Settings
export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export interface PayrollSettings {
  _id: string;
  _creationTime: number;
  payFrequency: PayFrequency;
  firstPayDay: number;
  standardWorkWeek: number;
  overtimeMultiplier: number;
  holidayOvertimeMultiplier: number;
  weekendOvertimeMultiplier: number;
  updatedBy: string;
  updatedAt: number;
}

// Staff Payroll Profile
export type PaymentMethod = 'direct_deposit' | 'check' | 'other';
export type AccountType = 'checking' | 'savings';
export type TaxStatus = 'single' | 'married' | 'head_of_household';

export interface BankDetails {
  accountNumber: string;
  routingNumber: string;
  accountType: AccountType;
  bankName: string;
}

export interface TaxWithholdings {
  federalAllowances: number;
  stateAllowances: number;
  additionalWithholding: number;
  taxStatus: TaxStatus;
}

export interface StaffPayrollProfile {
  _id: string;
  _creationTime: number;
  staffId: string;
  hourlyRate: number;
  isOvertimeEligible: boolean;
  paymentMethod: PaymentMethod;
  bankDetails?: BankDetails;
  taxWithholdings: TaxWithholdings;
  status: 'active' | 'inactive' | 'on_leave';
  updatedAt: number;
}

// Pay Periods
export type PayPeriodStatus = 'pending' | 'in_progress' | 'processed' | 'paid';

export interface PayPeriod {
  _id: string;
  _creationTime: number;
  startDate: number;
  endDate: number;
  status: PayPeriodStatus;
  processedAt?: number;
  processedBy?: string;
  notes?: string;
}

// Pay Slips
export type PaySlipStatus = 'draft' | 'processing' | 'paid' | 'cancelled';

export interface PaySlipDeduction {
  type: string;
  amount: number;
  description?: string;
}

export interface PaySlipBonus {
  type: string;
  amount: number;
  description?: string;
}

export interface PaySlip {
  _id: string;
  _creationTime: number;
  staffId: string;
  periodId: string;
  baseHours: number;
  overtimeHours: number;
  hourlyRate: number;
  grossPay: number;
  deductions: PaySlipDeduction[];
  bonuses: PaySlipBonus[];
  netPay: number;
  status: PaySlipStatus;
  paymentDate?: number;
  paymentMethod: string;
  notes?: string;
  updatedAt: number;
}

// Work Sessions
export type WorkSessionStatus = 'active' | 'completed' | 'adjusted';

export interface WorkSession {
  _id: string;
  _creationTime: number;
  staffId: string;
  clockInTime: number;
  clockOutTime?: number;
  duration?: number; // in milliseconds
  status: WorkSessionStatus;
  isOvertime?: boolean;
  payPeriodId?: string;
  notes?: string;
  updatedAt: number;
}

// Payroll Audit Log
export interface PayrollAuditLog {
  _id: string;
  _creationTime: number;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedAt: number;
  changes: any;
  ipAddress?: string;
  userAgent?: string;
}

// API Response Types
export interface PayPeriodWithSummary extends PayPeriod {
  totalStaff: number;
  totalPay: number;
  statusCounts: Record<PaySlipStatus, number>;
}

export interface PaySlipWithDetails extends PaySlip {
  payPeriod: PayPeriod;
  workSessions: WorkSession[];
  staffName: string;
}

export interface YtdEarnings {
  year: number;
  paySlipCount: number;
  grossPay: number;
  netPay: number;
  deductions: number;
  bonuses: number;
  hoursWorked: number;
  overtimeHours: number;
}
