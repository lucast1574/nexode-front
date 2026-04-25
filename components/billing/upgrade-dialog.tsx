"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Loader2, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useModal } from "@/components/ui/modal";
import { getAccessToken } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

interface UpgradePreview {
    currentPlanName: string;
    newPlanName: string;
    currentCycle: string;
    newCycle: string;
    prorationCents: number;
    totalNextInvoiceCents: number;
    nextInvoiceDate?: string | null;
    currency: string;
    priceDelta: "upgrade" | "downgrade" | "same";
}

interface UpgradeDialogProps {
    open: boolean;
    onClose: () => void;
    /** UserSubscription mongo id to be modified. */
    subscriptionId: string;
    /** Target plan slug (e.g. 'compute-pro'). */
    newPlanSlug: string;
    /** Target cycle (defaults to current sub's cycle if not provided). */
    newCycle?: "monthly" | "annual";
    onSuccess?: () => void;
}

/**
 * Two-step dialog: (1) fetches a Stripe preview invoice for the requested change,
 * shows the prorated charge today + next invoice; (2) on confirm, calls
 * updateSubscription to apply the change. Stripe processes the proration.
 */
export function UpgradeDialog({
    open,
    onClose,
    subscriptionId,
    newPlanSlug,
    newCycle = "monthly",
    onSuccess,
}: UpgradeDialogProps) {
    const [preview, setPreview] = useState<UpgradePreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showAlert } = useModal();

    useEffect(() => {
        if (!open) {
            setPreview(null);
            setError(null);
            return;
        }
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = getAccessToken();
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
                const query = `
                    query Preview($subId: String!, $slug: String!, $cycle: String!) {
                        previewSubscriptionUpgrade(subscriptionId: $subId, planSlug: $slug, billingCycle: $cycle) {
                            currentPlanName
                            newPlanName
                            currentCycle
                            newCycle
                            prorationCents
                            totalNextInvoiceCents
                            nextInvoiceDate
                            currency
                            priceDelta
                        }
                    }
                `;
                const res = await fetch(GQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        query,
                        variables: { subId: subscriptionId, slug: newPlanSlug, cycle: newCycle },
                    }),
                });
                const result = await res.json();
                if (result.errors) throw new Error(result.errors[0].message || "Preview failed");
                setPreview(result.data.previewSubscriptionUpgrade);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Preview failed");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, subscriptionId, newPlanSlug, newCycle]);

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
            const mutation = `
                mutation Apply($subId: String!, $slug: String!, $cycle: String!) {
                    updateSubscription(subscriptionId: $subId, planSlug: $slug, billingCycle: $cycle) { id status }
                }
            `;
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    query: mutation,
                    variables: { subId: subscriptionId, slug: newPlanSlug, cycle: newCycle },
                }),
            });
            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message || "Update failed");
            showAlert({
                title: "Plan Updated",
                message:
                    preview?.priceDelta === "downgrade"
                        ? "Your plan was downgraded. Stripe will credit you the difference on your next invoice."
                        : "Your plan was upgraded. Existing instances will be rescaled automatically.",
                type: "success",
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Update failed";
            showAlert({ title: "Update Error", message, type: "error" });
        } finally {
            setConfirming(false);
        }
    };

    const fmt = (cents: number, currency = "usd") => {
        const sign = cents < 0 ? "-" : "";
        const value = Math.abs(cents) / 100;
        return `${sign}$${value.toFixed(2)} ${currency.toUpperCase()}`;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        {preview?.priceDelta === "downgrade" ? (
                            <><TrendingDown className="size-6 text-amber-400" /> Downgrade Plan</>
                        ) : (
                            <><TrendingUp className="size-6 text-primary" /> Upgrade Plan</>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Review the prorated charge before confirming. Stripe handles billing automatically.
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="py-12 flex flex-col items-center gap-3">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Calculating prorated invoice...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="py-6 text-center">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {preview && !loading && (
                    <div className="py-4 space-y-5">
                        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">From</div>
                                <div className="font-bold truncate">{preview.currentPlanName}</div>
                                <div className="text-xs text-muted-foreground capitalize">{preview.currentCycle}</div>
                            </div>
                            <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0 text-right">
                                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">To</div>
                                <div className="font-bold truncate text-primary">{preview.newPlanName}</div>
                                <div className="text-xs text-muted-foreground capitalize">{preview.newCycle}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Zap className="size-3.5" /> Charged today (prorated)
                                </span>
                                <span className={cn(
                                    "font-black tabular-nums",
                                    preview.prorationCents < 0 && "text-emerald-500",
                                    preview.prorationCents > 0 && "text-foreground"
                                )}>
                                    {fmt(preview.prorationCents, preview.currency)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Next invoice</span>
                                <div className="text-right">
                                    <div className="font-bold tabular-nums">{fmt(preview.totalNextInvoiceCents, preview.currency)}</div>
                                    {preview.nextInvoiceDate && (
                                        <div className="text-[10px] text-muted-foreground">
                                            {new Date(preview.nextInvoiceDate).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric",
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {preview.priceDelta === "downgrade" && (
                            <div className="text-xs p-3 rounded-md bg-amber-500/5 border border-amber-500/20 text-amber-300">
                                Downgrades credit the difference to your account; you won&apos;t be charged today.
                            </div>
                        )}

                        <div className="text-xs p-3 rounded-md bg-primary/5 border border-primary/20 text-muted-foreground">
                            Your existing instances on this subscription will be rescaled to the new plan&apos;s
                            limits automatically. Active deployments may briefly restart.
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={confirming}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!preview || loading || confirming || !!error}
                        className="gap-2"
                    >
                        {confirming && <Loader2 className="size-4 animate-spin" />}
                        Confirm {preview?.priceDelta === "downgrade" ? "Downgrade" : "Upgrade"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
