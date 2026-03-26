"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Workflow, Zap, Activity, Trash2, RefreshCw, ExternalLink, Search, Plus, Globe, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, Subscription } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { ProvisionN8nModal } from "@/components/modals/ProvisionN8nModal";

interface N8nInstance {
    _id: string;
    name: string;
    status: string;
    generated_domain?: string;
    custom_domain?: string;
    webhook_url?: string;
    created_on: string;
    events?: { timestamp: string; message: string; type: string }[];
    logs?: string[];
}

export default function AutomationsPage() {
    const [activeTab, setActiveTab] = useState<'designer' | 'overview'>('overview');
    const [loading, setLoading] = useState(true);
    const [instances, setInstances] = useState<N8nInstance[]>([]);
    const [user, setUser] = useState<{ first_name: string, email: string, avatar?: string } | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<N8nInstance | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const { showConfirm } = useModal();

    const fetchInstances = useCallback(async () => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";

            if (!token) return;

            const query = `
                query GetN8nData {
                    me { 
                        first_name 
                        email 
                        avatar 
                    }
                    mySubscriptions { 
                        id 
                        service 
                        status 
                        plan { name slug features } 
                    }
                    n8nInstances {
                        _id name status generated_domain custom_domain webhook_url created_on
                        logs
                        events { timestamp message type }
                    }
                }
            `;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ query }),
            });

            const result = await res.json();
            if (result.data) {
                setUser(result.data.me);
                // Filter for ACTIVE subscriptions just as in Dashboard
                const allSubs = result.data.mySubscriptions || [];
                const activeSubs = allSubs.filter((s: Subscription) => s && s.status === 'ACTIVE');
                setSubscriptions(activeSubs);
                const insts = result.data.n8nInstances || [];
                setInstances(insts);

                setSelectedInstance(prev => {
                    if (prev) {
                        const updated = insts.find((i: N8nInstance) => i._id === prev._id);
                        if (updated) return updated;
                    }
                    return insts.length > 0 ? insts[0] : null;
                });
            }
        } catch (error) {
            console.error("Fetch n8n error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    // Auto-refresh when provisioning
    useEffect(() => {
        const isChanging = instances.some(i => ['provisioning', 'restarting'].includes(i.status.toLowerCase()));
        let interval: NodeJS.Timeout;
        if (isChanging) {
            interval = setInterval(() => {
                fetchInstances();
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [instances, fetchInstances]);

    const handleRestart = async (id: string) => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const mutation = `mutation Restart($id: ID!) { restartN8n(id: $id) { _id status } }`;
            await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ query: mutation, variables: { id } }),
            });
            fetchInstances();
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Terminate Instance",
            message: "Are you sure you want to terminate this automation cluster? All workflow data will be permanently erased.",
            confirmText: "Terminate",
            onConfirm: async () => {
                try {
                    const token = getAccessToken();
                    const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
                    const mutation = `mutation Delete($id: ID!) { deleteN8n(id: $id) }`;
                    const res = await fetch(GQL_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ query: mutation, variables: { id } }),
                    });
                    const result = await res.json();
                    if (result.data?.deleteN8n) {
                        setInstances(prev => prev.filter(i => i._id !== id));
                        setSelectedInstance(null);
                        fetchInstances();
                    }
                } catch (error) { console.error(error); }
            }
        });
    };

    const n8nSub = subscriptions.find(s => s.service === 'n8n');
    let subLimit = 1;
    if (n8nSub?.plan?.slug === 'n8n-ultra') subLimit = 3;
    else if (n8nSub?.plan?.slug === 'n8n-pro') subLimit = 2;

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Syncing Automations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#020202] text-white flex overflow-hidden">
            <Sidebar user={user} subscriptions={subscriptions} />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <Workflow className="w-6 h-6 text-red-500" />
                        <h2 className="text-xl font-black tracking-tight">Automations (n8n)</h2>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        disabled={instances.length >= subLimit}
                        className={cn(
                            "rounded-2xl gap-2 font-bold shadow-lg transition-all",
                            instances.length >= subLimit ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                        )}
                    >
                        {instances.length >= subLimit ? "Cluster Limit Reached" : <><Plus className="w-4 h-4" /> Provision n8n</>}
                    </Button>
                </header>

                <div className="flex-1 flex overflow-hidden z-10">
                    {/* Instance Picker */}
                    <div className="w-85 border-r border-white/5 bg-black/20 flex flex-col shrink-0">
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                <Search className="w-4 h-4 text-zinc-600" />
                                <input type="text" placeholder="Filter clusters..." className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-500" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {instances.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <div className="w-16 h-16 rounded-[24px] bg-red-600/5 border border-red-500/10 flex items-center justify-center mx-auto mb-6">
                                        <Zap className="w-8 h-8 text-red-500/40" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">No Services Live</p>
                                </div>
                            ) : (
                                instances.map((inst) => (
                                    <button
                                        key={inst._id}
                                        onClick={() => setSelectedInstance(inst)}
                                        className={cn(
                                            "w-full text-left p-6 rounded-[32px] border transition-all duration-300 relative group overflow-hidden",
                                            selectedInstance?._id === inst._id ? "bg-red-600/5 border-red-500/20" : "bg-white/[0.01] border-white/5 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]", inst.status === 'running' ? 'bg-emerald-500' : 'bg-red-500' )} />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{inst.status}</span>
                                            </div>
                                        </div>
                                        <div className="font-black text-sm uppercase tracking-tight group-hover:text-red-500 transition-colors mb-2">{inst.name}</div>
                                        <div className="text-[10px] text-zinc-600 font-bold truncate tracking-widest uppercase">{inst.generated_domain || 'Internal Host'}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Designer Viewport */}
                    <div className="flex-1 bg-black overflow-y-auto">
                        {selectedInstance ? (
                            <div className="p-12 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                                                <Workflow className="w-6 h-6 text-red-500" />
                                            </div>
                                            <h1 className="text-4xl font-black uppercase tracking-tighter italic">{selectedInstance.name}</h1>
                                        </div>
                                        
                                        {/* Tabs */}
                                        <div className="flex gap-8 border-b border-white/5">
                                            {[
                                                { id: 'overview', label: 'Cloud Overview', icon: Activity },
                                                { id: 'designer', label: 'Workflow Designer', icon: Zap },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id as 'overview' | 'designer')}
                                                    className={cn(
                                                        "flex items-center gap-3 pb-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                                                        activeTab === tab.id ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"
                                                    )}
                                                >
                                                    <tab.icon className="w-4 h-4" />
                                                    {tab.label}
                                                    {activeTab === tab.id && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button 
                                            onClick={() => window.open(`https://${selectedInstance.generated_domain}`, '_blank')}
                                            variant="outline"
                                            className="rounded-2xl h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-[11px] text-zinc-500 gap-3"
                                        >
                                            <ExternalLink className="w-4 h-4" /> Popup
                                        </Button>
                                        <Button variant="outline" onClick={() => handleRestart(selectedInstance._id)} className="rounded-2xl h-14 w-14 p-0 border-white/10 bg-white/5 hover:bg-white/10">
                                            <RefreshCw className="w-5 h-5 text-zinc-500" />
                                        </Button>
                                        <Button onClick={() => handleDelete(selectedInstance._id)} className="rounded-2xl h-14 w-14 p-0 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                {activeTab === 'overview' ? (
                                    <>
                                        <div className="flex items-center gap-6 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 w-fit">
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                                                <Activity className="w-3 h-3" /> API Ready
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-widest border-l border-white/10 pl-6">
                                                <Globe className="w-3 h-3" /> NVMe Optimized
                                            </div>
                                        </div>

                                        {/* Endpoint Card */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[48px] p-10 space-y-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10">
                                                <Shield className="w-12 h-12 text-white/5 rotate-12" />
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Internal Webhook Endpoint</h3>
                                                <p className="text-sm font-bold text-zinc-300">Natively proxied through Nexode Cloud Armor.</p>
                                            </div>

                                            <div className="p-8 rounded-[32px] bg-black border border-white/5 flex items-center justify-between group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-red-600/5 border border-red-500/10 flex items-center justify-center group-hover:bg-red-600/10 transition-colors">
                                                        <Zap className="w-7 h-7 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Production URL</div>
                                                        <code className="text-lg font-black text-white italic">https://{selectedInstance.generated_domain}</code>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" onClick={() => navigator.clipboard.writeText(`https://${selectedInstance.generated_domain}`)} className="rounded-2xl text-zinc-600 hover:text-white hover:bg-white/5 h-14 px-8 font-black uppercase tracking-widest text-xs">
                                                    Copy Endpoint
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Lifecycle / Events */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10">
                                                <div className="flex items-center gap-3 mb-8">
                                                    <Settings className="w-5 h-5 text-zinc-500" />
                                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Service Events</h3>
                                                </div>
                                                <div className="space-y-6">
                                                    {selectedInstance.events?.slice(-4).reverse().map((e, idx) => (
                                                        <div key={idx} className="flex gap-6 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full mt-1.5",
                                                                e.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-red-400'
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-[11px] font-black uppercase tracking-tighter text-zinc-300 break-words mb-1">{e.message}</div>
                                                                <div className="text-[9px] font-bold text-zinc-600 uppercase italic">
                                                                    {new Date(e.timestamp).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-red-600/[0.01] group-hover:bg-red-600/[0.02] transition-colors" />
                                                <Workflow className="w-16 h-16 text-zinc-800 mb-6 group-hover:text-red-900/40 transition-colors" />
                                                <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-zinc-400">Node Configuration</h3>
                                                <p className="text-xs font-bold text-zinc-600 max-w-xs leading-relaxed uppercase tracking-widest">
                                                    This instance is running an isolated n8n core with dedicated persistent storage and encryption keys.
                                                </p>
                                                <div className="mt-8 pt-8 border-t border-white/5 w-full flex justify-around">
                                                    <div className="text-center">
                                                        <div className="text-[9px] font-black text-zinc-700 uppercase mb-1">Status</div>
                                                        <div className="text-xs font-black text-zinc-300 tracking-tighter">{selectedInstance.status.toUpperCase()}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-[9px] font-black text-zinc-700 uppercase mb-1">Region</div>
                                                        <div className="text-xs font-black text-zinc-300 tracking-tighter">US-EAST-1</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-[800px] bg-black rounded-[48px] border border-white/10 overflow-hidden relative group">
                                         <iframe 
                                            src={`https://${selectedInstance.generated_domain}`}
                                            className="w-full h-full border-none"
                                            title="n8n Designer"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-red-600/10 blur-[60px] rounded-full scale-150 animate-pulse" />
                                    <div className="w-28 h-28 rounded-[40px] bg-red-600/5 border border-red-500/10 flex items-center justify-center relative scale-110">
                                        <Zap className="w-14 h-14 text-red-500/40" />
                                    </div>
                                </div>
                                <h2 className="text-5xl font-black tracking-tighter mb-6 uppercase">Workflow Orchestration</h2>
                                <p className="text-zinc-500 max-w-lg mb-12 text-lg font-medium leading-relaxed">
                                    Connect 400+ applications and design complex business logic in seconds. 
                                    Your secure n8n instance is waiting to be deployed.
                                </p>
                                <div className="flex gap-4">
                                    <Button 
                                        onClick={() => setShowCreateModal(true)} 
                                        className="rounded-2xl h-16 px-10 gap-3 font-black uppercase tracking-widest text-[11px] bg-red-600 hover:bg-red-500 shadow-2xl shadow-red-500/20"
                                    >
                                        Deploy Cluster <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" className="rounded-2xl h-16 px-8 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[11px] text-zinc-500">
                                        View Documentation
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <ProvisionN8nModal 
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchInstances}
                    subscriptions={subscriptions}
                />
            </main>
        </div>
    );
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
