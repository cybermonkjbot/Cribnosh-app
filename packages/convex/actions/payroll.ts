"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { action } from "../_generated/server";
import { isAdmin } from "../utils/auth";

export const exportReport = action({
    args: {
        format: v.union(v.literal("csv"), v.literal("pdf")),
        startDate: v.number(),
        endDate: v.number(),
        department: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Authenticate admin user
        const user = await ctx.runQuery(api.queries.users.getMe, { sessionToken: args.sessionToken });
        if (!user || !isAdmin(user)) {
            throw new Error("Admin access required");
        }

        // Fetch data using the existing query
        const data = await ctx.runQuery(api.payroll.reports.getPayrollDetails, {
            startDate: args.startDate,
            endDate: args.endDate,
            department: args.department,
            sessionToken: args.sessionToken,
        });

        if (!data) {
            throw new Error("No data found for the selected period");
        }

        // Process data based on format
        if (args.format === "csv") {
            const headers = [
                "Employee",
                "Department",
                "Hours Worked",
                "Overtime Hours",
                "Regular Pay",
                "Overtime Pay",
                "Total Pay",
                "Net Pay",
            ];

            const rows = (data as any[]).map((row) => [
                row.employeeName,
                row.department,
                row.hoursWorked.toFixed(2),
                row.overtimeHours.toFixed(2),
                row.regularPay.toFixed(2),
                row.overtimePay.toFixed(2),
                row.totalPay.toFixed(2),
                row.netPay.toFixed(2),
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map((row) => row.map((cell: string) => `"${cell}"`).join(",")),
            ].join("\n");

            return {
                data: csvContent,
                filename: `payroll-report-${new Date().toISOString().split("T")[0]}.csv`,
                contentType: "text/csv",
            };
        } else {
            // For PDF, we'll return a placeholder or implement basic PDF generation if library is available
            // Since PDF generation in Edge/Node runtime can be complex without specific libraries,
            // we might just return CSV for now or throw feature not implemented
            throw new Error("PDF export is not yet supported");
        }
    },
});
