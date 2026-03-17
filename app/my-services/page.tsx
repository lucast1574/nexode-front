"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Cpu, ExternalLink, Shield, Settings, Plus, Workflow, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserSubscription {
    id: string;
    service: string;
    status: string;
    billing_cycle: string;
    plan: {
        name: string;
        features: Record<string, string>;
    };
}

export default function MyServicesPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Placeholder data to show what it looks like
    const demoSubs: UserSubscription[] = [
        {
            id: "1",
            service: "database",
            status: "ACTIVE",
            billing_cycle: "monthly",
            plan: {
                name: "Database Tier 2",
                features: { storage: "1 GB", ram_cpu: "Shared" }
            }
        },
        {
            id: "2",
            service: "compute",
            status: "ACTIVE",
            billing_cycle: "monthly",
            plan: {
                name: "Compute Basic",
                features: { cpu: "1 vCPU", ram: "2 GB" }
            }
        },
        {
            id: "3",
            service: "n8n",
            status: "ACTIVE",
            billing_cycle: "monthly",
            plan: {
                name: "n8n Basic",
                features: { executions: "1,000 /mo", workflows: "3 active" }
            }
        }
    ];

    const activeSubs = demoSubs;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="font-black text-2xl tracking-tighter italic text-primary">NEXODE</Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
                            <Link href="/my-services" className="text-sm font-medium text-white">My Services</Link>
                            <Link href="/services" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Marketplace</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5">
                            Support
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50" />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight">Active Services</h1>
                        <p className="text-zinc-500 text-lg">Manage your cloud infrastructure and active subscriptions.</p>
                    </div>
                    <Button asChild className="rounded-2xl h-12 gap-2 shadow-lg shadow-primary/20">
                        <Link href="/services">
                            <Plus className="w-5 h-5" /> Deploy New Service
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeSubs.map((sub) => {
                            const Icon = sub.service === "database" ? Database : sub.service === "n8n" ? Workflow : Cpu;
                            return (
                                <div key={sub.id} className="group relative bg-white/[0.03] border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.06] transition-all duration-300">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={cn(
                                            "p-4 rounded-2xl",
                                            sub.service === "database" ? "bg-purple-500/20 text-purple-400" :
                                                sub.service === "n8n" ? "bg-red-500/20 text-red-400" :
                                                    "bg-blue-500/20 text-blue-400"
                                        )}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                            {sub.status}
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-2xl font-bold capitalize">{sub.service}</h3>
                                        <p className="text-zinc-400 font-medium">{sub.plan.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        {Object.entries(sub.plan.features).map(([key, val]: [string, string]) => (
                                            <div key={key} className="space-y-1">
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{key}</div>
                                                <div className="text-sm font-semibold">{val}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                                        <Button 
                                            variant="outline" 
                                            title="Check Backend Status"
                                            className="w-11 h-11 p-0 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-400"
                                            onClick={() => window.open(`https://status.nexode.io`, '_blank')} // Fallback or dynamic URL
                                        >
                                            <Activity className="w-5 h-5" />
                                        </Button>
                                        <Button variant="outline" className="flex-1 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 gap-2 h-11">
                                            Console <ExternalLink className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="w-11 h-11 p-0 rounded-xl bg-white/5 hover:bg-white/10">
                                            <Settings className="w-5 h-5 text-zinc-400" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-20 p-8 rounded-[40px] bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-white/5 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-3xl font-bold">Need a custom enterprise solution?</h2>
                            <p className="text-zinc-400 max-w-xl">
                                Our engineering team can help you architect a dedicated environment tailored for high-frequency trading or large scale data processing.
                            </p>
                        </div>
                        <Button size="lg" variant="secondary" className="rounded-2xl px-10 font-bold h-14">
                            Contact Solutions Architecht
                        </Button>
                    </div>
                    <Shield className="absolute -bottom-8 -right-8 w-64 h-64 text-white/[0.02] -rotate-12" />
                </div>
            </main>
        </div>
    );
}
