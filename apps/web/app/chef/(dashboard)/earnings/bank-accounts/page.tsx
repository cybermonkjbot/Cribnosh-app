"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useMutation, useQuery } from "convex/react";
import { Banknote, CheckCircle, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BankAccountsPage() {
    const { chef, sessionToken } = useChefAuth();
    const accounts = useQuery(api.queries.chefBankAccounts.getByChefId,
        chef ? { chefId: chef._id, sessionToken } : "skip"
    );

    const createAccount = useMutation(api.mutations.chefBankAccounts.create);
    const deleteAccount = useMutation(api.mutations.chefBankAccounts.remove);
    const setPrimaryAccount = useMutation(api.mutations.chefBankAccounts.setPrimary);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        sortCode: "",
    });

    const handleCreate = async () => {
        if (!chef || !sessionToken) return;

        // Basic validation
        if (!formData.accountHolderName || !formData.bankName || !formData.accountNumber || !formData.sortCode) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setIsSubmitting(true);
            await createAccount({
                chefId: chef._id,
                sessionToken,
                accountHolderName: formData.accountHolderName,
                bankName: formData.bankName,
                accountNumber: formData.accountNumber,
                sortCode: formData.sortCode,
            });
            toast.success("Bank account added successfully");
            setIsAddModalOpen(false);
            setFormData({
                accountHolderName: "",
                bankName: "",
                accountNumber: "",
                sortCode: "",
            });
        } catch (error) {
            toast.error("Failed to add bank account");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (accountId: any) => {
        if (!sessionToken) return;
        if (!confirm("Are you sure you want to remove this bank account?")) return;

        try {
            await deleteAccount({ accountId, sessionToken });
            toast.success("Bank account removed");
        } catch (error: any) {
            toast.error(error.message || "Failed to remove account");
        }
    };

    const handleSetPrimary = async (accountId: any) => {
        if (!chef || !sessionToken) return;

        try {
            await setPrimaryAccount({ chefId: chef._id, accountId, sessionToken });
            toast.success("Primary account updated");
        } catch (error) {
            toast.error("Failed to update primary account");
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
                    <p className="text-muted-foreground">Manage your payout methods</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {accounts === undefined ? (
                    // Loading state
                    [1, 2].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-40" />
                        </Card>
                    ))
                ) : accounts.length === 0 ? (
                    <div className="col-span-full text-center py-12 border rounded-lg bg-muted/10">
                        <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No bank accounts added</h3>
                        <p className="text-muted-foreground mb-4">Add a bank account to receive payouts</p>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                            Add Bank Account
                        </Button>
                    </div>
                ) : (
                    accounts.map((account: any) => (
                        <Card key={account._id} className={account.isPrimary ? "border-primary" : ""}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{account.bankName}</h3>
                                        <p className="text-sm text-muted-foreground">{account.accountHolderName}</p>
                                    </div>
                                    {account.isPrimary && (
                                        <Badge variant="default" className="flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-current" /> Primary
                                        </Badge>
                                    )}
                                </div>

                                <div className="bg-muted/30 p-4 rounded-md mb-4 font-mono text-sm border">
                                    **** **** **** {account.last4}
                                </div>

                                <div className="flex gap-2 justify-end">
                                    {!account.isPrimary && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSetPrimary(account._id)}
                                            >
                                                Set as Primary
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(account._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    {account.isPrimary && (
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 px-3 py-1">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Active for payouts
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Bank Account</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="holder">Account Holder Name</Label>
                            <Input
                                id="holder"
                                value={formData.accountHolderName}
                                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bank">Bank Name</Label>
                            <Input
                                id="bank"
                                value={formData.bankName}
                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                placeholder="e.g. Barclays"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="number">Account Number</Label>
                            <Input
                                id="number"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                placeholder="8 digits"
                                maxLength={20}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sort">Sort Code</Label>
                            <Input
                                id="sort"
                                value={formData.sortCode}
                                onChange={(e) => setFormData({ ...formData, sortCode: e.target.value })}
                                placeholder="XX-XX-XX"
                                maxLength={8}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
