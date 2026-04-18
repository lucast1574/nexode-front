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
    Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Subscription as BaseSubscription } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";

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
    const router = useRouter();
    const { showAlert } = useModal();

    useEffect(() => {
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
                            plan {
                                name
                                price_monthly
                                price_annual
                                features
                            }
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
                    const subs = (result.data.mySubscriptions || [])
                        .filter((s: Subscription) => s.status === 'ACTIVE' && s.service !== 'nexus');
                    if (subs.length === 0) {
                        router.push("/services");
                        return;
                    }
                    setSubscriptions(subs);
                }
            } catch (error) {
                console.error("Billing fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Synchronizing Billing...</p>
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
            <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                <h2 className="text-xl font-black tracking-tight">Billing</h2>
                <div className="flex items-center gap-4">
                    <Button asChild className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20">
                        <Link href="/services"><Plus className="w-4 h-4" /> New Service</Link>
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                    <Card className="bg-white/[0.03] border-white/5 rounded-[32px]">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Monthly Cost</span>
                            </div>
                            <div className="text-4xl font-black tracking-tighter mb-1">${totalMonthly.toFixed(2)}</div>
                            <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Stable
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/5 rounded-[32px]">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                <Zap className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Active Plans</span>
                            </div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{subscriptions.length}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Subscriptions</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/5 rounded-[32px]">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Next Invoice</span>
                            </div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{nextInvoiceStr}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Auto-charge</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 flex flex-col justify-between">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-bold mb-2">Payment Portal</h3>
                            <p className="text-xs text-zinc-400 mb-4">Manage cards, invoices & billing details.</p>
                            <Button
                                onClick={handleManageBilling}
                                size="sm"
                                className="w-full rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> Open Stripe
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-white/[0.03] border-white/5 rounded-[40px]">
                    <CardContent className="p-8">
                        <h3 className="text-xl font-black mb-6">Subscriptions</h3>
                        <div className="space-y-4">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-3 rounded-xl",
                                            sub.service === 'database' ? 'bg-purple-500/20 text-purple-400' :
                                                sub.service === 'n8n' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                        )}>
                                            {sub.service === 'database' ? <Database className="w-5 h-5" /> :
                                                sub.service === 'n8n' ? <Workflow className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-bold capitalize">{sub.service} Cluster</div>
                                            <div className="text-xs text-zinc-500">{sub.plan.name} <Separator orientation="vertical" className="inline-block h-3 mx-2" /> {sub.billing_cycle}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-lg">
                                            ${sub.billing_cycle === 'monthly' ? sub.plan.price_monthly : sub.plan.price_annual}
                                            <span className="text-sm font-normal text-zinc-500">/{sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">
                                            next: {getNextBillingDate(sub.created_on, sub.billing_cycle).toLocaleString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}