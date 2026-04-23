"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Cpu,
    Shield,
    Plus,
    Search,
    Globe,
    Github,
    Gitlab,
    Layers,
    Activity,
    Trash2,
    RefreshCw,
    ExternalLink,
    Code,
    Server,
    Terminal,
    FileText,
    Copy,
    Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Subscription, useDashboard } from "@/app/dashboard/layout";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { toast } from "sonner";
import { ProvisionNodeModal } from "@/components/modals/ProvisionNodeModal";
import { SubscriptionLimitModal } from "@/components/modals/SubscriptionLimitModal";

interface ComputeInstance {
    _id: string;
    name: string;
    type: string;
    provider: string;
    repository_url: string;
    branch: string;
    status: string;
    auto_deploy_on_push: boolean;
    cpu_limit: number;
    ram_limit: number;
    custom_domain?: string;
    generated_domain?: string;
    created_on: string;
    env_content?: string;
    runtime?: string;
    events?: { timestamp: string; message: string; type: string }[];
    logs?: string[];
}

interface User {
    first_name: string;
    email: string;
    avatar?: string;
    github_profile?: {
        username: string;
    };
    gitlab_profile?: {
        username: string;
    };
}


const INITIAL_TERMINAL_LOGS: { type: 'input' | 'output' | 'error', text: string }[] = [
    { type: 'output', text: 'Nexode Secure Terminal - Secure Shell Proxy' },
    { type: 'output', text: 'Establishing isolated TTY session...' },
    { type: 'output', text: 'Environment: Ephemeral Compute Node (Filtered Access)' },
    { type: 'output', text: 'Type "help" to see available commands.' }
];



