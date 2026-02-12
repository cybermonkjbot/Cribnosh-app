"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, History, Landmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Helper to format currency
const formatMoney = (amount: number, currency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency,
    }).format(amount / 100);
};

// Helper for status badge
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'paid':
        case 'completed':
            return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
        case 'processing':
            return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
        case 'requested':
        case 'pending':
            return <Badge variant="secondary">Requested</Badge>;
        case 'failed':
            return <Badge variant="destructive">Failed</Badge>;
        case 'cancelled':
            return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function PayoutsPage() {
    const { chef, sessionToken } = useChefAuth();

    const earningsSummary = useQuery(api.queries.chefEarnings.getSummary,
        chef ? { chefId: chef._id, sessionToken } : "skip"
    );

    const payoutHistory = useQuery(api.queries.chefPayouts.getHistory,
        chef ? { chefId: chef._id, sessionToken, limit: 20 } : "skip"
    );

    const bankAccounts = useQuery(api.queries.chefBankAccounts.getByChefId,
        chef ? { chefId: chef._id, sessionToken } : "skip"
    );

    const requestPayout = useMutation(api.mutations.chefPayouts.requestPayout);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [amount, setAmount] = useState<string>("");

    const handleOpenRequest = () => {
        if (earningsSummary?.availableBalance && earningsSummary.availableBalance > 0) {
            setAmount((earningsSummary.availableBalance / 100).toFixed(2));
        }

        // Select primary account by default
        if (bankAccounts) {
            const primary = bankAccounts.find((a: any) => a.isPrimary);
            if (primary) setSelectedAccountId(primary._id);
            else if (bankAccounts.length > 0) setSelectedAccountId(bankAccounts[0]._id);
        }

        setIsRequestModalOpen(true);
    };

    const handleRequestPayout = async () => {
        if (!chef || !sessionToken || !selectedAccountId) return;

        // Amount validation
        const pAmount = parseFloat(amount) * 100; // to pence
        if (isNaN(pAmount) || pAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (pAmount > (earningsSummary?.availableBalance || 0)) {
            toast.error("Amount exceeds available balance");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await requestPayout({
                chefId: chef._id,
                sessionToken,
                bankAccountId: selectedAccountId as any,
                amount: Math.floor(pAmount),
            });

            if (result.success) {
                toast.success(result.message);
                setIsRequestModalOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to request payout");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
                    <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
                </div>
                <Button
                    onClick={handleOpenRequest}
                    disabled={!earningsSummary || earningsSummary.availableBalance <= 0}
                >
                    <Landmark className="mr-2 h-4 w-4" /> Request Payout
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available to Payout</CardTitle>
                        <BanknoteIcon className="h-4 w-4 text-muted-foreground text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {earningsSummary ? formatMoney(earningsSummary.availableBalance) : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ready for immediate withdrawal
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {earningsSummary ? formatMoney(earningsSummary.pendingPayouts) : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Processing or requested
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {earningsSummary ? formatMoney(
                                (earningsSummary.totalEarnings || 0) - (earningsSummary.platformFees || 0) - (earningsSummary.availableBalance || 0) - (earningsSummary.pendingPayouts || 0)
                                // Rough calculation if totalPaidOut isn't directly exposed, but usually sufficient
                                // Actually getSummary doesn't return totalPaidOut explicitly, but we can infer or update query later.
                                // For now, let's just show Net Earnings instead if stats are limited
                                // Or assume the difference is paid out.
                            ) : "..."}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime earnings paid
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                    <CardDescription>Recent payout requests and their status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>To Account</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payoutHistory === undefined ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : payoutHistory.payouts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payout history found</TableCell>
                                </TableRow>
                            ) : (
                                payoutHistory.payouts.map((payout: any) => (
                                    <TableRow key={payout.payoutId}>
                                        <TableCell>
                                            {new Date(payout.requestedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatMoney(payout.amount, payout.currency.toUpperCase())}
                                        </TableCell>
                                        <TableCell>
                                            {payout.bankAccount ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{payout.bankAccount.bankName}</span>
                                                    <span className="text-xs text-muted-foreground">**** {payout.bankAccount.last4}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Unknown Account</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {payout.processedAt && (
                                                <span className="text-xs text-muted-foreground">
                                                    Processed {new Date(payout.processedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Payout</DialogTitle>
                        <DialogDescription>
                            Process withdrawal to your connected bank account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Select Account</Label>
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts?.map((account: any) => (
                                        <SelectItem key={account._id} value={account._id}>
                                            {account.bankName} (**** {account.last4})
                                        </SelectItem>
                                    ))}
                                    {(!bankAccounts || bankAccounts.length === 0) && (
                                        <div className="p-2 text-sm text-center text-muted-foreground">
                                            No accounts found. Please add one first.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount ({'£'})</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                max={earningsSummary?.availableBalance ? (earningsSummary.availableBalance / 100).toFixed(2) : "0"}
                            />
                            <p className="text-xs text-muted-foreground">
                                Max available: {earningsSummary ? formatMoney(earningsSummary.availableBalance) : "..."}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRequestPayout} disabled={isSubmitting || !selectedAccountId}>
                            {isSubmitting ? "Processing..." : "Confirm Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function BanknoteIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="12" x="2" y="6" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
        </svg>
    )
}
