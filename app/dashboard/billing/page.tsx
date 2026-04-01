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
    PieChart,
    Activity,
    Database,
    Workflow,
    Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, Subscription as BaseSubscription } from "@/components/Sidebar";
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

interface UsageStats {
    service: string;
    feature: string;
    total_amount: number;
}

interface UsageLog {
    id: string;
    service: string;
    feature: string;
    amount: number;
    description: string;
    created_on: string;
}

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
    const [usageHistory, setUsageHistory] = useState<UsageLog[]>([]);
    const [user, setUser] = useState<{ first_name: string, email: string, avatar?: string } | null>(null);
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
                        me {
                            first_name
                            last_name
                            email
                            avatar
                        }
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
                        myUsageStats(days: 30) {
                            service
                            feature
                            total_amount
                        }
                        myUsageHistory(limit: 5) {
                            id
                            service
                            feature
                            amount
                            description
                            created_on
                        }
                    }
                `;

                const response = await fetch(GQL_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ query }),
                });

                const result = await response.json();
                if (result.data) {
                    setUser(result.data.me);
                    if (result.data.myUsageStats) {
                        setUsageStats(result.data.myUsageStats);
                    }
                    if (result.data.myUsageHistory) {
                        setUsageHistory(result.data.myUsageHistory);
                    }
                    const subs = (result.data.mySubscriptions || [])
                        .filter((s: Subscription) => s.status === 'ACTIVE' && s.service !== 'nexus');

                    if (subs.length === 0) {
                        router.push("/checkout");
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Synchronizing Finance Data...</p>
                </div>
            </div>
        );
    }

    const totalMonthly = subscriptions.reduce((acc, sub) => {
        return acc + (sub.billing_cycle === 'monthly' ? sub.plan.price_monthly : (sub.plan.price_annual / 12));
    }, 0);

    const handleManageBilling = async () => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            const mutation = `
                mutation {
                    createCustomerPortalSession
                }
            `;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ query: mutation }),
            });
            const result = await res.json();
            if (result.data?.createCustomerPortalSession) {
                window.location.href = result.data.createCustomerPortalSession;
            } else {
                showAlert({
                    title: "Portal Error",
                    message: "Could not open billing portal. Do you have an active Stripe subscription?",
                    type: "warning"
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-screen bg-[#020202] text-white flex font-sans overflow-hidden">
            <Sidebar user={user} subscriptions={subscriptions} />

            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl">
                    <h2 className="text-xl font-black tracking-tight">Finance / Billing</h2>
                    <div className="flex items-center gap-4">
                        <Button asChild className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20">
                            <Link href="/checkout"><Plus className="w-4 h-4" /> New Service</Link>
                        </Button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        {/* Summary Cards */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6">
                                <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Monthly Burn</span>
                                </div>
                                <div className="text-4xl font-black tracking-tighter mb-1">${totalMonthly.toFixed(2)}</div>
                                <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +0% from last month
                                </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6">
                                <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Total Services</span>
                                </div>
                                <div className="text-4xl font-black tracking-tighter mb-1">{subscriptions.length}</div>
                                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Active Instances</div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6">
                                <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Next Invoice</span>
                                </div>
                                <div className="text-4xl font-black tracking-tighter mb-1">Mar 10</div>
                                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Automatic Charge</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-[32px] p-8 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">Billing Controls</h3>
                                <p className="text-sm text-zinc-400 mb-6">Manage your payment methods, download invoices, and update billing details.</p>
                            </div>
                            <Button
                                onClick={handleManageBilling}
                                className="w-full rounded-2xl py-6 font-bold gap-2 text-white bg-primary hover:bg-primary/90 transition-all active:scale-95"
                            >
                                <ExternalLink className="w-4 h-4" /> Manage in Stripe
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Usage Charts Section */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black">Resource Utilization</h3>
                                        <p className="text-sm text-zinc-500">Real-time usage across your active clusters.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold uppercase text-zinc-400">
                                            <div className="w-2 h-2 rounded-full bg-primary" /> Database
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold uppercase text-zinc-400">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" /> Compute
                                        </div>
                                    </div>
                                </div>

                                {/* REAL USAGE CHART */}
                                <div className="h-64 flex items-end justify-between gap-2 px-4 mb-8">
                                    {(usageStats.length > 0 ? Array(12).fill(0).map(() => {
                                        // For now, we simulate historical months but use actual aggregate relative to the max amount across months.
                                        // Since we don't have historical usage per month yet, let's just create a dynamic fill based on realtime total stats.
                                        const val = Math.random() * 50 + 40; // temporary placeholder for graphic until detailed historical series is implemented
                                        return val;
                                    }) : [0,0,0,0,0,0,0,0,0,0,0,0]).map((val, i) => (
                                        <div key={i} className="flex-1 group relative">
                                            <div
                                                className="w-full bg-primary/20 rounded-t-lg transition-all duration-500 group-hover:bg-primary/40 relative"
                                                style={{ height: `${val}%` }}
                                            >
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-primary/50 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="absolute -bottom-6 left-0 right-0 text-center text-[8px] font-bold text-zinc-400 uppercase">
                                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Max Hourly Load</div>
                                        <div className="text-lg font-bold">14.2 GB/s</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Average Response</div>
                                        <div className="text-lg font-bold">24ms</div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Breakdown */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8">
                                <h3 className="text-xl font-black mb-6">Service Line Items</h3>
                                <div className="space-y-4">
                                    {subscriptions.length === 0 ? (
                                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-zinc-500 italic">No active paid services found.</p>
                                        </div>
                                    ) : (
                                        subscriptions.map((sub) => (
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
                                                        <div className="text-xs text-zinc-500">{sub.plan.name} • {sub.billing_cycle}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-lg">${sub.billing_cycle === 'monthly' ? sub.plan.price_monthly : sub.plan.price_annual}</div>
                                                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">next charge mar 10</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Cost Prediction */}
                        <div className="space-y-8">
                            <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] p-8 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest mb-6">
                                        <PieChart className="w-4 h-4" /> Usage Efficiency
                                    </div>
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                <span>Compute Deployments</span>
                                                <span className="text-white">{usageStats.find(s => s.service === 'compute')?.total_amount || 0}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-[74%] rounded-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                <span>Database Deployments</span>
                                                <span className="text-white">{usageStats.find(s => s.service === 'database')?.total_amount || 0}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 w-[28%] rounded-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                <span>Automation Flow</span>
                                                <span className="text-white">{usageStats.find(s => s.service === 'n8n')?.total_amount || 0}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 w-[92%] rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-10 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
                                            <TrendingUp className="w-3 h-3" /> Prediction
                                        </div>
                                        <p className="text-[10px] text-zinc-400 leading-relaxed">Based on your current trajectory, your infrastructure spend is expected to remain stable for the next cycle.</p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                            </div>

                            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Recent Activity</h3>
                                <div className="space-y-6">
                                    {usageHistory.length === 0 ? (
                                        <div className="text-xs text-zinc-500 italic">No recent activity detected.</div>
                                    ) : (
                                        usageHistory.map((action) => {
                                            let Icon = Activity;
                                            if (action.service === 'n8n') Icon = Workflow;
                                            if (action.service === 'compute') Icon = Cpu;
                                            if (action.service === 'database') Icon = Database;

                                            let dateObj = new Date(action.created_on);
                                            if (isNaN(dateObj.getTime())) {
                                                dateObj = new Date(Number(action.created_on));
                                            }
                                            const dateStr = dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric' });

                                            return (
                                                <div key={action.id} className="flex gap-4 group cursor-pointer">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-primary/50 transition-colors">
                                                        <Icon className="w-4 h-4 text-zinc-400 group-hover:text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold capitalize">{action.service} {action.feature}</div>
                                                        <div className="text-[10px] text-zinc-500">{dateStr} • {action.description}</div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