function ComputePageContent() {
    const [loading, setLoading] = useState(true);
    const [instances, setInstances] = useState<ComputeInstance[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<ComputeInstance | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [isSuperuser, setIsSuperuser] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [envDraft, setEnvDraft] = useState('');
    const [isSavingEnv, setIsSavingEnv] = useState(false);
    const [initialProvider, setInitialProvider] = useState<'GITHUB' | 'GITLAB'>('GITHUB');

    const [terminalLogs, setTerminalLogs] = useState<{ type: 'input' | 'output' | 'error', text: string }[]>(INITIAL_TERMINAL_LOGS);
    const [isExecuting, setIsExecuting] = useState(false);
    const [liveDeployStatus, setLiveDeployStatus] = useState<string | null>(null);
    const [restarting, setRestarting] = useState<boolean>(false);
    const [cooldown, setCooldown] = useState<number>(0);
    const [cooldownId, setCooldownId] = useState<string | null>(null);
    const { user: dashboardUser, refetch: refetchGlobal } = useDashboard();
    const { showAlert, showConfirm } = useModal();
    const router = useRouter();
    const searchParams = useSearchParams();

    const fetchInstances = useCallback(async () => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";

            if (!token) return;

            const query = `
                query GetComputeData {
                    me { 
                        first_name 
                        email 
                        avatar 
                        role { slug }
                        github_profile { username }
                        gitlab_profile { username }
                    }
                    mySubscriptions { id service status plan { name slug features } }
                    myComputeInstances {
                        _id name type provider repository_url branch status auto_deploy_on_push env_content runtime cpu_limit ram_limit custom_domain generated_domain created_on
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
                const roleSlug = result.data.me?.role?.slug?.toLowerCase();
                const staffStatus = roleSlug === 'superuser' || roleSlug === 'admin';
                console.log(`[Compute] Fetched role: ${roleSlug}, Is staff: ${staffStatus}`);
                setIsSuperuser(staffStatus);
                setSubscriptions(result.data.mySubscriptions || []);
                const insts = result.data.myComputeInstances || [];
                setInstances(insts);

                setSelectedInstance(prev => {
                    if (prev) {
                        const updated = insts.find((i: ComputeInstance) => i._id === prev._id);
                        if (updated) return updated;
                    }
                    return insts.length > 0 ? insts[0] : null;
                });
            }
        } catch (error) {
            console.error("Fetch Compute error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const computeSubscriptions = subscriptions.filter(s => s.service === 'compute');
    const computeUsedSlots = instances.length;
    const computeTotalSlots = computeSubscriptions.length;
    
    // Improved superuser detection using both local state and global context
    const roleSlug = dashboardUser?.role?.slug?.toLowerCase();
    const isStaff = roleSlug === 'superuser' || roleSlug === 'admin' || isSuperuser;
    
    const canCreate = isStaff || computeUsedSlots < computeTotalSlots;


    const handleCreateClick = useCallback(() => {
        if (canCreate) {
            setShowCreateModal(true);
        } else {
            setShowLimitModal(true);
        }
    }, [canCreate]);

    // Safety log for debugging role bypass issues
    useEffect(() => {
        if (!loading) {
            console.log(`[Compute] Staff status: ${isStaff ? 'YES' : 'NO'}, Role: ${dashboardUser?.role?.slug}, Used: ${computeUsedSlots}, Total: ${computeTotalSlots}`);
        }
    }, [isStaff, dashboardUser, computeUsedSlots, computeTotalSlots, loading]);

    // useEffects that depend on handleCreateClick should come after this
    useEffect(() => {
        const githubStatus = searchParams.get('github');
        const gitlabStatus = searchParams.get('gitlab');

        if (githubStatus || gitlabStatus) {
            const providerName = githubStatus ? 'GitHub' : 'GitLab';
            const status = (githubStatus || gitlabStatus) === 'success' ? 'success' : 'error';

            showAlert({
                title: status === 'success' ? "Account Linked" : "Link Failed",
                message: status === 'success'
                    ? `Your ${providerName} account has been successfully connected.`
                    : `Failed to link ${providerName} account. Please try again.`,
                type: status,
                onConfirm: () => {
                    setInitialProvider(githubStatus ? 'GITHUB' : 'GITLAB');
                    handleCreateClick();
                }
            });

            if (status === 'success') {
                fetchInstances();
            }

            router.replace('/dashboard/compute');
        }
    }, [searchParams, showAlert, fetchInstances, router, handleCreateClick]);
    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    useEffect(() => {
        // High frequency polling (3s) during provisioning, restarting, or active redeploy
        const isDeploying = instances.some(i => i.status.toLowerCase() === 'provisioning' || i.status.toLowerCase() === 'restarting') || liveDeployStatus === 'running';
        // Medium frequency polling (5s) for logs or events tabs to keep them "live"
        const needsLiveUpdates = activeTab === 'logs' || activeTab === 'deployments' || activeTab === 'overview';

        let interval: NodeJS.Timeout;
        if (isDeploying || needsLiveUpdates) {
            interval = setInterval(() => {
                fetchInstances();
            }, isDeploying ? 3000 : 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [instances, fetchInstances, liveDeployStatus, activeTab]);

    useEffect(() => {
        if (!selectedInstance?._id || selectedInstance.status !== 'running') {
            setLiveDeployStatus(null);
            return;
        }
        let cancelled = false;
        const checkStatus = async () => {
            try {
                const token = getAccessToken();
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api-v1/graphql';
                const res = await fetch(GQL_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ query: `query { computeDeployStatus(id: "${selectedInstance._id}") }` }),
                });
                const result = await res.json();
                if (!cancelled) {
                    const status = result.data?.computeDeployStatus;
                    setLiveDeployStatus(status || null);
                    if (status === 'done' && liveDeployStatus === 'running') {
                        fetchInstances();
                    }
                }
            } catch { /* ignore */ }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [selectedInstance?._id, selectedInstance?.status, liveDeployStatus, fetchInstances]);

    useEffect(() => {
        setTerminalLogs([...INITIAL_TERMINAL_LOGS]);
    }, [selectedInstance?._id, activeTab]);

    useEffect(() => {
        if (selectedInstance && selectedInstance.env_content !== undefined) {
            setEnvDraft(selectedInstance.env_content);
        } else {
            setEnvDraft('');
        }
    }, [selectedInstance]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleConnectProvider = async (provider: string) => {
        try {
            const token = getAccessToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || "https://backend.nexode.app/api-v1";
            const endpoint = provider === 'GITHUB' ? '/github/connect' : '/gitlab/connect';

            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const result = await res.json();

            if (res.ok && result.url) {
                window.location.href = result.url;
            } else {
                showAlert({
                    title: "Connection Error",
                    message: result.message || "Failed to initiate connection. Please try again.",
                    type: "error"
                });
            }
        } catch (error) {
            console.error(error);
            showAlert({
                title: "Connection Error",
                message: "A network error occurred. Please try again later.",
                type: "error"
            });
        }
    };

    const handleRestart = async (id: string, force = false) => {
        if (!force && ((cooldown > 0 && cooldownId === id) || restarting)) return;
        setRestarting(true);
        if (!force) {
            setCooldown(60);
            setCooldownId(id);
        }

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const mutation = `mutation Restart($id: ID!) { restartComputeInstance(id: $id) { _id status } }`;
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ query: mutation, variables: { id } }),
            });
            const result = await res.json();
            if (result.data) fetchInstances();
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        } else {
            setRestarting(false);
            setCooldownId(null);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleToggleAutoDeploy = async (enabled: boolean) => {
        if (!selectedInstance) return;

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";

            const mutation = `
                mutation UpdateAutoDeploy($id: ID!, $enabled: Boolean!) {
                    updateComputeAutoDeploy(id: $id, enabled: $enabled) { _id auto_deploy_on_push }
                }
            `;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { id: selectedInstance._id, enabled }
                }),
            });

            const result = await res.json();
            if (result.data) {
                fetchInstances();
            }
        } catch (error) {
            console.error("Toggle Auto Deploy error:", error);
        }
    };

    const handleSaveEnvContent = async (id: string) => {
        setIsSavingEnv(true);
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";

            const mutation = `
                mutation UpdateEnv($id: ID!, $env_content: String!) {
                    updateComputeEnvContent(id: $id, env_content: $env_content) { _id env_content }
                }
            `;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { id, env_content: envDraft }
                }),
            });

            const result = await res.json();
            if (result.data) {
                showAlert({ title: "Environment Saved", message: "Environment variables successfully applied. Instance is restarting.", type: "success" });
                handleRestart(id, true);
                fetchInstances();
            }
        } catch (error) {
            console.error("Env error:", error);
            showAlert({ title: "Save Error", message: "Failed to save environment correctly.", type: "error" });
        } finally {
            setIsSavingEnv(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Terminate Instance",
            message: "Are you sure you want to terminate this instance? This action is irreversible.",
            confirmText: "Terminate",
            onConfirm: async () => {
                try {
                    const token = getAccessToken();
                    const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
                    const mutation = `mutation Delete($id: ID!) { deleteComputeInstance(id: $id) }`;
                    const res = await fetch(GQL_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ query: mutation, variables: { id } }),
                    });
                    const result = await res.json();
                    if (result.data?.deleteComputeInstance) {
                        setInstances(prev => prev.filter(i => i._id !== id));
                        setSelectedInstance(null);
                        fetchInstances();
                        refetchGlobal();
                    } else {
                        const msg = result.errors?.[0]?.message || "Failed to delete instance";
                        showAlert({ title: "Delete Failed", message: msg, type: "error" });
                    }
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Network error";
                    showAlert({ title: "Delete Error", message, type: "error" });
                }
            }
        });
    };

    const handleExecuteCommand = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const command = formData.get('command') as string;
        if (!command || !selectedInstance) return;

        setTerminalLogs(prev => [...prev, { type: 'input', text: command }]);
        setIsExecuting(true);
        e.currentTarget.reset();

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";

            const mutation = `
                mutation ExecuteCompute($id: ID!, $command: String!) {
                    executeComputeCommand(id: $id, command: $command)
                }
            `;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { id: selectedInstance._id, command }
                }),
            });

            const result = await res.json();
            if (result.data?.executeComputeCommand) {
                const parsed = JSON.parse(result.data.executeComputeCommand);
                if (parsed.clear) {
                    setTerminalLogs([]);
                } else if (parsed.error) {
                    setTerminalLogs(prev => [...prev, { type: 'error', text: `${parsed.error} (${parsed.code})` }]);
                } else {
                    setTerminalLogs(prev => [...prev, { type: 'output', text: parsed.output }]);
                }
            } else if (result.errors) {
                setTerminalLogs(prev => [...prev, { type: 'error', text: result.errors[0].message }]);
            }
        } catch {
            setTerminalLogs(prev => [...prev, { type: 'error', text: 'Network Error: Proxy unreachable.' }]);
        } finally {
            setIsExecuting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm animate-pulse">Syncing Compute Engine...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Compute</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex-1" />
                    <div className="mr-2">
                        <NotificationBell badgeColor="bg-primary" iconColor="text-primary" />
                    </div>
                    <Button onClick={handleCreateClick} className="gap-2">
                        <Plus className="size-4" /> Deploy Instance
                    </Button>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-w-0">
                    <div className="w-full lg:w-80 border-r border-border bg-black/20 flex flex-col">
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <Search className="size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search instances..."
                                    className="bg-muted border-border text-xs h-8"
                                />
                            </div>
                            <Button onClick={handleCreateClick} className="gap-2 mt-3 w-full" variant="outline">
                                <Plus className="size-4" /> New Compute
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                            {instances.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <Cpu className="size-6 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-xs text-muted-foreground">No active instances found. Create one to get started.</p>
                                </div>
                            ) : (
                                instances.map((inst) => (
                                    <button
                                        key={inst._id}
                                        onClick={() => setSelectedInstance(inst)}
                                        className={cn(
                                            "w-full text-left p-4 border transition-all group",
                                            selectedInstance?._id === inst._id
                                                ? (inst.type.toLowerCase() === 'frontend' ? "bg-primary/10 border-primary/20" : "bg-purple-600/10 border-purple-600/20")
                                                : "bg-card border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className={cn(
                                                "text-xs font-medium",
                                                inst.type.toLowerCase() === 'frontend' ? 'text-primary border-primary/20 bg-primary/10' : 'text-purple-400 border-purple-400/20 bg-purple-400/10'
                                            )}>
                                                {inst.type}
                                            </Badge>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", inst.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_hsl(var(--primary)/0.5)]' : 'bg-amber-500 animate-pulse')} />
                                        </div>
                                        <div className={cn(
                                            "font-bold text-sm truncate transition-colors",
                                            inst.type.toLowerCase() === 'frontend' ? "group-hover:text-primary" : "group-hover:text-purple-400"
                                        )}>{inst.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Created {new Date(inst.created_on).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-background min-w-0">
                        {selectedInstance ? (
                            <>
                                <div className="p-4 lg:p-12 max-w-6xl mx-auto">
                                    <div className="flex flex-col lg:flex-row items-start justify-between mb-8 gap-4">
                                        <div>
                                            <div className="flex items-center gap-4 mb-3">
                                                <h1 className="text-4xl font-bold tracking-tight">{selectedInstance.name}</h1>
                                                <Badge variant="outline" className={cn(
                                                    selectedInstance.type.toLowerCase() === 'frontend' ? "bg-primary/10 text-primary border-primary/20" : "bg-purple-400/10 text-purple-400 border-purple-400/20"
                                                )}>
                                                    ● {selectedInstance.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
                                                <div className="flex items-center gap-2"><Layers className="w-4 h-4" /> {selectedInstance.cpu_limit} vCPU</div>
                                                <Separator orientation="vertical" className="h-4" />
                                                <div className="flex items-center gap-2"><Server className="w-4 h-4" /> {selectedInstance.ram_limit} GB RAM</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedInstance.generated_domain && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => window.open(`https://${selectedInstance.generated_domain}/status`, '_blank')}
                                                    className="gap-2"
                                                >
                                                    <Activity className="w-4 h-4" /> Check Status
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRestart(selectedInstance._id)}
                                                disabled={(cooldown > 0 && cooldownId === selectedInstance._id) || restarting}
                                                className="min-w-[100px] gap-2"
                                            >
                                                <RefreshCw className={cn("w-4 h-4", restarting && "animate-spin")} />
                                                {(cooldown > 0 && cooldownId === selectedInstance._id) ? `${cooldown}s` : 'Redeploy'}
                                            </Button>
                                            <Button onClick={() => handleDelete(selectedInstance._id)} variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>

                                    {liveDeployStatus === 'running' && (
                                        <Card className={cn("mb-6 border-primary/20 bg-primary/5 overflow-hidden relative", selectedInstance.type.toLowerCase() === 'backend' && "border-purple-500/20 bg-purple-500/5")}>
                                            <div className={cn("absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 animate-pulse", selectedInstance.type.toLowerCase() === 'backend' && "from-purple-500/10 via-purple-500/5 to-purple-500/10")} />
                                            <CardContent className="p-4 relative">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center", selectedInstance.type.toLowerCase() === 'backend' && "bg-purple-500/20")}>
                                                        <RefreshCw className={cn("w-5 h-5 text-primary animate-spin", selectedInstance.type.toLowerCase() === 'backend' && "text-purple-400")} />
                                                    </div>
                                                    <div>
                                                        <div className={cn("text-sm font-semibold text-primary", selectedInstance.type.toLowerCase() === 'backend' && "text-purple-400")}>Deploying New Version</div>
                                                        <div className={cn("text-xs text-primary/60 mt-0.5", selectedInstance.type.toLowerCase() === 'backend' && "text-purple-400/60")}>A new push was detected. Building and deploying automatically...</div>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full bg-primary animate-ping", selectedInstance.type.toLowerCase() === 'backend' && "bg-purple-400")} />
                                                        <span className={cn("text-xs font-mono text-primary/80", selectedInstance.type.toLowerCase() === 'backend' && "text-purple-400/80")}>BUILDING</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                                    <TabsList variant="line" className="mt-8 gap-8 px-4 lg:px-8 overflow-x-auto">
                                        {([
                                            { value: 'overview', label: 'Overview', icon: Globe },
                                            { value: 'deployments', label: 'Deploy Events', icon: Activity },
                                            { value: 'env', label: 'Environment', icon: Code },
                                            { value: 'logs', label: 'Console Logs', icon: FileText },
                                            { value: 'terminal', label: 'Secure Terminal', icon: Terminal },
                                            { value: 'settings', label: 'Domains & SSL', icon: Shield }
                                        ] as const).map(tab => (
                                            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                                                <tab.icon className="size-4" /> {tab.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-4 lg:p-8">
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-4 lg:p-6">
                                                        <div className="text-muted-foreground text-xs mb-4">Core Technology</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10 flex items-center justify-center border",
                                                                selectedInstance.type.toLowerCase() === 'frontend' ? "bg-primary/10 border-primary/20" : "bg-purple-500/10 border-purple-500/20"
                                                            )}>
                                                                <Code className={cn("size-5", selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary" : "text-purple-400")} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold leading-tight">{selectedInstance.type === 'FRONTEND' ? 'Frontend' : 'Backend'} Application</div>
                                                                <div className="text-xs text-muted-foreground font-medium">
                                                                    {selectedInstance.provider.toLowerCase() === 'github' ? 'GitHub' : 'GitLab'} Repository
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-4 lg:p-6">
                                                        <div className="text-muted-foreground text-xs mb-4">Availability Zone</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10 flex items-center justify-center border",
                                                                selectedInstance.type.toLowerCase() === 'frontend' ? "bg-primary/10 border-primary/20" : "bg-purple-500/10 border-purple-500/20"
                                                            )}>
                                                                <Shield className={cn("size-5", selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary" : "text-purple-400")} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold">US-East (Virginia)</div>
                                                                <div className="text-xs text-muted-foreground">Multi-AZ Enabled</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-4 lg:p-6">
                                                        <div className="text-muted-foreground text-xs mb-4">Instance Health</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10 flex items-center justify-center border",
                                                                selectedInstance.type.toLowerCase() === 'frontend' ? "bg-primary/10 border-primary/20" : "bg-purple-500/10 border-purple-500/20"
                                                            )}>
                                                                <Activity className={cn("size-5", selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary" : "text-purple-400")} />
                                                            </div>
                                                            <div>
                                                                <div className={cn("font-bold", selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary" : "text-purple-400")}>
                                                                    {selectedInstance.status === 'running' ? 'Optimal' : selectedInstance.status}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Monitored</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <Card className="bg-card border-border">
                                                <CardContent className="p-4 lg:p-8">
                                                    <h3 className="text-lg font-bold mb-6">Connection Endpoints</h3>
                                                    <div className="flex flex-col gap-4">
                                                        {selectedInstance.generated_domain ? (
                                                            <>
                                                                <div className="p-4 bg-background border border-border flex items-center justify-between min-w-0">
                                                                    <div className="flex-1 overflow-hidden min-w-0">
                                                                        <div className="text-xs text-muted-foreground mb-1">Public Application URL</div>
                                                                        <code className={cn("text-sm truncate block w-full", selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary/80" : "text-purple-400/80")}>
                                                                            https://{selectedInstance.generated_domain}{selectedInstance.type === 'BACKEND' ? '/health' : ''}
                                                                        </code>
                                                                    </div>
                                                                    <div className="flex gap-2 shrink-0">
                                                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(`https://${selectedInstance.generated_domain}${selectedInstance.type === 'BACKEND' ? '/health' : ''}`, 'prod_url')}>
                                                                            {copiedField === 'prod_url' ? <Check className={cn("size-4", selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary" : "text-purple-400")} /> : <Copy className="size-4" />}
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" onClick={() => window.open(`https://${selectedInstance.generated_domain}${selectedInstance.type === 'BACKEND' ? '/health' : ''}`, '_blank')}>
                                                                            <ExternalLink className="size-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                {selectedInstance.custom_domain && (
                                                                    <div className="p-4 bg-background border border-border flex items-center justify-between min-w-0">
                                                                        <div className="flex-1 overflow-hidden min-w-0">
                                                                            <div className="text-xs text-muted-foreground mb-1">Custom Domain</div>
                                                                            <code className="text-sm truncate block w-full">{selectedInstance.custom_domain}</code>
                                                                        </div>
                                                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(selectedInstance.custom_domain || '', 'custom_domain')}>
                                                                            {copiedField === 'custom_domain' ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-6 p-6 bg-background border border-border">
                                                                <div className="w-14 h-14 rounded-lg bg-zinc-900 flex items-center justify-center border border-border">
                                                                    <Shield className="w-6 h-6 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-foreground mb-1">Internal VPC Protection Active</p>
                                                                    <p className="text-xs text-muted-foreground">This instance is isolated. Connect via External Proxy or Private Tunnel.</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">CPU Limit</div>
                                                                    <code className="text-sm">{selectedInstance.cpu_limit} vCPU</code>
                                                                </CardContent>
                                                            </Card>
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">RAM Limit</div>
                                                                    <code className="text-sm">{selectedInstance.ram_limit} GB</code>
                                                                </CardContent>
                                                            </Card>
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">Branch</div>
                                                                    <code className="text-sm">{selectedInstance.branch}</code>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {selectedInstance.events && selectedInstance.events.length > 0 && (
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-4 lg:p-8">
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
                                                                        event.type === 'success' ? 'bg-emerald-500' :
                                                                            event.type === 'error' ? 'bg-red-500' : 'bg-primary'
                                                                    )} />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <p className={cn(
                                                                                "text-sm font-bold",
                                                                                event.type === 'success' ? (selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary" : "text-purple-400") :
                                                                                    event.type === 'primary' ? (selectedInstance.type.toLowerCase() === 'frontend' ? "text-primary" : "text-purple-400") : 'text-foreground'
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

                                    <TabsContent value="deployments" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-4 lg:p-8">
                                        <Card className="bg-card border-border min-h-[500px]">
                                            <CardContent className="p-4 lg:p-8">
                                                <div className="flex items-center justify-between mb-12">
                                                    <h3 className="text-xl font-semibold">Deployment Lifecycle</h3>
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] mr-1.5" />
                                                        Platform Sync Normal
                                                    </Badge>
                                                </div>
                                                <div className="space-y-10 relative">
                                                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-muted" />
                                                    {selectedInstance.events?.map((e, idx) => (
                                                        <div key={idx} className="flex gap-10 relative group">
                                                            <div className={cn(
                                                                "w-4 h-4 rounded-full border-2 border-zinc-700 relative z-10 shrink-0 mt-2 transition-all",
                                                                e.type === 'success' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                                                                    e.type === 'error' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'bg-primary'
                                                            )} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className={cn("text-xs font-medium ", e.type === 'error' ? 'text-red-400' : e.type === 'success' ? 'text-emerald-400' : 'text-zinc-200')}>
                                                                        {e.message}
                                                                    </p>
                                                                    <span className="text-xs font-bold text-muted-foreground font-mono">
                                                                        {new Date(e.timestamp).toLocaleTimeString()}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground font-mediumr opacity-60">Status Code: 200 — Sync Initiated</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="env" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-4 lg:p-8">
                                        <Card className="bg-card border-border h-[600px] flex flex-col overflow-hidden">
                                            <CardContent className="p-4 lg:p-8 h-full flex flex-col">
                                                <div className="flex items-center justify-between mb-6 shrink-0 z-10">
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                                                            <Code className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold">Environment Variables</h3>
                                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">Secure secrets mapped to your deployment runtime.</p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={() => handleSaveEnvContent(selectedInstance._id)}
                                                        disabled={isSavingEnv}
                                                        className="rounded-lg h-12 px-8 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                                                    >
                                                        {isSavingEnv ? (
                                                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving</>
                                                        ) : (
                                                            "Save & Redeploy"
                                                        )}
                                                    </Button>
                                                </div>

                                                <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                                                <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden relative group transition-all focus-within:border-primary/20">
                                                    <div className="absolute top-0 left-0 bottom-0 w-12 bg-muted border-r border-border flex flex-col items-center py-6 text-xs font-mono text-muted-foreground select-none">
                                                        {envDraft.split('\n').map((_, i) => <div key={i} className="leading-loose">{i + 1}</div>)}
                                                    </div>
                                                    <Textarea
                                                        value={envDraft}
                                                        onChange={(e) => setEnvDraft(e.target.value)}
                                                        spellCheck={false}
                                                        placeholder={"KEY=VALUE\nPORT=8080\nNODE_ENV=production"}
                                                        className="w-full h-full p-6 pl-16 bg-transparent border-none outline-none font-mono text-sm leading-loose text-foreground placeholder:text-muted-foreground resize-none selection:bg-primary/30 custom-scrollbar"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-4 lg:p-8">
                                        <Card className="bg-card border-border h-[600px] flex flex-col font-mono text-sm overflow-hidden">
                                            <CardHeader className="pb-0 px-8 pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-primary/20" />
                                                        <div className="w-3 h-3 rounded-full bg-primary/20" />
                                                        <div className="w-3 h-3 rounded-full bg-primary/20" />
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground">Application Stdout/Stderr</span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1 overflow-y-auto space-y-1 pr-4 custom-scrollbar">
                                                {selectedInstance.logs && selectedInstance.logs.length > 0 ? (
                                                    selectedInstance.logs.map((log, i) => (
                                                        <div key={i} className="text-zinc-400 hover:text-foreground transition-colors py-0.5 border-l border-border pl-4 hover:bg-muted flex gap-4">
                                                            <span className="text-primary/50 shrink-0 select-none">[{i + 1}]</span>
                                                            <span className="break-all">{log}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                                                        <FileText className="w-12 h-12 mb-4 opacity-10" />
                                                        No Application Logs Found
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="terminal" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-4 lg:p-8">
                                        <Card className="bg-card border-border h-[600px] flex flex-col overflow-hidden">
                                            <CardHeader className="px-8 pt-5 pb-0 border-b border-border bg-muted">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <Terminal className="w-5 h-5 text-primary" />
                                                        <span className="text-xs text-muted-foreground">
                                                            Isolated TTY — {selectedInstance.name.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-bold">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" /> Egress Filter Active
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1 overflow-y-auto p-4 lg:p-8 font-mono text-xs leading-relaxed space-y-3 custom-scrollbar selection:bg-primary/30">
                                                {terminalLogs.map((log, i) => (
                                                    <div key={i} className={cn(
                                                        "break-all whitespace-pre-wrap",
                                                        log.type === 'input' ? "text-foreground flex gap-3 font-bold" :
                                                            log.type === 'error' ? "text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/10" :
                                                                "text-primary/90"
                                                    )}>
                                                        {log.type === 'input' && <span className="text-primary shrink-0">➜</span>}
                                                        {log.text}
                                                    </div>
                                                ))}
                                                {isExecuting && (
                                                    <div className="text-muted-foreground animate-pulse flex items-center gap-3 mt-4">
                                                        <RefreshCw className="w-3 h-3 animate-spin text-primary" /> Connecting to runtime node...
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter className="p-6 bg-background border-t border-border">
                                                <form onSubmit={handleExecuteCommand} className="flex items-center gap-4 w-full focus-within:bg-card transition-all">
                                                    <span className="text-primary font-bold ml-2">➜</span>
                                                    <input
                                                        name="command"
                                                        autoComplete="off"
                                                        placeholder="Type 'help' to see authorized commands..."
                                                        className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground"
                                                        disabled={isExecuting}
                                                    />
                                                    <Button
                                                        type="submit"
                                                        disabled={isExecuting}
                                                        className="rounded-xl h-10 px-6 shadow-lg shadow-primary/20"
                                                    >
                                                        Execute
                                                    </Button>
                                                </form>
                                            </CardFooter>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-4 lg:p-8">
                                        <div className="max-w-2xl space-y-12">
                                            <Card className="bg-card border-border">
                                                <CardContent className="p-4 lg:p-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h3 className="text-xl font-semibold">Git Integrations</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                                        <div className={cn("p-4 rounded-xl border transition-all flex flex-col items-center gap-3", user?.github_profile ? "bg-primary/5 border-primary/20" : "bg-muted border-border")}>
                                                            <Github className={cn("w-6 h-6", user?.github_profile ? "text-primary" : "text-muted-foreground")} />
                                                            <div className="text-center">
                                                                <div className="text-xs font-medium mb-1">GitHub</div>
                                                                <div className="text-xs text-muted-foreground font-medium">
                                                                    {user?.github_profile ? `@${user.github_profile.username}` : "Not Connected"}
                                                                </div>
                                                            </div>
                                                            <Button variant="outline" size="sm" onClick={() => handleConnectProvider('GITHUB')} className="w-full">
                                                                {user?.github_profile ? "Switch" : "Connect"}
                                                            </Button>
                                                        </div>

                                                        <div className={cn("p-4 rounded-xl border transition-all flex flex-col items-center gap-3", user?.gitlab_profile ? "bg-orange-600/5 border-orange-500/20" : "bg-muted border-border")}>
                                                            <Gitlab className={cn("w-6 h-6", user?.gitlab_profile ? "text-orange-500" : "text-muted-foreground")} />
                                                            <div className="text-center">
                                                                <div className="text-xs font-medium mb-1">GitLab</div>
                                                                <div className="text-xs text-muted-foreground font-medium">
                                                                    {user?.gitlab_profile ? `@${user.gitlab_profile.username}` : "Not Connected"}
                                                                </div>
                                                            </div>
                                                            <Button variant="outline" size="sm" onClick={() => handleConnectProvider('GITLAB')} className="w-full">
                                                                {user?.gitlab_profile ? "Switch" : "Connect"}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <Separator className="my-8" />

                                                    <div className="flex items-center justify-between mb-8">
                                                        <h3 className="text-xl font-semibold">Source Protection & CI/CD</h3>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between p-6 rounded-xl bg-muted/50 border border-border group hover:border-primary/30 transition-all">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <RefreshCw className="w-4 h-4 text-emerald-500" />
                                                                    <h4 className="font-bold text-sm">Auto-reploy on Push</h4>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[300px]">Whenever you push code to <b>{selectedInstance.branch}</b> branch, Nexode will automatically rebuild and redeploy your node.</p>
                                                            </div>
                                                            <Switch
                                                                checked={selectedInstance.auto_deploy_on_push}
                                                                onCheckedChange={() => handleToggleAutoDeploy(!selectedInstance.auto_deploy_on_push)}
                                                            />
                                                        </div>

                                                        <Card className="bg-muted/50 border-border">
                                                            <CardContent className="p-6 group hover:border-primary/30 transition-all">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Globe className="w-4 h-4 text-primary" />
                                                                        <h4 className="font-bold text-sm">Custom Domain</h4>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-muted-foreground">SSL Auto-configured</Badge>
                                                                </div>
                                                                <form onSubmit={async (e) => {
                                                                    e.preventDefault();
                                                                    const formData = new FormData(e.currentTarget);
                                                                    const domain = (formData.get('custom_domain') as string)?.trim();
                                                                    if (!domain) return;
                                                                    try {
                                                                        const token = getAccessToken();
                                                                        const GQL_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api-v1/graphql';
                                                                        const res = await fetch(GQL_URL, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                            credentials: 'include',
                                                                            body: JSON.stringify({
                                                                                query: `mutation UpdateDomain($id: String!, $custom_domain: String!) { updateComputeCustomDomain(id: $id, custom_domain: $custom_domain) { _id custom_domain } }`,
                                                                                variables: { id: selectedInstance._id, custom_domain: domain },
                                                                            }),
                                                                        });
                                                                        const result = await res.json();
                                                                        if (result.data?.updateComputeCustomDomain) {
                                                                            toast.success(`Domain updated to ${domain}`);
                                                                            fetchInstances();
                                                                        } else if (result.errors) {
                                                                            toast.error(result.errors[0]?.message || 'Failed to update domain');
                                                                        }
                                                                    } catch {
                                                                        toast.error('Failed to update domain');
                                                                    }
                                                                }} className="flex gap-4">
                                                                    <Input
                                                                        name="custom_domain"
                                                                        className="flex-1 bg-card border border-muted rounded-lg h-14 text-sm font-bold placeholder:text-muted-foreground focus:border-primary/50"
                                                                        placeholder="e.g. app.myproject.com"
                                                                        defaultValue={selectedInstance.custom_domain}
                                                                    />
                                                                    <Button type="submit" className="rounded-lg h-14 px-8">Update</Button>
                                                                </form>
                                                                {selectedInstance.generated_domain && (
                                                                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <Globe className="w-3 h-3" />
                                                                        <span>Auto-assigned: <code className="text-zinc-400">{selectedInstance.generated_domain}</code></span>
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-red-500/20 bg-red-500/5">
                                                <CardContent className="p-4 lg:p-8">
                                                    <h3 className="text-red-400 font-semibold mb-4">Danger Zone</h3>
                                                    <p className="text-muted-foreground text-xs mb-6 px-1">Deleting this instance will immediately stop your services and remove all associated load balancers and networking rules.</p>
                                                    <Button onClick={() => handleDelete(selectedInstance._id)} variant="destructive" className="rounded-lg w-full h-14">Terminate Instance</Button>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Cpu className="size-16 text-muted-foreground mb-6" />
                                <h1 className="text-2xl font-bold mb-2">No active instances found</h1>
                                <p className="text-muted-foreground max-w-xs mx-auto mb-4">Deploy your backend or frontend from a Git repository.</p>
                                <div className="bg-muted/50 border border-border rounded-lg p-4 max-w-md mb-6 text-left">
                                    <p className="text-sm font-medium mb-2 flex items-center gap-2">📋 Requirements</p>
                                    <ul className="text-xs text-muted-foreground space-y-1.5">
                                        <li className="flex items-start gap-2"><span className="text-primary">•</span> A <code className="bg-background px-1.5 py-0.5 rounded font-mono">Dockerfile</code> in the root of your repository</li>
                                        <li className="flex items-start gap-2"><span className="text-primary">•</span> A public Git repository URL (or private with token)</li>
                                        <li className="flex items-start gap-2"><span className="text-primary">•</span> Your app listening on a port (default: 3000 or 4000)</li>
                                    </ul>
                                </div>
                                <Button onClick={handleCreateClick} className="gap-2">
                                    <Plus className="size-4" /> Deploy Instance
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ProvisionNodeModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchInstances();
                    refetchGlobal();
                }}
                user={user}
                subscriptions={subscriptions}
                initialProvider={initialProvider}
                isSuperuser={isStaff}
            />
            <SubscriptionLimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                serviceName="Compute"
                serviceId="compute"
                usedSlots={computeUsedSlots}
                totalSlots={computeTotalSlots}
            />
        </>
    );
}


export default function ComputePage() {
    return (
        <Suspense fallback={null}>
            <ComputePageContent />
        </Suspense>
    );
}
