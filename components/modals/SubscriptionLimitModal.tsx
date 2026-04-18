"use client";

import React from "react";
import { AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SubscriptionLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName: string; // "Database", "Compute", "n8n Automation"
    serviceId: string;   // "database", "compute", "n8n"
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
    if (!isOpen) return null;

    const hasNoSubscription = totalSlots === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/95 p-8 shadow-2xl">
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                    <AlertTriangle className="h-8 w-8 text-amber-400" />
                </div>

                {/* Title */}
                <h2 className="mb-2 text-center text-xl font-black uppercase tracking-wider text-white">
                    {hasNoSubscription ? "Subscription Required" : "Instance Limit Reached"}
                </h2>

                {/* Description */}
                <p className="mb-6 text-center text-sm text-zinc-400 leading-relaxed">
                    {hasNoSubscription ? (
                        <>
                            You need an active <span className="text-white font-semibold">{serviceName}</span> subscription to create an instance.
                            Each subscription includes <span className="text-white font-semibold">one instance slot</span>.
                        </>
                    ) : (
                        <>
                            You&apos;re using <span className="text-white font-semibold">{usedSlots} of {totalSlots}</span> available {serviceName.toLowerCase()} instance{totalSlots !== 1 ? 's' : ''}.
                            Each instance requires its own subscription.
                            Add another subscription to create more.
                        </>
                    )}
                </p>

                {/* Slot indicator (only if they have some) */}
                {!hasNoSubscription && (
                    <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Instance Slots</span>
                            <span className="text-xs font-mono text-amber-400">{usedSlots}/{totalSlots} used</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                                style={{ width: `${Math.min((usedSlots / totalSlots) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* How it works */}
                <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">How it works</p>
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</div>
                            <p className="text-xs text-zinc-400">Choose a plan that fits your needs</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">2</div>
                            <p className="text-xs text-zinc-400">Each subscription unlocks one instance slot</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">3</div>
                            <p className="text-xs text-zinc-400">Want more instances? Add more subscriptions</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl h-12 font-bold text-zinc-500 hover:text-white"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Link href={`/services#${serviceId}`} className="flex-1">
                        <Button className="w-full rounded-2xl h-12 font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2">
                            <Plus className="w-4 h-4" />
                            {hasNoSubscription ? "View Plans" : "Add Subscription"}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
