"use client";

import React from "react";
import Link from "next/link";
import {
    Database,
    Cpu,
    Plus,
    ExternalLink,
    ChevronRight,
    Search,
    Zap,
    Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useDashboard } from "./layout";

export default function DashboardPage() {
    const { subscriptions } = useDashboard();

    return (
        <>
            <header className="h-28 border-b border-white/5 px-12 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4 bg-white/5 px-6 py-3.5 rounded-2xl border border-white/10 w-[450px] transition-all focus-within:border-primary/50 focus-within:bg-white/10">
                    <Search className="w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search instances, services..."
                        className="bg-transparent border-none outline-none text-base w-full placeholder:text-zinc-500 font-medium"
                    />
                </div>

                <div className="flex items-center gap-6">
                    <NotificationBell />
                    <Button asChild className="rounded-2xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20 text-base">
                        <Link href="/services"><Plus className="w-5 h-5" /> New Service</Link>
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-8 py-24 max-w-7xl mx-auto w-full">
                <div className="mb-20">
                    <h1 className="text-4xl font-black tracking-tight mb-4">System Overview</h1>
                    <p className="text-zinc-500 text-lg">Monitor and manage your active cloud resources.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {subscriptions.map((sub) => {
                        const isHighestTier =
                            sub.plan.name.toLowerCase().includes("ultra") ||
                            sub.plan.name.toLowerCase().includes("tier 4") ||
                            (sub.service === "compute" && sub.plan.name.toLowerCase().includes("pro"));

                        return (
                            <div key={sub.id} className={cn(
                                "group relative border rounded-[32px] p-8 transition-all duration-500 flex flex-col",
                                sub.service === "n8n"
                                    ? "bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 hover:bg-red-500/15"
                                    : sub.service === "compute"
                                        ? "bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 hover:bg-blue-500/15"
                                        : sub.service === "database"
                                            ? "bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 hover:bg-purple-500/15"
                                            : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                            )}>
                                <Link
                                    href={sub.service === "database" ? "/dashboard/databases" : sub.service === "n8n" ? "/dashboard/automations" : sub.service === "compute" ? "/dashboard/compute" : "#"}
                                    className="flex-1"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-inner",
                                            sub.service === "database" ? "bg-purple-500/20 text-purple-400" :
                                                sub.service === "n8n" ? "bg-red-500/20 text-red-400" :
                                                    "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {sub.service === "database" ? <Database className="w-8 h-8" /> :
                                                sub.service === "n8n" ? <Workflow className="w-8 h-8" /> :
                                                    <Cpu className="w-8 h-8" />}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                {sub.status}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Active Runtime</div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-2xl font-black capitalize">{sub.service} {sub.service === 'n8n' ? 'Flow' : 'Cluster'}</h3>
                                        <p className="text-zinc-500 font-medium text-sm">{sub.plan.name} Instance</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        {Object.entries(sub.plan.features).slice(0, 4).map(([key, val]: [string, string]) => (
                                            <div key={key} className="space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">{key}</div>
                                                <div className="text-sm font-bold text-zinc-200">{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Link>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">

                                        <Button asChild className="flex-1 rounded-xl h-11 font-bold gap-2">
                                            <Link href={
                                                sub.service === "database" ? "/dashboard/databases" :
                                                    sub.service === "n8n" ? "/dashboard/automations" :
                                                        sub.service === "compute" ? "/dashboard/compute" : "#"
                                            }>
                                                Open Console <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="w-11 h-11 p-0 rounded-xl bg-white/5 border-white/10 hover:bg-white/10">
                                            <ChevronRight className="w-5 h-5 text-zinc-400" />
                                        </Button>
                                    </div>

                                    {!isHighestTier && (
                                        <Button asChild variant="ghost" className="w-full rounded-xl h-11 font-bold gap-2 text-primary hover:bg-primary/10 hover:text-primary">
                                            <Link href="/services"><Zap className="w-4 h-4" /> Upgrade Plan</Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Missing services placeholders */}
                    {(() => {
                        const hasService = (id: string) => subscriptions.some(s => s.service === id);
                        const missing = [];
                        if (!hasService('n8n')) missing.push({ id: 'n8n', title: 'n8n Automation', color: 'border-red-500/20' });
                        if (!hasService('database')) missing.push({ id: 'database', title: 'Database Cluster', color: 'border-purple-500/20' });
                        if (!hasService('compute')) missing.push({ id: 'compute', title: 'Compute Instance', color: 'border-blue-500/20' });

                        return missing.map(svc => (
                            <div key={svc.id} className={cn("relative group border border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center text-center transition-all bg-white/[0.01] hover:bg-white/[0.03]", svc.color)}>
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-zinc-400" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Add {svc.title}</h3>
                                <p className="text-xs text-zinc-500 mb-6 max-w-[200px]">Provision this resource to expand your infrastructure.</p>
                                <Button asChild size="sm" variant="outline" className="rounded-xl border-zinc-800 text-zinc-400 hover:text-white hover:bg-white/5">
                                    <Link href="/services">Provision Now</Link>
                                </Button>
                            </div>
                        ));
                    })()}
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Upgrade Performance</h3>
                            <p className="text-sm text-zinc-400 max-w-xs mb-6">Need more compute power? Upscale your instances with zero downtime.</p>
                            <Button asChild size="sm" variant="outline" className="rounded-xl border-primary/50 text-primary hover:bg-primary/20">
                                <Link href="/services">View Tiers</Link>
                            </Button>
                        </div>
                        <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8">
                        <h3 className="text-xl font-bold mb-4">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Services</span>
                                <span className="font-bold text-emerald-400">{subscriptions.length} Active</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400" style={{ width: '100%' }} />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Infrastructure</span>
                                <span className="font-bold text-primary">Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
