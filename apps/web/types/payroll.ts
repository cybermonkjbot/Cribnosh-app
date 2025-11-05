/**
 * Payroll Types
 * Type definitions for payroll, payslips, deductions, and related structures
 */

import type { Id } from "@/convex/_generated/dataModel";
import type { DataModel } from "@/convex/_generated/dataModel";

/**
 * Pay Frequency Type
 */
export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

/**
 * Pay Period Status
 */
export type PayPeriodStatus = "pending" | "processing" | "processed";

/**
 * Pay Slip Status
 */
export type PaySlipStatus = "draft" | "pending" | "issued" | "paid";

/**
 * Account Type
 */
export type AccountType = "checking" | "savings";

/**
 * Tax Status
 */
export type TaxStatus = "single" | "married" | "married_separate" | "head_of_household";

/**
 * Deduction Type
 */
export interface PaySlipDeduction {
  type: string;
  amount: number;
  description?: string;
}

/**
 * Bonus Type
 */
export interface PaySlipBonus {
  type: string;
  amount: number;
  description?: string;
}

/**
 * Pay Slip Document from Database
 */
export type PaySlipDoc = DataModel["paySlips"]["document"] & {
  _id: Id<"paySlips">;
  _creationTime: number;
  period?: PayPeriodDoc;
  periodId: Id<"payPeriods">;
  staffId: Id<"users">;
};

/**
 * Pay Period Document from Database
 */
export type PayPeriodDoc = DataModel["payPeriods"]["document"] & {
  _id: Id<"payPeriods">;
  _creationTime: number;
  startDate: number;
  endDate: number;
  status: PayPeriodStatus;
};

/**
 * User Document from Database
 */
export type UserDoc = DataModel["users"]["document"] & {
  _id: Id<"users">;
  _creationTime: number;
};

/**
 * Work Session Document from Database
 */
export type WorkSessionDoc = DataModel["workSessions"]["document"] & {
  _id: Id<"workSessions">;
  _creationTime: number;
};

/**
 * Tax Document Structure
 */
export interface TaxDocument {
  _id: Id<"taxDocuments">;
  _creationTime: number;
  employeeId: Id<"users">;
  documentType: "p60" | "p45" | "p11d" | "self_assessment" | "payslip" | "payslip_ng" | "tax_clearance" | "nhf_certificate" | "nhis_certificate" | "pension_certificate";
  taxYear: number;
  status: "pending" | "generated" | "sent" | "downloaded" | "error";
  fileUrl?: string;
  storageId?: Id<"_storage">;
  generatedAt?: number;
  sentAt?: number;
  downloadedAt?: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Payroll Summary
 */
export interface PayrollSummary {
  startDate: number;
  endDate: number;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalBonuses: number;
}

/**
 * Detailed Payroll Data
 */
export interface DetailedPayrollData {
  slipId: Id<"paySlips">;
  staffId: Id<"users">;
  employeeName: string;
  period: string;
  grossPay: number;
  netPay: number;
  deductions: PaySlipDeduction[];
  bonuses: PaySlipBonus[];
}

/**
 * Payroll Report
 */
export interface DetailedPayrollReport {
  summary: PayrollSummary;
  details: DetailedPayrollData[];
}

/**
 * Tax Report Data
 */
export interface TaxReportData {
  employeeCount: number;
  totalTaxesWithheld: number;
  federalTaxes: number;
  stateTaxes: number;
  localTaxes: number;
  breakdownByType: Record<string, { amount: number; count: number }>;
}

/**
 * Benefits Report Data
 */
export interface BenefitsReportData {
  employeeCount: number;
  totalBenefits: number;
  breakdownByType: Record<string, { amount: number; count: number }>;
}

/**
 * User with Employee Info (for payroll exports)
 */
export interface UserWithEmployeeInfo {
  _id: Id<"users">;
  email: string;
  name: string;
  employeeId?: string;
  position?: string;
  department?: string;
  startDate?: string;
}

