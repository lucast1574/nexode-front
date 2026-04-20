"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Database, Cpu, Workflow, ArrowRight, Shield, Globe, CreditCard, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PublicNav } from "@/components/PublicNav";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";

interface Subscription {
    id: string;
    service: string;
    status: string;
    billing_cycle: string;
    created_on: string;
    plan: {
        name: string;
        price_monthly: number;
        price_annual: number;
    };
}

export default function CheckoutPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const { showAlert } = useModal();

    useEffect(() => {
        const fetchCurrentSubs = async () => {
            const token = getAccessToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
                const query = `
                    query GetUserSubs {
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
                            }
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
                if (result.data?.mySubscriptions) {
                    const activeSubs = result.data.mySubscriptions
                        .filter((s: { status: string; service: string }) => s.status === 'ACTIVE' && s.service !== 'nexus');
                    setSubscriptions(activeSubs);
                }
            } catch (err) {
                console.error("Error fetching current subs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentSubs();
    }, []);

    const handleManageBilling = async () => {
        try {
            const token = getAccessToken();
            if (!token) {
                showAlert({
                    title: "Authentication Required",
                    message: "Please log in to manage your subscriptions.",
                    type: "warning"
                });
                return;
            }
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
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
            </div>

            <PublicNav />

            <header className="relative z-10 pt-20 pb-16 px-6 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                    Manage Your <span className="text-primary italic underline decoration-primary/30 decoration-8 underline-offset-8">Infrastructure</span>
                </h1>
                <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                    Review your active subscriptions. Each plan you add increases your limits to deploy new databases, compute clusters, or n8n instances.
                </p>
                
                <div className="mt-8">
                    <Button render={<Link href="/services" />} nativeButton={false} size="lg" className="rounded-full shadow-lg shadow-primary/20 px-8 text-lg font-bold gap-2">
                            <Plus className="w-5 h-5" /> Add Service
                        </Button>
                </div>
            </header>

            <main className="relative z-10 pb-40 px-6 max-w-4xl mx-auto">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 mb-12 shadow-xl shadow-black">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <Database className="w-6 h-6 text-primary" /> Tus Suscripciones Activas
                    </h2>
                    
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-24 bg-white/5 rounded-lg w-full"></div>
                            <div className="h-24 bg-white/5 rounded-lg w-full"></div>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-lg">
                            <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Shield className="w-8 h-8 text-zinc-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No active subscriptions</h3>
                            <p className="text-zinc-500 mb-6">Subscribe to a plan to start deploying infrastructure.</p>
                            <Button render={<Link href="/services" />} nativeButton={false} variant="outline" className="rounded-full border-white/20 hover:bg-white/10">
                                Explore Services
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subscriptions.map((sub, index) => {
                                let Icon = Database;
                                let color = "text-purple-400 bg-purple-500/10";
                                if (sub.service === "n8n") {
                                    Icon = Workflow;
                                    color = "text-red-400 bg-red-500/10";
                                } else if (sub.service === "compute") {
                                    Icon = Cpu;
                                    color = "text-blue-400 bg-blue-500/10";
                                }

                                const isAnnual = sub.billing_cycle === 'annual';
                                const price = isAnnual ? sub.plan.price_annual : sub.plan.price_monthly;

                                return (
                                    <div key={sub.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/[0.03] border border-white/10 rounded-lg hover:bg-white/[0.05] transition-all group">
                                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                            <div className={cn("p-4 rounded-xl", color)}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">{sub.service} Cluster</div>
                                                <div className="text-xl font-semibold">{sub.plan.name || "Custom Plan"}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-2">
                                            <div className="text-2xl font-bold">${price} <span className="text-sm font-normal text-zinc-500">/{isAnnual ? 'yr' : 'mo'}</span></div>
                                            <Button onClick={handleManageBilling} variant="outline" size="sm" className="rounded-xl border-white/20 group-hover:bg-white/10 gap-2">
                                                <Settings className="w-4 h-4" /> Manage Plan
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="text-center mt-12 bg-primary/10 border border-primary/20 rounded-xl p-10">
                    <h3 className="text-2xl font-bold mb-4">Need more capacity?</h3>
                    <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                        Increase your database, compute, or n8n workflow limits by adding additional subscriptions to your account.
                    </p>
                    <Button render={<Link href="/services" />} nativeButton={false} size="lg" className="rounded-full shadow-xl shadow-primary/20 px-10 text-lg font-bold gap-3 transition-transform hover:scale-105">
                            Add Service <ArrowRight className="w-5 h-5" />
                        </Button>
                </div>
            </main>

            <footer className="relative z-10 py-12 px-6 border-t border-white/5 text-center text-zinc-400 text-sm">
                <div className="flex items-center justify-center gap-8 mb-6 text-zinc-400 flex-wrap">
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Trusted Enterprise Grade</div>
                    <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Secure Stripe Payment</div>
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Global Infrastructure</div>
                </div>
                © {new Date().getFullYear()} Nexode Technologies. All rights reserved.
            </footer>
        </div>
    );
}
