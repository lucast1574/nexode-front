"use client";

import React, { useEffect, useState, useCallback } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { Workflow, Activity, Trash2, RefreshCw, ExternalLink, Search, Plus, Settings, Shield, Copy, Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Subscription, useDashboard } from "@/app/dashboard/layout";
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
    const [, setUser] = useState<{ first_name: string, email: string, avatar?: string } | null>(null);
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
    const { refetch: refetchGlobal } = useDashboard();

    
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
            } catch {
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
            await fetchInstances();
            refetchGlobal();
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
                        await fetchInstances();
                        refetchGlobal();
                    }
                } catch (error) { console.error(error); }
            }
        });
    };

    // const n8nSub = subscriptions.find(s => s.service === 'n8n');
    // let subLimit = 1;
    // if (n8nSub?.plan?.slug === 'n8n-ultra') subLimit = 3;
    // else if (n8nSub?.plan?.slug === 'n8n-pro') subLimit = 2;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm animate-pulse">Syncing Automations...</p>
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
                    <div className="mr-2"><NotificationBell /></div>
                    <Button onClick={handleCreateClick} className="gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20">
                        <Plus className="size-4" /> Provision n8n
                    </Button>
                </header>

                <div className="flex-1 flex overflow-hidden z-10">
                    <div className="w-80 border-r border-border bg-black/20 flex flex-col">
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <Search className="size-4 text-muted-foreground" />
                                <Input type="text" placeholder="Search clusters..." className="bg-muted border-border text-xs h-8" />
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
                                            "w-full text-left p-4 border transition-all group",
                                            selectedInstance?._id === inst._id
                                                ? "bg-primary/10 border-primary/20"
                                                : "bg-card border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Image src="/db/n8n.svg" alt="n8n" width={20} height={20} className="size-5 object-contain" />
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                inst.status === 'running' ? 'bg-emerald-500 ' :
                                                    inst.status === 'provisioning' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                                            )} />
                                        </div>
                                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{inst.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Created {new Date(inst.created_on).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-background">
                        {selectedInstance ? (
                            <>
                                <div className="p-8 border-b border-border shrink-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h1 className="text-3xl font-bold tracking-tight">{selectedInstance.name}</h1>
                                                <Badge variant="outline" className={cn(
                                                    "text-xs font-medium",
                                                    selectedInstance.status === 'running' ? "bg-primary/10 text-primary border-emerald-500/20" :
                                                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                )}>
                                                    ● {selectedInstance.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-sm font-medium">Instance ID: {selectedInstance._id}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open(getN8nUrl(selectedInstance.generated_domain || ''), '_blank')}
                                                disabled={selectedInstance.status.toLowerCase() !== 'running'}
                                                className="h-10 gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ExternalLink className="size-4" /> {selectedInstance.status.toLowerCase() === 'running' ? 'Open' : 'Deploying...'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRestart(selectedInstance._id)}
                                                disabled={cooldown > 0 || restarting}
                                                className="h-10 gap-2"
                                            >
                                                <RefreshCw className={cn("size-4", restarting && "animate-spin")} /> Restart
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDelete(selectedInstance._id)}
                                                className="h-10 w-10"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                                    <TabsList variant="line" className="mt-8 gap-8 px-8">
                                        <TabsTrigger value="overview" className="flex items-center gap-2">
                                            <Activity className="size-4" /> Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="events" className="flex items-center gap-2">
                                            <Settings className="size-4" /> Events
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-8">
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-6">
                                                        <div className="text-muted-foreground text-xs mb-4">Core Technology</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 flex items-center justify-center border bg-primary/10 border-primary/20">
                                                                <Workflow className="size-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold leading-tight">n8n Enterprise</div>
                                                                <div className="text-xs text-muted-foreground font-medium">Latest Stable</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-6">
                                                        <div className="text-muted-foreground text-xs mb-4">Availability Zone</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center border border-primary/20">
                                                                <Shield className="size-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold">US-East (Virginia)</div>
                                                                <div className="text-xs text-muted-foreground">Multi-AZ Enabled</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-6">
                                                        <div className="text-muted-foreground text-xs mb-4">Instance Health</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center border border-emerald-500/20">
                                                                <Activity className="size-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-primary">{selectedInstance.status === 'running' ? 'Optimal' : 'Provisioning'}</div>
                                                                <div className="text-xs text-muted-foreground">Monitored</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <Card className="bg-card border-border">
                                                <CardContent className="p-8">
                                                    <h3 className="text-lg font-bold mb-6">Webhook Endpoint</h3>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="p-4 bg-background border border-border flex items-center justify-between">
                                                            <div className="flex-1 overflow-hidden">
                                                                <div className="text-xs text-muted-foreground mb-1">Production URL</div>
                                                                {selectedInstance.status.toLowerCase() === 'running' ? (
                                                                    <code className="text-sm text-primary truncate block">{getN8nUrl(selectedInstance.generated_domain || '')}</code>
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">provisioning...</span>
                                                                )}
                                                            </div>
                                                            {selectedInstance.status.toLowerCase() === 'running' && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="shrink-0"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(getN8nUrl(selectedInstance.generated_domain || ''));
                                                                            setCopied(true);
                                                                            setTimeout(() => setCopied(false), 2000);
                                                                        }}
                                                                    >
                                                                        {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="shrink-0"
                                                                        onClick={() => window.open(getN8nUrl(selectedInstance.generated_domain || ''), '_blank')}
                                                                    >
                                                                        <ExternalLink className="size-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {selectedInstance.webhook_url && (
                                                            <div className="p-4 bg-background border border-border flex items-center justify-between">
                                                                <div className="flex-1 overflow-hidden">
                                                                    <div className="text-xs text-muted-foreground mb-1">Webhook URL</div>
                                                                    <code className="text-sm text-primary truncate block">{selectedInstance.webhook_url}</code>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="shrink-0"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(selectedInstance.webhook_url || '');
                                                                        setCopied(true);
                                                                        setTimeout(() => setCopied(false), 2000);
                                                                    }}
                                                                >
                                                                    {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                                                                </Button>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                                                                    <code className="text-sm">{selectedInstance.status}</code>
                                                                </CardContent>
                                                            </Card>
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">Domain</div>
                                                                    <code className="text-sm">{selectedInstance.generated_domain || 'Internal'}</code>
                                                                </CardContent>
                                                            </Card>
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                                                                    <code className="text-sm">{new Date(selectedInstance.created_on).toLocaleDateString()}</code>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {selectedInstance.events && selectedInstance.events.length > 0 && (
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-8">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <h3 className="text-lg font-bold">Deployment Timeline</h3>
                                                            <span className="text-xs text-muted-foreground">Real-time Logs</span>
                                                        </div>
                                                        <div className="space-y-6 relative ml-2">
                                                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-muted" />
                                                            {selectedInstance.events.map((event, idx) => (
                                                                <div key={idx} className="flex gap-6 relative">
                                                                    <div className={cn(
                                                                        "size-4 rounded-full border-2 border-zinc-700 relative z-10 shrink-0 mt-1",
                                                                        event.type === 'success' ? 'bg-emerald-500 ' :
                                                                            event.type === 'error' ? 'bg-red-500 ' : 'bg-primary'
                                                                    )} />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <p className={cn(
                                                                                "text-sm font-bold",
                                                                                event.type === 'error' ? 'text-destructive' :
                                                                                    event.type === 'success' ? 'text-primary' : 'text-foreground'
                                                                            )}>
                                                                                {event.message}
                                                                            </p>
                                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                                {new Date(event.timestamp).toLocaleTimeString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="events" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-8">
                                        <div className="space-y-8">
                                            <Card className="bg-card border-border">
                                                <CardContent className="p-8">
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <Settings className="size-5 text-muted-foreground" />
                                                        <h3 className="text-lg font-bold">Service Events</h3>
                                                    </div>
                                                    <div className="space-y-6">
                                                        {dnsStatus && (
                                                            <div className="flex gap-6 pb-6 border-b border-border last:border-0 last:pb-0">
                                                                <div className={cn(
                                                                    "size-4 rounded-full relative z-10 shrink-0 mt-1",
                                                                    dnsStatus === 'resolved' ? 'bg-emerald-500 ' :
                                                                        dnsStatus === 'failed' ? 'bg-red-500 ' : 'bg-yellow-500 animate-pulse'
                                                                )} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-bold text-foreground break-words mb-1">
                                                                        DNS Verification: {dnsStatus === 'checking' ? 'Resolving Wildcard...' : dnsStatus === 'resolved' ? 'Propagation Successful' : 'Wildcard Resolution Failed'}
                                                                    </div>
                                                                    <div className="text-xs font-medium text-muted-foreground">
                                                                        {dnsMessage || 'Checking DNS records...'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedInstance.events?.slice(-10).reverse().map((e, idx) => (
                                                            <div key={idx} className="flex gap-6 pb-6 border-b border-border last:border-0 last:pb-0">
                                                                <div className={cn(
                                                                    "size-4 rounded-full relative z-10 shrink-0 mt-1",
                                                                    e.type === 'error' ? 'bg-red-500 ' : 'bg-primary'
                                                                )} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-bold text-foreground break-words mb-1">{e.message}</div>
                                                                    <div className="text-xs font-medium text-muted-foreground">
                                                                        {new Date(e.timestamp).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Workflow className="size-16 text-muted-foreground mb-6" />
                                <h1 className="text-2xl font-bold mb-2">No active clusters found</h1>
                                <p className="text-muted-foreground max-w-xs mx-auto mb-6">Create one to get started.</p>
                                <Button onClick={handleCreateClick} className="gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20">
                                    <Plus className="size-4" /> Provision n8n
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <ProvisionN8nModal 
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        fetchInstances();
                        refetchGlobal();
                    }}
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