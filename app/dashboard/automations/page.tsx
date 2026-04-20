"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Workflow, Zap, Activity, Trash2, RefreshCw, ExternalLink, Search, Plus, Globe, Settings, Shield, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Subscription } from "@/app/dashboard/layout";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { ProvisionN8nModal } from "@/components/modals/ProvisionN8nModal";
import { SubscriptionLimitModal } from "@/components/modals/SubscriptionLimitModal";

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

    const [loading, setLoading] = useState(true);
    const [instances, setInstances] = useState<N8nInstance[]>([]);
    const [user, setUser] = useState<{ first_name: string, email: string, avatar?: string } | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<N8nInstance | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [isSuperuser, setIsSuperuser] = useState(false);
    const [copied, setCopied] = useState(false);
    const [dnsStatus, setDnsStatus] = useState<'checking' | 'resolved' | 'failed' | null>(null);
    const [dnsMessage, setDnsMessage] = useState<string>('');
    const [restarting, setRestarting] = useState<boolean>(false);
    const [cooldown, setCooldown] = useState<number>(0);

    
    const { showConfirm } = useModal();
    
    const getN8nUrl = (domain: string) => {
        if (!domain) return '';
        if (typeof window === 'undefined') return `https://${domain}`;
        const isLocal = window.location.hostname.includes('localhost');
        const protocol = isLocal ? 'http' : 'https';
        const port = isLocal ? (window.location.port || '4000') : '';
        return `${protocol}://${domain}${port ? `:${port}` : ''}`;
    };

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
                        role { slug } 
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
                setIsSuperuser(result.data.me?.role?.slug === 'superuser');
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

    const n8nSubscriptions = subscriptions.filter(s => s.service === 'n8n');
    const n8nUsedSlots = instances.length;
    const n8nTotalSlots = n8nSubscriptions.length;
    const canCreateN8n = isSuperuser || n8nUsedSlots < n8nTotalSlots;

    const handleCreateClick = () => {
        if (canCreateN8n) {
            setShowCreateModal(true);
        } else {
            setShowLimitModal(true);
        }
    };

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

    useEffect(() => {
        if (!selectedInstance?.generated_domain) {
            setDnsStatus(null);
            return;
        }

        const checkDns = async () => {
            setDnsStatus('checking');
            setDnsMessage('Checking DNS records...');
            try {
                const res = await fetch(`/api/dns?domain=${selectedInstance.generated_domain}`);
                const data = await res.json();
                if (data.resolved) {
                    setDnsStatus('resolved');
                    setDnsMessage('Domain is reachable and properly configured.');
                } else {
                    setDnsStatus('failed');
                    setDnsMessage('Domain could not be resolved. DNS propagation may still be in progress.');
                }
            } catch (err: unknown) {
                setDnsStatus('failed');
                setDnsMessage('DNS verification temporarily unavailable.');
            }
        };

        checkDns();
    }, [selectedInstance?.generated_domain]);

    const handleRestart = async (id: string, force = false) => {
        if (!force && (cooldown > 0 || restarting)) return;
        setRestarting(true);
        if (!force) setCooldown(60);
        
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

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        } else {
            setRestarting(false);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs animate-pulse">Syncing Automations...</p>
                </div>
            </div>
        );
    }

    return (
        <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Automations</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex-1" />
                    <Button onClick={handleCreateClick} className="gap-2">
                        <Plus className="size-4" /> Provision n8n
                    </Button>
                </header>

                <div className="flex-1 flex overflow-hidden z-10">
                    <div className="w-80 border-r border-border bg-black/20 flex flex-col shrink-0">
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <Search className="size-4 text-muted-foreground" />
                                <Input type="text" placeholder="Filter clusters..." className="bg-muted border-border text-xs h-8" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                            {instances.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <Workflow className="size-6 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-xs text-muted-foreground">No active clusters found. Create one to get started.</p>
                                </div>
                            ) : (
                                instances.map((inst) => (
                                    <button
                                        key={inst._id}
                                        onClick={() => setSelectedInstance(inst)}
                                        className={cn(
                                            "w-full text-left p-6  border transition-all duration-300 relative group overflow-hidden",
                                            selectedInstance?._id === inst._id ? "bg-destructive/5 border-destructive/20" : "bg-muted-foreground/5 border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-1.5 h-1.5  ", inst.status === 'running' ? 'bg-emerald-500' : 'bg-red-500' )} />
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{inst.status}</Badge>
                                            </div>
                                        </div>
                                        <div className="font-black text-sm uppercase tracking-tight group-hover:text-destructive transition-colors mb-2">{inst.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-bold truncate tracking-widest uppercase">{inst.generated_domain || 'Internal Host'}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex-1 bg-background overflow-y-auto">
                        {selectedInstance ? (
                            <div className="p-12 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12  bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                                                    <Workflow className="size-6 text-destructive" />
                                                </div>
                                                <h1 className="text-4xl font-black uppercase tracking-tighter italic">{selectedInstance.name}</h1>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button 
                                            onClick={() => window.open(getN8nUrl(selectedInstance.generated_domain || ''), '_blank')}
                                            variant="outline"
                                            disabled={selectedInstance.status.toLowerCase() !== 'running'}
                                            className="h-14 px-8 gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ExternalLink className="size-4" /> {selectedInstance.status.toLowerCase() === 'running' ? 'Open' : 'Deploying...'}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            title="Redeploy this n8n instance"
                                            onClick={() => handleRestart(selectedInstance._id)} 
                                            disabled={cooldown > 0 || restarting}
                                            className="h-14 px-6 gap-2"
                                        >
                                            <RefreshCw className={cn("size-5", restarting ? "animate-spin text-destructive" : "text-muted-foreground")} />
                                            {cooldown > 0 
                                                ? <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{cooldown}s</span>
                                                : <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Redeploy</span>
                                            }
                                        </Button>
                                        <Button onClick={() => handleDelete(selectedInstance._id)} variant="destructive" size="icon" className="h-14 w-14 p-0">
                                            <Trash2 className="size-5" />
                                        </Button>
                                    </div>
                                </div>

                                        <div className="flex items-center gap-6 px-4 py-2 bg-muted  border border-border w-fit">
                                            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                                                <Activity className="w-3 h-3" /> API Ready
                                            </div>
                                            <Separator orientation="vertical" className="h-4" />
                                            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                                                <Globe className="w-3 h-3" /> NVMe Optimized
                                            </div>
                                        </div>

                                        <Card className="bg-card border-border  overflow-hidden">
                                            <CardContent className="p-10 space-y-8 relative">
                                                <div className="absolute top-0 right-0 p-10">
                                                    <Shield className="w-12 h-12 text-white/5 rotate-12" />
                                                </div>
                                                
                                                <div>
                                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Internal Webhook Endpoint</h3>
                                                    <p className="text-sm font-bold text-foreground">Natively proxied through Nexode Cloud Armor.</p>
                                                </div>

                                                <div className="p-8  bg-background border border-border flex items-center justify-between group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="size-14  bg-destructive/5 border border-destructive/10 flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
                                                            <Zap className="w-7 h-7 text-destructive" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Production URL</div>
                                                            {selectedInstance.status.toLowerCase() === 'running' ? (
                                                                <code className="text-lg font-black text-foreground">{getN8nUrl(selectedInstance.generated_domain || '')}</code>
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                                    <span className="text-sm font-bold text-muted-foreground">Deploying... URL will appear when ready</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedInstance.status.toLowerCase() === 'running' && (
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="ghost"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(getN8nUrl(selectedInstance.generated_domain || ''));
                                                                setCopied(true);
                                                                setTimeout(() => setCopied(false), 2000);
                                                            }} 
                                                            className="size-14 p-0 shrink-0"
                                                        >
                                                            {copied ? <Check className="size-5 text-primary" /> : <Copy className="size-5" />}
                                                        </Button>
                                                        <Button 
                                                            variant="ghost"
                                                            onClick={() => window.open(getN8nUrl(selectedInstance.generated_domain || ''), '_blank')}
                                                            className="size-14 p-0 shrink-0"
                                                        >
                                                            <ExternalLink className="size-5" />
                                                        </Button>
                                                    </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <Card className="bg-card border-border ">
                                                <CardContent className="p-10">
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <Settings className="size-5 text-muted-foreground" />
                                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Service Events</h3>
                                                    </div>
                                                    <div className="space-y-6">
                                                        {dnsStatus && (
                                                            <div className="flex gap-6 pb-6 border-b border-border last:border-0 last:pb-0">
                                                                <div className={cn(
                                                                    "w-1.5 h-1.5  mt-1.5",
                                                                    dnsStatus === 'resolved' ? 'bg-emerald-500 ' : 
                                                                    dnsStatus === 'failed' ? 'bg-red-500 ' : 
                                                                    'bg-yellow-500 animate-pulse'
                                                                )} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-[11px] font-black uppercase tracking-tighter text-foreground break-words mb-1">
                                                                        DNS Verification: {dnsStatus === 'checking' ? 'Resolving Wildcard...' : dnsStatus === 'resolved' ? 'Propagation Successful' : 'Wildcard Resolution Failed'}
                                                                    </div>
                                                                    <div className="text-[9px] font-bold text-muted-foreground uppercase italic">
                                                                        {dnsMessage || 'Checking DNS records...'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedInstance.events?.slice(-4).reverse().map((e, idx) => (
                                                            <div key={idx} className="flex gap-6 pb-6 border-b border-border last:border-0 last:pb-0">
                                                                <div className={cn(
                                                                    "w-1.5 h-1.5  mt-1.5",
                                                                    e.type === 'error' ? 'bg-red-500 ' : 'bg-red-400'
                                                                )} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-[11px] font-black uppercase tracking-tighter text-foreground break-words mb-1">{e.message}</div>
                                                                    <div className="text-[9px] font-bold text-muted-foreground uppercase italic">
                                                                        {new Date(e.timestamp).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-card border-border  relative overflow-hidden group">
                                                <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                                                    <div className="absolute inset-0 bg-destructive/[0.01] group-hover:bg-destructive/[0.02] transition-colors" />
                                                    <Workflow className="size-16 text-muted-foreground mb-6 group-hover:text-destructive/40 transition-colors relative z-10" />
                                                    <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-muted-foreground relative z-10">Node Configuration</h3>
                                                    <p className="text-xs font-bold text-muted-foreground max-w-xs leading-relaxed uppercase tracking-widest relative z-10">
                                                        This instance is running an isolated n8n core with dedicated persistent storage and encryption keys.
                                                    </p>
                                                    <Separator className="my-8 relative z-10" />
                                                    <div className="w-full flex justify-around relative z-10">
                                                        <div className="text-center">
                                                            <div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Status</div>
                                                            <div className="text-xs font-black text-foreground tracking-tighter">{selectedInstance.status.toUpperCase()}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Region</div>
                                                            <div className="text-xs font-black text-foreground tracking-tighter">Local Server</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Workflow className="size-16 text-muted-foreground mb-6" />
                                <h1 className="text-2xl font-black mb-2">No active clusters found</h1>
                                <p className="text-muted-foreground max-w-xs mx-auto mb-6">Create one to get started.</p>
                                <Button onClick={handleCreateClick} className="gap-2">
                                    <Plus className="size-4" /> Provision n8n
                                </Button>
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
                <SubscriptionLimitModal
                    isOpen={showLimitModal}
                    onClose={() => setShowLimitModal(false)}
                    serviceName="n8n Automation"
                    serviceId="n8n"
                    usedSlots={n8nUsedSlots}
                    totalSlots={n8nTotalSlots}
                />
            </>
    );
}