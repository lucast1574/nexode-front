"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    TrendingUp,
    DollarSign,
    Clock,
    Zap,
    ExternalLink,
    Database,
    Workflow,
    Cpu,
    Trash2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Subscription as BaseSubscription } from "@/app/dashboard/layout";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_annual: number;
    service: string;
    features?: Record<string, string | number | boolean | null>;
}

interface UserTrialInfo {
    trial_used?: boolean;
    trials_used?: string[];
}

interface Subscription extends BaseSubscription {
    billing_cycle: string;
    created_on: string;
    plan: BaseSubscription['plan'] & {
        price_monthly: number;
        price_annual: number;
    };
}

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [trialInfo, setTrialInfo] = useState<UserTrialInfo>({});
    const [globalCycle, setGlobalCycle] = useState<'monthly' | 'annual'>('monthly');
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [managingSub, setManagingSub] = useState<Subscription | null>(null);
    const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>("");
    const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('monthly');
    const [processing, setProcessing] = useState(false);
    
    const router = useRouter();
    const { showAlert, showConfirm } = useModal();

    const fetchData = async () => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
            if (!token) return;

            const query = `
                query GetBillingData {
                    mySubscriptions {
                        id
                        service
                        status
                        billing_cycle
                        created_on
                        expired_at
                        plan {
                            name
                            slug
                            price_monthly
                            price_annual
                            features
                        }
                    }
                    availablePlans {
                        id
                        name
                        slug
                        price_monthly
                        price_annual
                        service
                        features
                    }
                    me {
                        trial_used
                        trials_used
                    }
                }
            `;

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify({ query }),
            });

            const result = await response.json();
            if (result.data) {
                // Show ACTIVE and TRIALING (uppercase) subscriptions on the billing page —
                // trial subs are real billing entities that the user should see and manage.
                const subs = (result.data.mySubscriptions || [])
                    .filter((s: Subscription) => ['ACTIVE', 'TRIALING'].includes(s.status) && s.service !== 'nexus');
                
                setSubscriptions(subs);
                setAvailablePlans(result.data.availablePlans || []);
                setTrialInfo({
                    trial_used: result.data.me?.trial_used,
                    trials_used: result.data.me?.trials_used || [],
                });
            }
        } catch (error) {
            console.error("Billing fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [router]);

    const handleCancelSubscription = async (subId: string) => {
        showConfirm({
            title: "Cancel Subscription",
            message: "Are you sure you want to cancel this plan? You will lose access to the associated services immediately.",
            type: "warning",
            confirmText: "Yes, Cancel",
            onConfirm: async () => {
                setProcessing(true);
                try {
                    const token = getAccessToken();
                    const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
                    const mutation = `
                        mutation CancelSub($id: String!) {
                            cancelSubscription(subscriptionId: $id)
                        }
                    `;
                    
                    const res = await fetch(GQL_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ query: mutation, variables: { id: subId } }),
                    });
                    
                    const result = await res.json();
                    if (result.data?.cancelSubscription) {
                        showAlert({ title: "Cancelled", message: "Subscription cancelled successfully.", type: "success" });
                        fetchData();
                    } else {
                        throw new Error(result.errors?.[0]?.message || "Failed to cancel");
                    }
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Failed to cancel";
                    showAlert({ title: "Error", message, type: "error" });
                } finally {
                    setProcessing(false);
                }
            }
        });
    };

    const handleUpdateSubscription = async () => {
        if (!managingSub || !selectedPlanSlug) return;
        
        setProcessing(true);
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
            const mutation = `
                mutation UpdateSub($subId: String!, $slug: String!, $cycle: String!) {
                    updateSubscription(subscriptionId: $subId, planSlug: $slug, billingCycle: $cycle) {
                        id
                        status
                    }
                }
            `;
            
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ 
                    query: mutation, 
                    variables: { 
                        subId: managingSub.id, 
                        slug: selectedPlanSlug,
                        cycle: selectedCycle
                    } 
                }),
            });
            
            const result = await res.json();
            if (result.data?.updateSubscription) {
                showAlert({ title: "Updated", message: "Your plan has been updated successfully.", type: "success" });
                setManagingSub(null);
                fetchData();
            } else {
                throw new Error(result.errors?.[0]?.message || "Failed to update");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update";
            showAlert({ title: "Error", message, type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm animate-pulse">Synchronizing Billing...</p>
                </div>
            </div>
        );
    }

    const totalMonthly = subscriptions.reduce((acc, sub) => {
        return acc + (sub.billing_cycle === 'monthly' ? sub.plan.price_monthly : (sub.plan.price_annual / 12));
    }, 0);

    const getNextBillingDate = (createdOn: string, billingCycle: string) => {
        let dateObj = new Date(createdOn);
        if (isNaN(dateObj.getTime())) dateObj = new Date(Number(createdOn));
        const now = new Date();
        const cycle = (billingCycle || 'monthly').toLowerCase();
        while (dateObj <= now) {
            if (cycle === 'annual' || cycle === 'yearly') {
                dateObj.setFullYear(dateObj.getFullYear() + 1);
            } else {
                dateObj.setMonth(dateObj.getMonth() + 1);
            }
        }
        return dateObj;
    };

    const nextInvoiceDate = subscriptions.length > 0
        ? subscriptions.reduce((closest, sub) => {
            const next = getNextBillingDate(sub.created_on, sub.billing_cycle);
            if (!closest) return next;
            return next < closest ? next : closest;
        }, null as Date | null)
        : null;

    const nextInvoiceStr = nextInvoiceDate
        ? nextInvoiceDate.toLocaleString('en-US', { month: 'short', day: 'numeric' })
        : 'N/A';

    const handleSubscribe = async (planSlug: string, cycle: 'monthly' | 'annual') => {
        setCheckoutLoading(planSlug);
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!) {
                    createCheckoutSession(items: $items)
                }
            `;
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    query: mutation,
                    variables: { items: [{ planSlug, billingCycle: cycle }] },
                }),
            });
            const result = await res.json();
            if (result.data?.createCheckoutSession) {
                window.location.href = result.data.createCheckoutSession;
            } else {
                throw new Error(result.errors?.[0]?.message || "Checkout failed");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Checkout failed";
            showAlert({ title: "Error", message, type: "error" });
        } finally {
            setCheckoutLoading(null);
        }
    };

    // Map service → display config (label, icon, columns to show in the pricing table)
    const SERVICE_CONFIG: Record<string, {
        label: string;
        icon: typeof Cpu;
        accent: string;
        columns: { key: string; label: string; format?: (v: unknown) => string }[];
    }> = {
        compute: {
            label: 'Compute',
            icon: Cpu,
            accent: 'text-blue-400',
            columns: [
                { key: 'type', label: 'TYPE' },
                { key: 'ram', label: 'RAM' },
                { key: 'cpu', label: 'CPU' },
                { key: 'storage_mb', label: 'STORAGE', format: (v) => v ? `${v} MB` : '-' },
            ],
        },
        database: {
            label: 'Databases',
            icon: Database,
            accent: 'text-purple-400',
            columns: [
                { key: 'type', label: 'TYPE' },
                { key: 'ram', label: 'RAM' },
                { key: 'cpu', label: 'CPU' },
                { key: 'storage', label: 'STORAGE' },
            ],
        },
        n8n: {
            label: 'n8n Automation',
            icon: Workflow,
            accent: 'text-red-400',
            columns: [
                { key: 'executions', label: 'EXECUTIONS' },
                { key: 'workflows', label: 'WORKFLOWS' },
                { key: 'compute', label: 'COMPUTE' },
            ],
        },
    };

    const renderServiceTable = (service: string) => {
        const cfg = SERVICE_CONFIG[service];
        if (!cfg) return null;
        const plans = availablePlans
            .filter(p => p.service === service)
            .filter(p => (p.features as Record<string, unknown>)?.admin_only !== 'true')
            .filter(p => p.price_monthly > 0)
            .sort((a, b) => a.price_monthly - b.price_monthly);
        if (plans.length === 0) return null;

        const cheapestSlug = plans[0]?.slug;
        const trialAvailable = !trialInfo.trial_used && !(trialInfo.trials_used || []).includes(service);
        const userOwnsThisService = subscriptions.some(s => s.service === service);
        const Icon = cfg.icon;

        return (
            <div key={service} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn("p-2 rounded-lg bg-muted/50", cfg.accent)}>
                        <Icon className="size-5" />
                    </div>
                    <h3 className="text-xl font-semibold">{cfg.label}</h3>
                    {trialAvailable && !userOwnsThisService && (
                        <Badge variant="outline" className="text-[10px] uppercase font-black bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                            7-day trial on Basic
                        </Badge>
                    )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Plan</th>
                                {cfg.columns.map(c => (
                                    <th key={c.key} className="text-left px-4 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">{c.label}</th>
                                ))}
                                <th className="text-right px-4 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Daily</th>
                                <th className="text-right px-4 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">{globalCycle === 'monthly' ? 'Monthly' : 'Annual'}</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(plan => {
                                const features = (plan.features || {}) as Record<string, unknown>;
                                const price = globalCycle === 'monthly' ? plan.price_monthly : plan.price_annual;
                                const dailyFromFeature = typeof features.daily_price === 'number' ? features.daily_price as number : null;
                                const daily = dailyFromFeature ?? (plan.price_monthly / 30);
                                const owned = subscriptions.some(s => s.service === service && s.plan.slug === plan.slug);
                                const isCheapest = plan.slug === cheapestSlug;
                                return (
                                    <tr key={plan.id} className={cn(
                                        "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                                        owned && "bg-primary/5"
                                    )}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold capitalize">{plan.name.replace(/^\w+\s/, '')}</span>
                                                {owned && <Badge variant="outline" className="text-[9px] uppercase font-black bg-primary/10 border-primary/30 text-primary">Active</Badge>}
                                                {isCheapest && trialAvailable && !userOwnsThisService && (
                                                    <Badge variant="outline" className="text-[9px] uppercase font-black bg-emerald-500/10 border-emerald-500/30 text-emerald-500">Trial</Badge>
                                                )}
                                            </div>
                                        </td>
                                        {cfg.columns.map(c => {
                                            const raw = features[c.key];
                                            const display = c.format ? c.format(raw) : (raw == null ? '-' : String(raw));
                                            return <td key={c.key} className="px-4 py-4 text-muted-foreground">{display}</td>;
                                        })}
                                        <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">${daily.toFixed(3)}/day</td>
                                        <td className="px-4 py-4 text-right font-black tabular-nums">
                                            ${price}<span className="text-xs font-medium text-muted-foreground">/{globalCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant={owned ? "outline" : "default"}
                                                disabled={owned || checkoutLoading === plan.slug}
                                                onClick={() => handleSubscribe(plan.slug, globalCycle)}
                                                className="h-9 font-bold gap-2"
                                            >
                                                {checkoutLoading === plan.slug && <RefreshCw className="size-3.5 animate-spin" />}
                                                {owned ? 'Active' : 'Subscribe'}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const handleManageBilling = async () => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            const mutation = `mutation { createCustomerPortalSession }`;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify({ query: mutation }),
            });
            const result = await res.json();
            if (result.data?.createCustomerPortalSession) {
                window.location.href = result.data.createCustomerPortalSession;
            } else {
                showAlert({
                    title: "Portal Error",
                    message: "Could not open billing portal. Do you have an active Stripe subscription?",
                    type: "warning",
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Billing</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex-1" />
                <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
                    <Plus className="size-4" /> New Service
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
                    <p className="text-muted-foreground">Manage payment methods, invoices, and cloud usage costs.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                <DollarSign className="size-4" />
                                <span className="text-xs font-medium">Monthly Cost</span>
                            </div>
                            <div className="text-4xl font-bold tracking-tight mb-1">${totalMonthly.toFixed(2)}</div>
                            <div className="text-xs text-primary font-bold flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Stable
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                <Zap className="size-4" />
                                <span className="text-xs font-medium">Active Plans</span>
                            </div>
                            <div className="text-4xl font-bold tracking-tight mb-1">{subscriptions.length}</div>
                            <div className="text-xs text-muted-foreground">Subscriptions</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                <Clock className="size-4" />
                                <span className="text-xs font-medium">Next Invoice</span>
                            </div>
                            <div className="text-4xl font-bold tracking-tight mb-1">{nextInvoiceStr}</div>
                            <div className="text-xs text-muted-foreground">Auto-charge</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 flex flex-col justify-between">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-bold mb-2">Payment Portal</h3>
                            <p className="text-xs text-muted-foreground mb-4">Manage cards, invoices & billing details.</p>
                            <Button
                                onClick={handleManageBilling}
                                size="sm"
                                className="w-full font-bold gap-2"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> Open Stripe
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* PRICING TABLES — grouped by service, styled like the design refs */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Available Plans</h2>
                            <p className="text-muted-foreground text-sm">Subscribe to add new services or upgrade your tiers.</p>
                        </div>
                        <div className="flex gap-2 p-1 bg-muted/40 rounded-lg border border-border">
                            <button
                                onClick={() => setGlobalCycle('monthly')}
                                className={cn(
                                    "px-4 py-2 text-xs uppercase font-black tracking-widest rounded-md transition-colors",
                                    globalCycle === 'monthly' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >Monthly</button>
                            <button
                                onClick={() => setGlobalCycle('annual')}
                                className={cn(
                                    "px-4 py-2 text-xs uppercase font-black tracking-widest rounded-md transition-colors",
                                    globalCycle === 'annual' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >Annual <span className="text-emerald-400/80 ml-1">-17%</span></button>
                        </div>
                    </div>
                    {renderServiceTable('compute')}
                    {renderServiceTable('database')}
                    {renderServiceTable('n8n')}
                </div>

                <Card className="bg-card border-border">
                    <CardContent className="p-8">
                        <h3 className="text-xl font-semibold mb-6">Your Subscriptions</h3>
                        <div className="flex flex-col gap-4">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between p-6 bg-muted-foreground/5 border border-border hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "p-3 rounded-lg",
                                            sub.service === 'database' ? 'bg-purple-500/20 text-purple-400' :
                                                sub.service === 'n8n' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                        )}>
                                            {sub.service === 'database' ? <Database className="size-6" /> :
                                                sub.service === 'n8n' ? <Workflow className="size-6" /> : <Cpu className="size-6" />}
                                        </div>
                                        <div>
                                            <div className="font-black text-lg capitalize">{sub.service} Cluster</div>
                                            <div className="text-xs font-medium text-muted-foreground mt-0.5">
                                                <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0 bg-primary/5 border-primary/20 text-primary">{sub.plan.name}</Badge>
                                                {sub.status === 'TRIALING' && (
                                                    <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0 ml-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">trial</Badge>
                                                )}
                                                <Separator orientation="vertical" className="inline-block h-3 mx-3 align-middle" />
                                                <span className="uppercase tracking-widest">{sub.billing_cycle}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <div className="font-black text-xl tracking-tighter">
                                                ${sub.billing_cycle === 'monthly' ? sub.plan.price_monthly : sub.plan.price_annual}
                                                <span className="text-sm font-medium text-muted-foreground ml-1">/{sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                                            </div>
                                            <div className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest mt-1">
                                                {sub.status === 'TRIALING' && sub.expired_at
                                                    ? `trial ends: ${new Date(sub.expired_at).toLocaleString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()}`
                                                    : `next: ${getNextBillingDate(sub.created_on, sub.billing_cycle).toLocaleString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()}`}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-9 font-bold gap-2 bg-primary/5 border-primary/10 hover:bg-primary/10"
                                                onClick={() => {
                                                    setManagingSub(sub);
                                                    setSelectedPlanSlug(sub.plan.slug);
                                                    setSelectedCycle(sub.billing_cycle as 'monthly' | 'annual');
                                                }}
                                            >
                                                <RefreshCw className="size-3.5" /> Upgrade
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleCancelSubscription(sub.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Manage Subscription Modal */}
            <Dialog open={!!managingSub} onOpenChange={(open: boolean) => !open && setManagingSub(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Adjust Infrastructure</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Scale your <span className="text-white font-bold capitalize">{managingSub?.service}</span> cluster levels.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Select Architecture</label>
                            <Select value={selectedPlanSlug} onValueChange={(val: string | null) => setSelectedPlanSlug(val || "")}>
                                <SelectTrigger className="h-14 font-bold text-lg bg-muted/50 border-white/10">
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePlans
                                        .filter(p => p.service === managingSub?.service)
                                        .map(plan => (
                                            <SelectItem key={plan.id} value={plan.slug} className="py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{plan.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ${selectedCycle === 'monthly' ? plan.price_monthly : plan.price_annual} / {selectedCycle === 'monthly' ? 'mo' : 'yr'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Billing Frequency</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setSelectedCycle('monthly')}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                                        selectedCycle === 'monthly' 
                                            ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                                            : "bg-muted/50 border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <span className="font-black text-sm uppercase">Monthly</span>
                                    <span className="text-[10px] text-muted-foreground">Flexibility</span>
                                </button>
                                <button
                                    onClick={() => setSelectedCycle('annual')}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                                        selectedCycle === 'annual' 
                                            ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                                            : "bg-muted/50 border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <span className="font-black text-sm uppercase">Annual</span>
                                    <span className="text-[10px] text-emerald-400/80 font-bold italic">20% Discounted</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between items-center bg-muted/30 -mx-6 -mb-6 p-6 mt-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-muted-foreground">New Total</span>
                            <span className="text-2xl font-black">
                                ${
                                    selectedCycle === 'monthly' 
                                        ? availablePlans.find(p => p.slug === selectedPlanSlug)?.price_monthly 
                                        : availablePlans.find(p => p.slug === selectedPlanSlug)?.price_annual
                                }
                                <span className="text-sm font-medium text-muted-foreground">/{selectedCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </span>
                        </div>
                        <Button 
                            className="h-12 px-8 font-black uppercase tracking-widest gap-2"
                            onClick={handleUpdateSubscription}
                            disabled={processing || selectedPlanSlug === managingSub?.plan.slug && selectedCycle === managingSub?.billing_cycle}
                        >
                            {processing && <RefreshCw className="size-4 animate-spin" />}
                            Apply Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}