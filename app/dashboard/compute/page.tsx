"use client";

import React from "react";
import { Cpu, Rocket, Clock, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

export default function ComputePage() {
    // Mock data for the placeholder
    const user = { first_name: "Nexus User", email: "user@nexode.com" };
    const subscriptions = [
        { id: "1", service: "compute", status: "ACTIVE", plan: { name: "Compute Pro", slug: "compute-pro", features: {} } },
        { id: "2", service: "database", status: "ACTIVE", plan: { name: "DB Tier 1", slug: "db-tier-1", features: {} } }
    ];

    return (
        <div className="h-screen bg-[#020202] text-white flex overflow-hidden">
            <Sidebar user={user} subscriptions={subscriptions} />

            <main className="flex-1 flex flex-col overflow-hidden relative">

                {/* Background Glow */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />

                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <Cpu className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-black tracking-tight">Cloud Compute</h2>
                    </div>
                    <Button className="rounded-2xl gap-2 font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                        Deploy New Instance
                    </Button>
                </header>

                <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center text-center z-10">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                        <div className="w-24 h-24 rounded-[32px] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center relative">
                            <Rocket className="w-12 h-12 text-blue-500" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black mb-4 tracking-tighter">Scalable Cloud Compute</h1>
                    <p className="text-zinc-500 max-w-lg mx-auto text-lg mb-12">
                        Deploy and manage high-performance virtual machines with dedicated resources in seconds.
                        Our compute engine is currently under final optimization.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        {[
                            { icon: Clock, title: "Nano-Second Latency", desc: "Global distribution for minimal lag." },
                            { icon: Shield, title: "VPC Networking", desc: "Isolated networks with custom firewalls." },
                            { icon: Cpu, title: "Dedicated vCPU", desc: "Guaranteed performance for heavy loads." }
                        ].map((feat, i) => (
                            <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] hover:border-blue-500/20 transition-all group">
                                <feat.icon className="w-8 h-8 text-zinc-400 group-hover:text-blue-500 transition-colors mb-4 mx-auto" />
                                <h3 className="font-bold text-white mb-2">{feat.title}</h3>
                                <p className="text-sm text-zinc-500">{feat.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 flex gap-4">
                        <Button variant="outline" className="rounded-2xl h-14 px-8 border-white/10 hover:bg-white/5 font-bold">
                            View Roadmap
                        </Button>
                        <Button className="rounded-2xl h-14 px-8 bg-white text-black hover:bg-zinc-200 font-bold">
                            Join Beta Waitlist <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
