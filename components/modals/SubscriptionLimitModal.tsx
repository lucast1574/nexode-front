"use client";

import React from "react";
import { AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";

interface SubscriptionLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName: string;
    serviceId: string;
    usedSlots: number;
    totalSlots: number;
}

export function SubscriptionLimitModal({
    isOpen,
    onClose,
    serviceName,
    serviceId,
    usedSlots,
    totalSlots,
}: SubscriptionLimitModalProps) {
    const hasNoSubscription = totalSlots === 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <DialogTitle>
                                {hasNoSubscription ? "Subscription Required" : "Instance Limit Reached"}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {hasNoSubscription
                                    ? `You need an active ${serviceName} subscription to create an instance.`
                                    : `You're using ${usedSlots} of ${totalSlots} available ${serviceName.toLowerCase()} instance${totalSlots !== 1 ? 's' : ''}.`
                                }
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!hasNoSubscription && (
                    <div className="rounded-xl border bg-muted/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Instance Slots</span>
                            <span className="text-xs font-mono text-amber-400">{usedSlots}/{totalSlots} used</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                                style={{ width: `${Math.min((usedSlots / totalSlots) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="rounded-xl border bg-muted/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">How it works</p>
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</div>
                            <p className="text-xs text-muted-foreground">Choose a plan that fits your needs</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">2</div>
                            <p className="text-xs text-muted-foreground">Each subscription unlocks one instance slot</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">3</div>
                            <p className="text-xs text-muted-foreground">Want more instances? Add more subscriptions</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-row gap-2 sm:justify-end">
                    <DialogClose render={<Button variant="outline" />}>
                        Cancel
                    </DialogClose>
                    <Button asChild className="gap-2">
                        <Link href={`/services#${serviceId}`}>
                            <Plus className="w-4 h-4" />
                            {hasNoSubscription ? "View Plans" : "Add Subscription"}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}