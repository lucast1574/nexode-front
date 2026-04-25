"use client";

import React from "react";
import { Cpu, Database, Workflow, RefreshCw, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PricingPlan {
    id: string;
    name: string;
    slug: string;
    service: string;
    price_monthly: number;
    price_annual: number;
    features?: Record<string, unknown> | null;
}

export interface ServiceTableConfig {
    label: string;
    icon: typeof Cpu;
    accent: string;
    description?: string;
    columns: { key: string; label: string; format?: (v: unknown) => string }[];
}

export const SERVICE_CONFIG: Record<string, ServiceTableConfig> = {
    n8n: {
        label: "n8n Automation",
        icon: Workflow,
        accent: "text-red-400",
        description: "Self-hosted workflow automation. 400+ integrations, custom nodes, unlimited triggers.",
        columns: [
            { key: "executions", label: "EXECUTIONS" },
            { key: "workflows", label: "WORKFLOWS" },
            { key: "compute", label: "COMPUTE" },
        ],
    },
    compute: {
        label: "Compute",
        icon: Cpu,
        accent: "text-blue-400",
        description: "High-performance application containers with auto SSL, custom domains, and edge networking.",
        columns: [
            { key: "type", label: "TYPE" },
            { key: "ram", label: "RAM" },
            { key: "cpu", label: "CPU" },
            {
                key: "storage_mb",
                label: "STORAGE",
                format: (v) => {
                    if (v == null) return "-";
                    const mb = Number(v);
                    if (!Number.isFinite(mb) || mb <= 0) return "-";
                    return mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`;
                },
            },
        ],
    },
    database: {
        label: "Databases",
        icon: Database,
        accent: "text-purple-400",
        description: "Managed PostgreSQL, MongoDB, MySQL, and Redis. Zero-config, automated backups.",
        columns: [
            { key: "type", label: "TYPE" },
            { key: "ram", label: "RAM" },
            { key: "cpu", label: "CPU" },
            { key: "storage", label: "STORAGE" },
        ],
    },
};

/** Order in which services are rendered across the app: n8n first, then compute, then database. */
export const SERVICE_ORDER = ["n8n", "compute", "database"] as const;

export interface PricingTableProps {
    service: string;
    plans: PricingPlan[];
    cycle: "monthly" | "annual";
    /** Slugs of plans the user is already subscribed to (for highlighting/disabling). */
    ownedSlugs?: string[];
    /** Services where the user has already consumed their trial. */
    trialsUsed?: string[];
    /** When provided, shows a "Subscribe" button per row that calls this. */
    onSubscribe?: (slug: string) => void | Promise<void>;
    /** Slug currently being processed (to show spinner). */
    busySlug?: string | null;
    /** Optional select mode: when true, rows act as toggles for `selectedSlug`. */
    selectionMode?: boolean;
    selectedSlug?: string | null;
    onSelect?: (slug: string | null) => void;
}

export function PricingTable({
    service,
    plans,
    cycle,
    ownedSlugs = [],
    trialsUsed = [],
    onSubscribe,
    busySlug,
    selectionMode = false,
    selectedSlug = null,
    onSelect,
}: PricingTableProps) {
    const cfg = SERVICE_CONFIG[service];
    if (!cfg) return null;

    const visiblePlans = plans
        .filter((p) => p.service === service)
        .filter((p) => (p.features as Record<string, unknown>)?.admin_only !== "true")
        .filter((p) => p.price_monthly > 0)
        .sort((a, b) => a.price_monthly - b.price_monthly);

    if (visiblePlans.length === 0) return null;

    const cheapestSlug = visiblePlans[0]?.slug;
    const userOwnsThisService = ownedSlugs.some((s) =>
        visiblePlans.some((p) => p.slug === s)
    );
    const trialAvailable = !trialsUsed.includes(service) && !userOwnsThisService;
    const Icon = cfg.icon;

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2 rounded-lg bg-muted/50", cfg.accent)}>
                    <Icon className="size-5" />
                </div>
                <h3 className="text-xl font-semibold">{cfg.label}</h3>
                {trialAvailable && (
                    <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-black bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    >
                        7-day trial on Basic
                    </Badge>
                )}
            </div>
            {cfg.description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-2xl">{cfg.description}</p>
            )}
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            {selectionMode && <th className="w-10 px-4 py-4"></th>}
                            <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                Plan
                            </th>
                            {cfg.columns.map((c) => (
                                <th
                                    key={c.key}
                                    className="text-left px-4 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground"
                                >
                                    {c.label}
                                </th>
                            ))}
                            <th className="text-right px-4 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                Daily
                            </th>
                            <th className="text-right px-4 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                {cycle === "monthly" ? "Monthly" : "Annual"}
                            </th>
                            {onSubscribe && <th className="px-6 py-4"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {visiblePlans.map((plan) => {
                            const features = (plan.features || {}) as Record<string, unknown>;
                            const price =
                                cycle === "monthly" ? plan.price_monthly : plan.price_annual;
                            const dailyFromFeature =
                                typeof features.daily_price === "number"
                                    ? (features.daily_price as number)
                                    : null;
                            const daily = dailyFromFeature ?? plan.price_monthly / 30;
                            const owned = ownedSlugs.includes(plan.slug);
                            const isCheapest = plan.slug === cheapestSlug;
                            const isSelected = selectionMode && selectedSlug === plan.slug;

                            const rowClick = selectionMode
                                ? () => onSelect?.(isSelected ? null : plan.slug)
                                : undefined;

                            return (
                                <tr
                                    key={plan.id}
                                    onClick={rowClick}
                                    className={cn(
                                        "border-b border-border last:border-0 transition-colors",
                                        selectionMode && "cursor-pointer hover:bg-muted/40",
                                        !selectionMode && "hover:bg-muted/20",
                                        owned && "bg-primary/5",
                                        isSelected && "bg-primary/10 ring-1 ring-primary/40"
                                    )}
                                >
                                    {selectionMode && (
                                        <td className="px-4 py-4">
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                    isSelected
                                                        ? "bg-primary border-primary"
                                                        : "border-muted-foreground/30"
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold capitalize">
                                                {plan.name.replace(/^\w+\s/, "")}
                                            </span>
                                            {owned && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[9px] uppercase font-black bg-primary/10 border-primary/30 text-primary"
                                                >
                                                    Active
                                                </Badge>
                                            )}
                                            {isCheapest && trialAvailable && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[9px] uppercase font-black bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                                >
                                                    Trial
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    {cfg.columns.map((c) => {
                                        const raw = features[c.key];
                                        const display = c.format
                                            ? c.format(raw)
                                            : raw == null
                                                ? "-"
                                                : String(raw);
                                        return (
                                            <td key={c.key} className="px-4 py-4 text-muted-foreground">
                                                {display}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                                        ${daily.toFixed(3)}/day
                                    </td>
                                    <td className="px-4 py-4 text-right font-black tabular-nums">
                                        ${price}
                                        <span className="text-xs font-medium text-muted-foreground">
                                            /{cycle === "monthly" ? "mo" : "yr"}
                                        </span>
                                    </td>
                                    {onSubscribe && (
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant={owned ? "outline" : "default"}
                                                disabled={owned || busySlug === plan.slug}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSubscribe(plan.slug);
                                                }}
                                                className="h-9 font-bold gap-2"
                                            >
                                                {busySlug === plan.slug && (
                                                    <RefreshCw className="size-3.5 animate-spin" />
                                                )}
                                                {owned ? "Active" : "Subscribe"}
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/** Toggle pill used by both billing and services pages to switch monthly/annual. */
export function CycleToggle({
    value,
    onChange,
}: {
    value: "monthly" | "annual";
    onChange: (v: "monthly" | "annual") => void;
}) {
    return (
        <div className="flex gap-2 p-1 bg-muted/40 rounded-lg border border-border">
            <button
                onClick={() => onChange("monthly")}
                className={cn(
                    "px-4 py-2 text-xs uppercase font-black tracking-widest rounded-md transition-colors",
                    value === "monthly"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Monthly
            </button>
            <button
                onClick={() => onChange("annual")}
                className={cn(
                    "px-4 py-2 text-xs uppercase font-black tracking-widest rounded-md transition-colors",
                    value === "annual"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Annual <span className="text-emerald-400/80 ml-1">-17%</span>
            </button>
        </div>
    );
}
