"use client";

import React from "react";
import { Workflow, Zap, GitBranch, Terminal, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

export default function AutomationsPage() {
    // Mock data for the placeholder
    const user = { first_name: "Nexus User", email: "user@nexode.com" };
    const subscriptions = [
        { id: "1", service: "n8n", status: "ACTIVE", plan: { name: "n8n Ultra", slug: "n8n-ultra", features: {} } },
        { id: "2", service: "database", status: "ACTIVE", plan: { name: "DB Tier 1", slug: "db-tier-1", features: {} } }
    ];

    return (
        <div className="h-screen bg-[#020202] text-white flex overflow-hidden">
            <Sidebar user={user} subscriptions={subscriptions} />

            <main className="flex-1 flex flex-col overflow-hidden relative">

                {/* Background Glow */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full" />

                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <Workflow className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-xl font-black tracking-tight">Automations (n8n)</h2>
                    </div>
                    <Button className="rounded-2xl gap-2 font-bold bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
                        Launch Designer
                    </Button>
                </header>

                <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center text-center z-10">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                        <div className="w-24 h-24 rounded-[32px] bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center relative">
                            <Zap className="w-12 h-12 text-emerald-500" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black mb-4 tracking-tighter">Workflow Orchestration</h1>
                    <p className="text-zinc-500 max-w-lg mx-auto text-lg mb-12">
                        Connect over 400+ apps and automate your entire business logic with the power of n8n.
                        Integrated natively into the Nexode stack.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        {[
                            { icon: GitBranch, title: "Visual Logic", desc: "Build complex branching workflows without code." },
                            { icon: Terminal, title: "Custom JS Nodes", desc: "Execute custom snippets for complex data mapping." },
                            { icon: Zap, title: "Real-time Triggers", desc: "React to webhooks, database changes, or schedules." }
                        ].map((feat, i) => (
                            <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] hover:border-emerald-500/20 transition-all group">
                                <feat.icon className="w-8 h-8 text-zinc-400 group-hover:text-emerald-500 transition-colors mb-4 mx-auto" />
                                <h3 className="font-bold text-white mb-2">{feat.title}</h3>
                                <p className="text-sm text-zinc-500">{feat.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 flex gap-4">
                        <Button variant="outline" className="rounded-2xl h-14 px-8 border-white/10 hover:bg-white/5 font-bold">
                            View Templates
                        </Button>
                        <Button className="rounded-2xl h-14 px-8 bg-white text-black hover:bg-zinc-200 font-bold">
                            Go to Console <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
