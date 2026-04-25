"use client";

import React from "react";
import { Check, ArrowUpRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PricingPlan } from "./pricing-table";

interface TierPickerProps {
    service: string;
    /** All plans available on the platform (filtered to this service internally). */
    availablePlans: PricingPlan[];
    /** Slugs the current user already has an active subscription on. */
    ownedSlugs: string[];
    /** Superusers see every tier enabled (bypass mode). */
    isSuperuser?: boolean;
    value: string | null;
    onChange: (slug: string) => void;
    /** Called when the user clicks the inline upgrade hint on a non-owned tier. */
    onUpgrade?: (fromSlug: string, toSlug: string) => void;
    /** Called when a non-subscriber clicks a locked tier. Usually navigates to /billing. */
    onSubscribe?: (slug: string) => void;
    label?: string;
}

/**
 * Compact horizontal chip selector for picking a service tier when provisioning a
 * new instance. Shown to:
 *   - Superusers (every tier enabled, with bypass badge).
 *   - Users with multiple active subs of this service (their owned tiers enabled).
 *   - Users with a single sub or none (other tiers offer Upgrade/Subscribe links).
 */
export function TierPicker({
    service,
    availablePlans,
    ownedSlugs,
    isSuperuser = false,
    value,
    onChange,
    onUpgrade,
    onSubscribe,
    label,
}: TierPickerProps) {
    const plans = availablePlans
        .filter((p) => p.service === service)
        .filter((p) => p.price_monthly > 0)
        .filter((p) => (p.features as Record<string, unknown>)?.admin_only !== "true")
        .sort((a, b) => a.price_monthly - b.price_monthly);

    if (plans.length === 0) return null;

    const ownsAny = ownedSlugs.some((s) => plans.some((p) => p.slug === s));
    const ownedInService = plans.filter((p) => ownedSlugs.includes(p.slug));
    const currentOwnedSlug = ownedInService[0]?.slug;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    {label || `${service} tier`}
                </label>
                {isSuperuser && (
                    <Badge variant="outline" className="text-[9px] uppercase font-black bg-amber-500/10 border-amber-500/30 text-amber-500">
                        Superuser bypass
                    </Badge>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {plans.map((plan) => {
                    const owned = ownedSlugs.includes(plan.slug);
                    const isSelected = value === plan.slug;
                    const enabled = isSuperuser || owned || (!ownsAny && plan.slug === plans[0].slug);
                    // For users without any sub on this service, the cheapest tier is "subscribable"
                    // (it's the trial-eligible tier). Other tiers are locked.
                    const isSubscribable = !ownsAny && plan.slug === plans[0].slug && !isSuperuser;

                    return (
                        <button
                            key={plan.slug}
                            type="button"
                            disabled={!enabled}
                            onClick={() => enabled && onChange(plan.slug)}
                            className={cn(
                                "relative group flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-bold",
                                isSelected && "bg-primary/10 border-primary ring-2 ring-primary/30",
                                !isSelected && enabled && "bg-card border-border hover:border-primary/40",
                                !enabled && "bg-muted/20 border-border/50 text-muted-foreground/60 cursor-not-allowed"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                                )}
                            >
                                {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3]" />}
                                {!enabled && !isSelected && <Lock className="w-2 h-2 text-muted-foreground/60" />}
                            </div>
                            <span className="capitalize">{plan.name.replace(/^\w+\s/, "")}</span>
                            <span className="text-xs text-muted-foreground font-medium">
                                ${plan.price_monthly}/mo
                            </span>
                            {owned && (
                                <Badge
                                    variant="outline"
                                    className="text-[8px] uppercase font-black bg-primary/10 border-primary/30 text-primary"
                                >
                                    Active
                                </Badge>
                            )}
                            {/* Inline action for non-owned, non-superuser tiers */}
                            {!enabled && !isSubscribable && currentOwnedSlug && onUpgrade && (
                                <span
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpgrade(currentOwnedSlug, plan.slug);
                                    }}
                                    className="ml-1 flex items-center gap-1 text-[10px] uppercase font-black text-primary hover:underline cursor-pointer"
                                >
                                    Upgrade <ArrowUpRight className="w-3 h-3" />
                                </span>
                            )}
                            {isSubscribable && onSubscribe && (
                                <span
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSubscribe(plan.slug);
                                    }}
                                    className="ml-1 flex items-center gap-1 text-[10px] uppercase font-black text-emerald-500 hover:underline cursor-pointer"
                                >
                                    Subscribe <ArrowUpRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            {!ownsAny && !isSuperuser && (
                <p className="text-xs text-muted-foreground">
                    You don&apos;t have an active {service} subscription. Subscribe to the Basic tier (7-day free trial) to deploy your first instance.
                </p>
            )}
        </div>
    );
}
