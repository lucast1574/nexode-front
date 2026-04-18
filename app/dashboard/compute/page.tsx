"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Cpu,
    Rocket,
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
    ChevronRight,
    Server,
    Terminal,
    FileText,
    Copy,
    Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sidebar, Subscription } from "@/components/Sidebar";
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
    { type: 'output', text: 'Nexode Secure Terminal — Secure Shell Proxy' },
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
    const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'env' | 'logs' | 'terminal' | 'settings'>('overview');
    const [envDraft, setEnvDraft] = useState('');
    const [isSavingEnv, setIsSavingEnv] = useState(false);
    const [initialProvider, setInitialProvider] = useState<'GITHUB' | 'GITLAB'>('GITHUB');

    const [terminalLogs, setTerminalLogs] = useState<{ type: 'input' | 'output' | 'error', text: string }[]>(INITIAL_TERMINAL_LOGS);
    const [isExecuting, setIsExecuting] = useState(false);
    const [restarting, setRestarting] = useState<boolean>(false);
    const [cooldown, setCooldown] = useState<number>(0);
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
                        _id name type provider repository_url branch status auto_deploy_on_push env_content cpu_limit ram_limit custom_domain generated_domain created_on
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

            // Clear the search parameters after handling them to avoid infinite loop
            router.replace('/dashboard/compute');
        }
    }, [searchParams, showAlert, fetchInstances, router]);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    // Subscription slot check
    const computeSubscriptions = subscriptions.filter(s => s.service === 'compute');
    const computeUsedSlots = instances.length;
    const computeTotalSlots = computeSubscriptions.length;
    const canCreateCompute = isSuperuser || computeUsedSlots < computeTotalSlots;

    const handleCreateClick = () => {
        if (canCreateCompute) {
            setShowCreateModal(true);
        } else {
            setShowLimitModal(true);
        }
    };

    // Auto-refresh when deploying
    useEffect(() => {
        const isDeploying = instances.some(i => i.status.toLowerCase() === 'provisioning' || i.status.toLowerCase() === 'restarting');
        let interval: NodeJS.Timeout;
        if (isDeploying) {
            interval = setInterval(() => {
                fetchInstances();
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [instances, fetchInstances]);

    // Reset terminal when instance or tab changes
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
        if (!force && (cooldown > 0 || restarting)) return;
        setRestarting(true);
        if (!force) setCooldown(60);

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
                    }
                } catch (error) { console.error(error); }
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Syncing Compute Engine...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

                <header className="h-28 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0 z-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <Cpu className="w-6 h-6 text-blue-500" />
                            <h2 className="text-xl font-black tracking-tight">Cloud Compute</h2>
                        </div>
                    </div>
                    <Button
                        onClick={handleCreateClick}
                        
                        className={cn(
                            "rounded-2xl gap-2 font-bold shadow-lg transition-all",
                            "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                        )}
                    >
                        {<><Plus className="w-4 h-4" /> Deploy Instance</>}
                    </Button>
                </header>

                <div className="flex-1 flex overflow-hidden z-10">
                    {/* Sidebar: Instance List */}
                    <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                <Search className="w-4 h-4 text-zinc-500" />
                                <input type="text" placeholder="Search instances..." className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-400" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {instances.length === 0 ? (
                                <div className="text-center py-12 px-4 opacity-50">
                                    <Rocket className="w-10 h-10 mx-auto mb-4 text-zinc-600" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">No Instances Active</p>
                                </div>
                            ) : (
                                instances.map((inst) => (
                                    <button
                                        key={inst._id}
                                        onClick={() => setSelectedInstance(inst)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden",
                                            selectedInstance?._id === inst._id ? "bg-blue-500/10 border-blue-500/20" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                inst.type.toLowerCase() === 'frontend' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' : 'text-purple-400 border-purple-400/20 bg-purple-400/10'
                                            )}>
                                                {inst.type}
                                            </span>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", inst.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse')} />
                                        </div>
                                        <div className="font-bold text-sm truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{inst.name}</div>
                                        <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                                            <Globe className="w-3 h-3" /> {inst.generated_domain || 'Internal VPC'}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 bg-[#050505] overflow-y-auto">
                        {selectedInstance ? (
                            <div className="p-12 max-w-6xl mx-auto">
                                <div className="flex items-start justify-between mb-12">
                                    <div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <h1 className="text-4xl font-black tracking-tighter uppercase">{selectedInstance.name}</h1>
                                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                                                ● {selectedInstance.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-zinc-500 text-sm font-medium">
                                            <div className="flex items-center gap-2"><Layers className="w-4 h-4" /> {selectedInstance.cpu_limit} vCPU</div>
                                            <div className="flex items-center gap-2 border-l border-white/10 pl-4"><Server className="w-4 h-4" /> {selectedInstance.ram_limit} GB RAM</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {selectedInstance.generated_domain && (
                                            <Button 
                                                variant="outline" 
                                                onClick={() => window.open(`https://${selectedInstance.generated_domain}/status`, '_blank')}
                                                className="rounded-xl border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 gap-2"
                                            >
                                                <Activity className="w-4 h-4" /> Check Status
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleRestart(selectedInstance._id)} 
                                            disabled={cooldown > 0 || restarting}
                                            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 min-w-[100px]"
                                        >
                                            <RefreshCw className={cn("w-4 h-4 mr-2", restarting ? "animate-spin text-blue-500" : "")} />
                                            {cooldown > 0 ? `${cooldown}s` : 'Redeploy'}
                                        </Button>
                                        <Button onClick={() => handleDelete(selectedInstance._id)} className="rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="flex gap-8 border-b border-white/5 mb-12 overflow-x-auto scrollbar-hide">
                                    {(['overview', 'deployments', 'env', 'logs', 'terminal', 'settings'] as const).map(id => {
                                        const tabMeta = {
                                            overview: { label: 'Overview', icon: Globe },
                                            deployments: { label: 'Deploy Events', icon: Activity },
                                            env: { label: 'Environment', icon: Code },
                                            logs: { label: 'Console Logs', icon: FileText },
                                            terminal: { label: 'Secure Terminal', icon: Terminal },
                                            settings: { label: 'Domains & SSL', icon: Shield }
                                        }[id];
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => setActiveTab(id)}
                                                className={cn(
                                                    "flex items-center gap-2 pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0",
                                                    activeTab === id ? "text-blue-500" : "text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                <tabMeta.icon className="w-4 h-4" /> {tabMeta.label}
                                                {activeTab === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />}
                                            </button>
                                        );
                                    })}

                                </div>

                                {/* Tab Content */}
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {activeTab === 'overview' && (
                                        <div className="space-y-8 max-w-4xl">
                                            {/* Primary Domain Status */}
                                            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8">
                                                    {selectedInstance.status === 'running' ? (
                                                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Reachable
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> {selectedInstance.status}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mb-8">
                                                    <h3 className="text-lg font-black uppercase tracking-tight mb-2">Network Endpoint</h3>
                                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                                        {selectedInstance.type.toLowerCase() === 'frontend' ? 'Public Application URL' : 'Internal VPC Gateway'}
                                                    </p>
                                                </div>

                                                {selectedInstance.generated_domain ? (
                                                    <div className="flex flex-col gap-4">
                                                        <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between group/url">
                                                            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                                    <Activity className="w-5 h-5 text-blue-500" />
                                                                </div>
                                                                {selectedInstance.status === 'running' ? (
                                                                    <code className="text-sm font-black truncate text-blue-100">
                                                                        https://{selectedInstance.generated_domain}{selectedInstance.type === 'BACKEND' ? '/health' : ''}
                                                                    </code>
                                                                ) : (
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                                        <span className="text-sm font-bold text-zinc-500">Deploying... URL will appear when ready</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {selectedInstance.status === 'running' && (
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="icon" onClick={() => handleCopy(`https://${selectedInstance.generated_domain}${selectedInstance.type === 'BACKEND' ? '/health' : ''}`, 'prod_url')} className="hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 rounded-xl">
                                                                    {copiedField === 'prod_url' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => window.open(`https://${selectedInstance.generated_domain}${selectedInstance.type === 'BACKEND' ? '/health' : ''}`, '_blank')} className="hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 rounded-xl">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                            )}
                                                        </div>
                                                        {selectedInstance.custom_domain && (
                                                            <div className="p-4 rounded-2xl bg-black border border-white/5 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Custom Domain</div>
                                                                    <code className="text-xs font-black text-zinc-300">{selectedInstance.custom_domain}</code>
                                                                </div>
                                                                <Button variant="ghost" size="sm" onClick={() => handleCopy(selectedInstance.custom_domain || '', 'custom_domain')} className="text-zinc-500 hover:text-white rounded-lg px-2">
                                                                    {copiedField === 'custom_domain' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-6 p-6 rounded-[32px] bg-black border border-white/5">
                                                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5">
                                                            <Shield className="w-6 h-6 text-zinc-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white font-black uppercase tracking-widest mb-1">Internal VPC Protection Active</p>
                                                            <p className="text-[10px] text-zinc-600">This instance is isolated. Connect via External Proxy or Private Tunnel.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {!selectedInstance.generated_domain && selectedInstance.type.toLowerCase() === 'frontend' && (
                                                    <div className="mt-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex gap-4 items-center">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Deployment Pending: Domain propagation in progress</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Source Information */}
                                                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Source Integration</h3>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-black border border-white/5 group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 text-zinc-400 group-hover:text-blue-500 transition-colors">
                                                                    {selectedInstance.provider.toLowerCase() === 'github' ? <Github className="w-6 h-6" /> : <Gitlab className="w-6 h-6" />}
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] font-black uppercase text-zinc-600 mb-0.5">Connected Repository</div>
                                                                    <div className="text-sm font-black truncate max-w-[150px]">{selectedInstance.repository_url.split('/').pop()}</div>
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="rounded-xl text-zinc-500 hover:text-white" onClick={() => window.open(selectedInstance.repository_url, '_blank')}>
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-black border border-white/5 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-[10px] font-black text-zinc-600 uppercase mb-0.5">Branch</div>
                                                                <div className="flex items-center gap-2 font-mono text-sm text-blue-400/80">
                                                                    <Code className="w-3 h-3" /> {selectedInstance.branch}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Compact Deploy Events */}
                                                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Latest Events</h3>
                                                    <div className="space-y-4">
                                                        {selectedInstance.events && selectedInstance.events.length > 0 ? (
                                                            selectedInstance.events.slice(-3).reverse().map((e, idx) => (
                                                                <div key={idx} className="flex gap-4 items-start relative pb-4 last:pb-0 border-b border-white/5 last:border-0">
                                                                    <div className={cn(
                                                                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                                                        e.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                                                                            e.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                                                    )} />
                                                                    <div className="flex-1">
                                                                        <p className={cn("text-xs font-black uppercase tracking-tight", e.type === 'error' ? 'text-red-400' : 'text-zinc-300')}>
                                                                            {e.message}
                                                                        </p>
                                                                        <span className="text-[9px] font-bold text-zinc-600">
                                                                            {new Date(e.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="py-6 text-center text-[10px] font-black uppercase text-zinc-700 tracking-widest">
                                                                No recent events
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'deployments' && (
                                        <div className="bg-black border border-white/5 rounded-[40px] p-12 overflow-hidden relative min-h-[500px]">
                                            <div className="flex items-center justify-between mb-12">
                                                <h3 className="text-xl font-black uppercase tracking-tight">Deployment Lifecycle</h3>
                                                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 backdrop-blur-md shadow-lg shadow-emerald-500/5">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 
                                                    Platform Sync Normal
                                                </div>
                                            </div>
                                            <div className="space-y-10 relative">
                                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/5" />
                                                {selectedInstance.events?.map((e, idx) => (
                                                    <div key={idx} className="flex gap-10 relative group">
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full border-2 border-zinc-700 relative z-10 shrink-0 mt-2 transition-all",
                                                            e.type === 'success' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                                                                e.type === 'error' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                                        )} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className={cn("text-xs font-black uppercase tracking-widest", e.type === 'error' ? 'text-red-400' : e.type === 'success' ? 'text-emerald-400' : 'text-zinc-200')}>
                                                                    {e.message}
                                                                </p>
                                                                <span className="text-[10px] font-black text-zinc-600 font-mono">
                                                                    {new Date(e.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider opacity-60">Status Code: 200 — Sync Initiated</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'env' && (
                                        <div className="bg-[#080808] border border-white/5 rounded-[40px] p-8 h-[600px] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="flex items-center justify-between mb-6 shrink-0 z-10">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/5 flex items-center justify-center">
                                                        <Code className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black uppercase tracking-tight">Environment Variables</h3>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">Secure secrets mapped to your deployment runtime.</p>
                                                    </div>
                                                </div>
                                                
                                                <Button 
                                                    onClick={() => handleSaveEnvContent(selectedInstance._id)}
                                                    disabled={isSavingEnv}
                                                    className="rounded-2xl h-12 px-8 bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all"
                                                >
                                                    {isSavingEnv ? (
                                                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving</>
                                                    ) : (
                                                        "Save & Redeploy"
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

                                            <div className="flex-1 rounded-[32px] border border-white/5 bg-black overflow-hidden relative group transition-all focus-within:border-blue-500/20">
                                                <div className="absolute top-0 left-0 bottom-0 w-12 bg-white/[0.02] border-r border-white/5 flex flex-col items-center py-6 text-[10px] font-mono text-zinc-700 select-none">
                                                    {envDraft.split('\n').map((_, i) => <div key={i} className="leading-loose">{i + 1}</div>)}
                                                </div>
                                                <textarea
                                                    value={envDraft}
                                                    onChange={(e) => setEnvDraft(e.target.value)}
                                                    spellCheck={false}
                                                    placeholder="KEY=VALUE&#10;PORT=8080&#10;NODE_ENV=production"
                                                    className="w-full h-full p-6 pl-16 bg-transparent border-none outline-none font-mono text-sm leading-loose text-zinc-300 placeholder:text-zinc-800 resize-none selection:bg-blue-500/30 custom-scrollbar"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'logs' && (
                                        <div className="bg-[#080808] border border-white/5 rounded-[40px] p-8 h-[600px] flex flex-col font-mono text-sm overflow-hidden shadow-2xl">
                                            <div className="flex items-center justify-between mb-6 shrink-0">
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500/20" />
                                                    <div className="w-3 h-3 rounded-full bg-blue-500/20" />
                                                    <div className="w-3 h-3 rounded-full bg-blue-500/20" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Application Stdout/Stderr</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto space-y-1 pr-4 custom-scrollbar">
                                                {selectedInstance.logs && selectedInstance.logs.length > 0 ? (
                                                    selectedInstance.logs.map((log, i) => (
                                                        <div key={i} className="text-zinc-400 hover:text-white transition-colors py-0.5 border-l border-white/5 pl-4 hover:bg-white/[0.02] flex gap-4">
                                                            <span className="text-blue-500/50 shrink-0 select-none">[{i + 1}]</span>
                                                            <span className="break-all">{log}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 uppercase font-black tracking-widest text-xs">
                                                        <FileText className="w-12 h-12 mb-4 opacity-10" />
                                                        No Application Logs Found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'terminal' && (
                                        <div className="bg-black border border-white/5 rounded-[40px] h-[600px] flex flex-col overflow-hidden shadow-2xl relative group">
                                            {/* Terminal Header */}
                                            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                                                <div className="flex items-center gap-4">
                                                    <Terminal className="w-5 h-5 text-blue-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                        Isolated TTY — {selectedInstance.name.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Egress Filter Active
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Terminal Body */}
                                            <div className="flex-1 overflow-y-auto p-8 font-mono text-xs leading-relaxed space-y-3 custom-scrollbar selection:bg-blue-500/30">
                                                {terminalLogs.map((log, i) => (
                                                    <div key={i} className={cn(
                                                        "break-all whitespace-pre-wrap",
                                                        log.type === 'input' ? "text-white/90 flex gap-3 font-black" :
                                                            log.type === 'error' ? "text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/10" :
                                                                "text-blue-400/90"
                                                    )}>
                                                        {log.type === 'input' && <span className="text-blue-500 shrink-0">➜</span>}
                                                        {log.text}
                                                    </div>
                                                ))}
                                                {isExecuting && (
                                                    <div className="text-zinc-600 animate-pulse flex items-center gap-3 mt-4">
                                                        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> Connecting to runtime node...
                                                    </div>
                                                )}
                                            </div>

                                            {/* Terminal Input */}
                                            <form onSubmit={handleExecuteCommand} className="p-6 bg-[#080808] border-t border-white/5 flex items-center gap-4 shrink-0 focus-within:bg-black transition-all">
                                                <span className="text-blue-600 font-black ml-2">➜</span>
                                                <input
                                                    name="command"
                                                    autoComplete="off"
                                                    placeholder="Type 'help' to see authorized commands..."
                                                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-zinc-800"
                                                    disabled={isExecuting}
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={isExecuting}
                                                    className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                                >
                                                    Execute
                                                </Button>
                                            </form>
                                        </div>
                                    )}

                                    {activeTab === 'settings' && (
                                        <div className="max-w-2xl space-y-12">
                                            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h3 className="text-xl font-black uppercase tracking-tight">Git Integrations</h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                                    {/* GitHub */}
                                                    <div className={cn("p-4 rounded-[28px] border transition-all flex flex-col items-center gap-3", user?.github_profile ? "bg-blue-600/5 border-blue-500/20" : "bg-white/[0.02] border-white/5")}>
                                                        <Github className={cn("w-6 h-6", user?.github_profile ? "text-blue-500" : "text-zinc-600")} />
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-black uppercase tracking-widest mb-1">GitHub</div>
                                                            <div className="text-[9px] text-zinc-500 font-medium">
                                                                {user?.github_profile ? `@${user.github_profile.username}` : "Not Connected"}
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleConnectProvider('GITHUB')}
                                                            className="w-full rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase h-8"
                                                        >
                                                            {user?.github_profile ? "Switch" : "Connect"}
                                                        </Button>
                                                    </div>

                                                    {/* GitLab */}
                                                    <div className={cn("p-4 rounded-[28px] border transition-all flex flex-col items-center gap-3", user?.gitlab_profile ? "bg-orange-600/5 border-orange-500/20" : "bg-white/[0.02] border-white/5")}>
                                                        <Gitlab className={cn("w-6 h-6", user?.gitlab_profile ? "text-orange-500" : "text-zinc-600")} />
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-black uppercase tracking-widest mb-1">GitLab</div>
                                                            <div className="text-[9px] text-zinc-500 font-medium">
                                                                {user?.gitlab_profile ? `@${user.gitlab_profile.username}` : "Not Connected"}
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleConnectProvider('GITLAB')}
                                                            className="w-full rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase h-8"
                                                        >
                                                            {user?.gitlab_profile ? "Switch" : "Connect"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-8 pt-8 border-t border-white/5">
                                                    <h3 className="text-xl font-black uppercase tracking-tight">Source Protection & CI/CD</h3>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-black/40 border border-white/5 group hover:border-blue-500/30 transition-all">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <RefreshCw className="w-4 h-4 text-emerald-500" />
                                                                <h4 className="font-bold text-sm">Auto-reploy on Push</h4>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[300px]">Whenever you push code to <b>{selectedInstance.branch}</b> branch, Nexode will automatically rebuild and redeploy your node.</p>
                                                        </div>
                                                        <div 
                                                            onClick={() => handleToggleAutoDeploy(!selectedInstance.auto_deploy_on_push)}
                                                            className={cn(
                                                                "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300",
                                                                selectedInstance.auto_deploy_on_push ? "bg-blue-600" : "bg-zinc-800"
                                                            )}
                                                        >
                                                            <div className={cn("w-4 h-4 bg-white rounded-full transition-transform duration-300", selectedInstance.auto_deploy_on_push ? "translate-x-6" : "translate-x-0")} />
                                                        </div>
                                                    </div>

                                                    <div className="p-6 rounded-3xl bg-black/40 border border-white/5 group hover:border-blue-500/30 transition-all">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="w-4 h-4 text-blue-500" />
                                                                <h4 className="font-bold text-sm">Custom Domain</h4>
                                                            </div>
                                                            <span className="text-[9px] font-black text-zinc-600 uppercase">SSL Auto-configured</span>
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
                                                            } catch (err) {
                                                                toast.error('Failed to update domain');
                                                            }
                                                        }} className="flex gap-4">
                                                            <input
                                                                name="custom_domain"
                                                                className="flex-1 bg-black border border-white/10 rounded-2xl px-6 h-14 text-sm font-bold placeholder:text-zinc-700 focus:border-blue-500/50 transition-all outline-none"
                                                                placeholder="e.g. app.myproject.com"
                                                                defaultValue={selectedInstance.custom_domain}
                                                            />
                                                            <Button type="submit" className="rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-500 font-bold uppercase tracking-widest text-xs">Update</Button>
                                                        </form>
                                                        {selectedInstance.generated_domain && (
                                                            <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
                                                                <Globe className="w-3 h-3" />
                                                                <span>Auto-assigned: <code className="text-zinc-400">{selectedInstance.generated_domain}</code></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-[40px]">
                                                <h3 className="text-red-400 font-black uppercase tracking-tight mb-4">Danger Zone</h3>
                                                <p className="text-zinc-500 text-xs mb-6 px-1">Deleting this instance will immediately stop your services and remove all associated load balancers and networking rules.</p>
                                                <Button onClick={() => handleDelete(selectedInstance._id)} className="rounded-2xl bg-transparent border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all w-full font-black uppercase tracking-widest h-14 text-xs">Terminate Instance</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-80 animate-in fade-in zoom-in duration-700">
                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full scale-150" />
                                    <Rocket className="w-24 h-24 text-blue-500 relative" />
                                </div>
                                <h2 className="text-5xl font-black tracking-tighter uppercase mb-4">Command Center</h2>
                                <p className="text-zinc-500 max-w-md mx-auto text-lg mb-12">Provision high-performance compute clusters and deploy your applications globally in nano-seconds.</p>
                                <Button onClick={handleCreateClick}  className="h-16 px-12 rounded-3xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20">
                                    Deploy First Node <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ProvisionNodeModal 
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchInstances}
                user={user}
                subscriptions={subscriptions}
                initialProvider={initialProvider}
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
