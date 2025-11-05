import { FunctionReference } from "convex/server";

declare module "convex/browser" {
  interface API {
    // Payroll module
    payroll: {
      // Periods
      periods: {
        getPayPeriods: FunctionReference<
          "query",
          "public",
          { limit?: number },
          unknown[],
          "optional"
        >;
      };
      
      // Admin operations
      admin: {
        getStaffPayrollProfiles: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          unknown[],
          "optional"
        >;
        getPayrollSettings: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Record<string, unknown>,
          "optional"
        >;
        processPayroll: FunctionReference<
          "mutation",
          "public",
          { periodId: string },
          unknown,
          "optional"
        >;
      };
      
      // Reports
      reports: {
        getPayrollSummary: FunctionReference<
          "query",
          "public",
          {
            startDate?: number;
            endDate?: number;
            department?: string;
          },
          unknown
        >;
        getPayrollDetails: FunctionReference<
          "query",
          "public",
          {
            startDate?: number;
            endDate?: number;
            department?: string;
          },
          unknown[]
        >;
      };
      
      // Admin endpoints
      admin: {
        getPayrollSettings: FunctionReference<"query", "public", Record<string, never>, unknown>;
        getStaffPayrollProfiles: FunctionReference<"query", "public", Record<string, never>, unknown[]>;
        processPayroll: FunctionReference<"mutation", "public", { periodId: string }, void>;
        updatePayrollSettings: FunctionReference<"mutation", "public", {
          payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
          firstPayDay: number;
          standardWorkWeek: number;
          overtimeMultiplier: number;
          holidayOvertimeMultiplier: number;
          weekendOvertimeMultiplier: number;
        }, void>;
        updateStaffPayrollProfile: FunctionReference<"mutation", "public", {
          userId: string;
          updates: {
            baseSalary?: number;
            hourlyRate?: number;
            paymentMethod?: 'bank' | 'mobile_money' | 'cash';
            bankDetails?: {
              accountNumber?: string;
              bankName?: string;
              branchCode?: string;
            };
            mobileMoneyDetails?: {
              provider?: string;
              phoneNumber?: string;
            };
            taxId?: string;
            socialSecurityNumber?: string;
            nhifNumber?: string;
            nssfNumber?: string;
          };
        }, void>;
      };
      
      // Pay periods
      periods: {
        getPayPeriods: FunctionReference<"query", "public", { 
          status?: 'upcoming' | 'current' | 'completed';
          startDate?: number;
          endDate?: number;
          limit?: number;
        }, unknown[]>;
        getPayPeriod: FunctionReference<"query", "public", { 
          periodId: string;
        }, unknown>;
        createPayPeriod: FunctionReference<"mutation", "public", {
          startDate: number;
          endDate: number;
          payDate: number;
          name?: string;
        }, void>;
        updatePayPeriodStatus: FunctionReference<"mutation", "public", {
          periodId: string;
          status: 'upcoming' | 'current' | 'completed';
          notes?: string;
        }, void>;
      };
    };
    payroll: {
      reports: {
        getPayrollSummary: FunctionReference<
          "query",
          "public",
          {
            startDate?: number;
            endDate?: number;
            department?: string;
          },
          unknown
        >;
        getPayrollDetails: FunctionReference<
          "query",
          "public",
          {
            startDate?: number;
            endDate?: number;
            department?: string;
          },
          unknown[]
        >;
      };
      admin: {
        getPayrollSettings: FunctionReference<"query", "public", Record<string, never>, unknown>;
        getStaffPayrollProfiles: FunctionReference<"query", "public", Record<string, never>, unknown[]>;
        processPayroll: FunctionReference<"mutation", "public", { periodId: string }, void>;
        updatePayrollSettings: FunctionReference<"mutation", "public", {
          payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
          firstPayDay: number;
          standardWorkWeek: number;
          overtimeMultiplier: number;
          holidayOvertimeMultiplier: number;
          weekendOvertimeMultiplier: number;
        }, void>;
        updateStaffPayrollProfile: FunctionReference<"mutation", "public", {
          userId: string;
          updates: {
            baseSalary?: number;
            hourlyRate?: number;
            paymentMethod?: 'bank' | 'mobile_money' | 'cash';
            bankDetails?: {
              accountNumber?: string;
              bankName?: string;
              branchCode?: string;
            };
            mobileMoneyDetails?: {
              provider?: string;
              phoneNumber?: string;
            };
            taxId?: string;
            socialSecurityNumber?: string;
            nhifNumber?: string;
            nssfNumber?: string;
          };
        }, void>;
      };
      periods: {
        getPayPeriods: FunctionReference<"query", "public", { 
          status?: 'upcoming' | 'current' | 'completed';
          startDate?: number;
          endDate?: number;
          limit?: number;
        }, unknown[]>;
        getPayPeriod: FunctionReference<"query", "public", { 
          periodId: string;
        }, unknown>;
        createPayPeriod: FunctionReference<"mutation", "public", {
          startDate: number;
          endDate: number;
          payDate: number;
          name?: string;
        }, void>;
        updatePayPeriodStatus: FunctionReference<"mutation", "public", {
          periodId: string;
          status: 'upcoming' | 'current' | 'completed';
          notes?: string;
        }, void>;
      };
    };
    
    custom_orders: {
      getCustomOrderById: FunctionReference<
        "query",
        "public",
        { customOrderId: string },
        {
          _id: Id<"custom_orders">;
          _creationTime: number;
          dietary_restrictions?: string;
          userId: Id<"users">;
          requirements: string;
          serving_size: number;
          desired_delivery_time: string;
          custom_order_id: string;
          order_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'cancelled';
          createdAt?: number;
          updatedAt?: number;
        } | null,
        string | undefined
      >;
      
      list: FunctionReference<
        "query",
        "public",
        { 
          userId: Id<"users">;
          limit: number;
          offset: number;
        },
        Array<{
          _id: Id<"custom_orders">;
          _creationTime: number;
          dietary_restrictions?: string;
          userId: Id<"users">;
          requirements: string;
          serving_size: number;
          desired_delivery_time: string;
          custom_order_id: string;
          order_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'cancelled';
          createdAt?: number;
          updatedAt?: number;
        }>,
        string | undefined
      >;
      
      count: FunctionReference<
        "query",
        "public",
        { userId: Id<"users"> },
        number,
        string | undefined
      >;
      
      create: FunctionReference<
        "mutation",
        "public",
        {
          dietaryRestrictions?: string | null;
          userId: Id<"users">;
          orderId: string;
          requirements: string;
          servingSize: number;
          desiredDeliveryTime: string;
          customOrderId: string;
        },
        Id<"custom_orders">,
        string | undefined
      >;
      
      update: FunctionReference<
        "mutation",
        "public",
        {
          id: Id<"custom_orders">;
          updates: Partial<{
            requirements: string;
            serving_size: number;
            desired_delivery_time: string;
            status: 'pending' | 'processing' | 'completed' | 'cancelled';
            dietary_restrictions?: string;
            updatedAt: number;
          }>;
        },
        void,
        string | undefined
      >;
      
      delete: FunctionReference<
        "mutation",
        "public",
        { id: Id<"custom_orders"> },
        void,
        string | undefined
      >;
    };
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window {
    // Add any global window type extensions here if needed
  }
}
