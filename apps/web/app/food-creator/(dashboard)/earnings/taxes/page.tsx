"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useQuery } from "convex/react";
import { ArrowLeft, DollarSign, Download, FileText, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TaxPage() {
    const { chef, sessionToken } = useChefAuth();
    const [selectedYear, setSelectedYear] = useState<string>("");

    const availableYears = useQuery(api.queries.chefTax.getAvailableTaxYears,
        chef ? { chefId: chef._id, sessionToken } : "skip"
    );

    const taxSummary = useQuery(api.queries.chefTax.getTaxYearSummary,
        chef && selectedYear ? {
            chefId: chef._id,
            sessionToken,
            taxYear: parseInt(selectedYear)
        } : "skip"
    );

    // Set default year when available
    if (availableYears && availableYears.length > 0 && !selectedYear) {
        setSelectedYear(availableYears[0].toString());
    } else if (!selectedYear && availableYears !== undefined && availableYears.length === 0) {
        // If no years found, maybe default to current year just to show empty state
        if (!selectedYear) setSelectedYear(new Date().getFullYear().toString());
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/food-creator/earnings" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tax Information</h1>
                        <p className="text-muted-foreground">Financial summaries for tax reporting</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Tax Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears?.map((year: number) => (
                                <SelectItem key={year} value={year.toString()}>
                                    Tax Year {year}-{year + 1}
                                </SelectItem>
                            ))}
                            {(!availableYears || availableYears.length === 0) && (
                                <SelectItem value={new Date().getFullYear().toString()}>
                                    Current Tax Year
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Download Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {taxSummary ? `£${(taxSummary.totalEarnings / 100).toFixed(2)}` : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total earnings before fees
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expenses & Fees</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {taxSummary ? `£${((taxSummary.totalPlatformFees + taxSummary.totalRefunds) / 100).toFixed(2)}` : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Platform fees and refunds
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {taxSummary ? `£${(taxSummary.netEarnings / 100).toFixed(2)}` : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Taxable income
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                    <CardDescription>
                        Income and expenses by month for the selected tax year ({selectedYear}-{parseInt(selectedYear) + 1})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead className="text-right">Gross Earnings</TableHead>
                                <TableHead className="text-right">Fees & Expenses</TableHead>
                                <TableHead className="text-right">Net Income</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {taxSummary === undefined ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : taxSummary.monthlyBreakdown.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No data for this tax year</TableCell>
                                </TableRow>
                            ) : (
                                taxSummary.monthlyBreakdown.map((monthData: any) => (
                                    <TableRow key={monthData.month}>
                                        <TableCell className="font-medium">
                                            {new Date(monthData.month + "-01").toLocaleDateString("en-GB", { month: 'long', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            £{(monthData.earnings / 100).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            -£{(monthData.fees / 100).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            £{(monthData.net / 100).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
                <FileText className="h-5 w-5 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Important Tax Note</p>
                    <p className="opacity-90 mt-1">
                        This summary is provided for your convenience and does not constitute official tax advice.
                        You are responsible for declaring your income to HMRC. Platform fees are generally tax-deductible expenses.
                    </p>
                </div>
            </div>
        </div>
    );
}
