"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useFoodCreatorAuth } from "@/lib/food-creator-auth";
import { useQuery } from "convex/react";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Download, Filter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TransactionsPage() {
    const { foodCreator, sessionToken } = useFoodCreatorAuth();
    const [typeFilter, setTypeFilter] = useState<"all" | "earning" | "payout" | "fee" | "refund">("all");
    const [page, setPage] = useState(0);
    const limit = 20;

    const transactionsData = useQuery(api.queries.chefTransactions.getByChefId,
        foodCreator ? {
            chefId: foodCreator._id,
            sessionToken,
            type: typeFilter,
            offset: page * limit,
            limit
        } : "skip"
    );

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'earning': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
            case 'payout': return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
            case 'fee': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
            case 'refund': return <ArrowUpRight className="h-4 w-4 text-purple-500" />;
            default: return null;
        }
    };

    const getTransactionBadge = (type: string) => {
        switch (type) {
            case 'earning': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Earning</Badge>;
            case 'payout': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Payout</Badge>;
            case 'fee': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Fee</Badge>;
            case 'refund': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Refund</Badge>;
            default: return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
            <div className="flex items-center gap-4">
                <Link href="/food-creator/earnings" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">View and filter your financial history</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={typeFilter} onValueChange={(v: any) => { setTypeFilter(v); setPage(0); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Transactions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Transactions</SelectItem>
                                <SelectItem value="earning">Earnings</SelectItem>
                                <SelectItem value="payout">Payouts</SelectItem>
                                <SelectItem value="fee">Fees</SelectItem>
                                <SelectItem value="refund">Refunds</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactionsData === undefined ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : transactionsData.transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
                                </TableRow>
                            ) : (
                                transactionsData.transactions.map((tx: any) => (
                                    <TableRow key={tx._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTransactionIcon(tx.type)}
                                                {getTransactionBadge(tx.type)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{tx.description}</TableCell>
                                        <TableCell>
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                            <span className="block text-xs text-muted-foreground">
                                                {new Date(tx.createdAt).toLocaleTimeString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{tx.reference || tx._id.slice(0, 8)}</TableCell>
                                        <TableCell className={`text-right font-bold ${tx.amount > 0 && tx.type === 'earning' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {tx.type === 'earning' ? '+' : '-'}£{Math.abs(tx.amount / 100).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {transactionsData && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!transactionsData.hasMore}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
