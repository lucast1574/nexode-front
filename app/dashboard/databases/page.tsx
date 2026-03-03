"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Database,
    Plus,
    Search,
    Terminal,
    Key,
    Activity,
    Trash2,
    Copy,
    Check,
    RefreshCw,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, Subscription } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { DeleteDatabaseModal } from "@/components/modals/DeleteDatabaseModal";

interface DatabaseInstance {
    _id: string;
    name: string;
    type: string;
    status: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    db_name?: string;
    connection_string?: string;
    public_uri?: string;
    internal_uri?: string;
    created_on: string;
    events?: { timestamp: string; message: string; type: string }[];
}

interface User {
    first_name: string;
    email: string;
    avatar?: string;
}

const INITIAL_TERMINAL_LOGS: { type: 'input' | 'output' | 'error', text: string }[] = [
    { type: 'output', text: 'Nexode Secure Terminal v1.1.0' },
    { type: 'output', text: 'Establishing secure proxy connection...' },
    { type: 'output', text: 'Connected to isolated cluster. Type "help" to see available commands.' }
];

export default function DatabasesPage() {
    const [loading, setLoading] = useState(true);
    const [databases, setDatabases] = useState<DatabaseInstance[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedDb, setSelectedDb] = useState<DatabaseInstance | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [dbToDelete, setDbToDelete] = useState<DatabaseInstance | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'terminal'>('overview');

    const [terminalLogs, setTerminalLogs] = useState<{ type: 'input' | 'output' | 'error', text: string }[]>(INITIAL_TERMINAL_LOGS);
    const [isExecuting, setIsExecuting] = useState(false);

    const fetchDatabases = useCallback(async () => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            if (!token) return;

            const query = `
                query GetDatabases {
                    me { first_name email avatar }
                    mySubscriptions { id service status plan { name slug features } }
                    myDatabases {
                        _id name type status host port username password db_name connection_string public_uri internal_uri created_on
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
                setSubscriptions(result.data.mySubscriptions || []);
                const dbs = result.data.myDatabases || [];
                setDatabases(dbs);

                if (selectedDb) {
                    const updated = dbs.find((d: DatabaseInstance) => d._id === selectedDb._id);
                    if (updated) {
                        setSelectedDb(updated);
                    } else {
                        setSelectedDb(dbs.length > 0 ? dbs[0] : null);
                    }
                } else if (dbs.length > 0) {
                    setSelectedDb(dbs[0]);
                }
            }
        } catch (error) {
            console.error("Fetch DB error:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedDb]);

    useEffect(() => {
        fetchDatabases();
    }, [fetchDatabases]);

    // Clear terminal logs when database changes, tab changes, or on initial load
    useEffect(() => {
        setTerminalLogs([...INITIAL_TERMINAL_LOGS]);
    }, [selectedDb?._id, activeTab]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCreateDb = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const type = formData.get('type') as string;

        // Extract the correct plan slug from active subscriptions
        const dbPlan = subscriptions.find(s => s.service === 'database');

        if (!dbPlan) {
            alert("No active database subscription found. You must be subscribed to create a database.");
            return;
        }

        const plan_slug = dbPlan.plan.slug;

        if (name.length < 3) {
            alert("Instance name must be at least 3 characters long.");
            return;
        }

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            console.log(`[Databases] Attempting to create database "${name}" with type "${type}" using plan "${plan_slug}"...`);

            const mutation = `
                mutation CreateDatabase($input: CreateDatabaseInput!) {
                    createDatabase(input: $input) {
                        _id name status
                    }
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
                    variables: { input: { name, type, plan_slug } }
                }),
            });


            const result = await res.json();
            console.log("[Databases] Create result:", result);

            if (result.data?.createDatabase) {
                setShowCreateModal(false);
                setTerminalLogs([...INITIAL_TERMINAL_LOGS]);
                fetchDatabases();
            } else if (result.errors) {
                const mainError = result.errors[0];
                const msg = mainError?.message || "An unexpected error occurred.";
                const code = mainError?.extensions?.code || "UNKNOWN";

                console.group("[Databases] Mutation Failure Details");
                console.error("Primary Message:", msg);
                console.error("Error Code:", code);
                console.error("Full Error Stack:", result.errors);
                console.groupEnd();

                alert(`Creation Failed: ${msg} (Code: ${code})`);
            } else {

                alert("Communication error with the server. Please check your connection.");
            }
        } catch (err) {
            const error = err as Error;
            console.error("[Databases] Network or execution error:", error);
            alert(`Execution Error: ${error.message || 'Unknown error'}`);
        }
    };

    const handleRestartDb = async (id: string) => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            const mutation = `
                mutation RestartDatabase($id: String!) {
                    restartDatabase(id: $id) {
                        _id status
                    }
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
                    variables: { id }
                }),
            });

            const result = await res.json();
            if (result.data?.restartDatabase) {
                fetchDatabases();
            } else {
                alert("Failed to restart database instance.");
            }
        } catch (error) {
            console.error("Restart error:", error);
            alert("An error occurred while restarting the database.");
        }
    };

    const handleDeleteDb = async (db: DatabaseInstance) => {
        setDbToDelete(db);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!dbToDelete) return;

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            const mutation = `
                mutation DeleteDatabase($id: String!) {
                    deleteDatabase(id: $id)
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
                    variables: { id: dbToDelete._id }
                }),
            });

            const result = await res.json();
            if (result.data?.deleteDatabase) {
                if (selectedDb?._id === dbToDelete._id) {
                    setSelectedDb(null);
                }
                setShowDeleteModal(false);
                setDbToDelete(null);
                fetchDatabases();
            } else {
                alert("Failed to delete database instance.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("An error occurred while deleting the database.");
        }
    };

    const handleExecuteCommand = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const command = formData.get('command') as string;
        if (!command || !selectedDb) return;

        setTerminalLogs(prev => [...prev, { type: 'input', text: command }]);
        setIsExecuting(true);
        e.currentTarget.reset();

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            const mutation = `
                mutation ExecuteCommand($id: String!, $command: String!) {
                    executeDatabaseCommand(id: $id, command: $command)
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
                    variables: { id: selectedDb._id, command }
                }),
            });

            const result = await res.json();
            if (result.data?.executeDatabaseCommand) {
                setTerminalLogs(prev => [...prev, { type: 'output', text: result.data.executeDatabaseCommand }]);
            } else if (result.errors) {
                setTerminalLogs(prev => [...prev, { type: 'error', text: result.errors[0].message }]);
            }
        } catch {
            setTerminalLogs(prev => [...prev, { type: 'error', text: 'Network Error: Failed to reach terminal proxy.' }]);
        } finally {
            setIsExecuting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Syncing Database Clusters...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#020202] text-white flex overflow-hidden">
            <Sidebar user={user} subscriptions={subscriptions} />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <Database className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-black tracking-tight">Cloud Databases</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            disabled={databases.length >= 1}
                            className={cn(
                                "rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20 transition-all",
                                databases.length >= 1 ? "bg-zinc-800 text-zinc-500 border-white/5 cursor-not-allowed shadow-none" : ""
                            )}
                        >
                            {databases.length >= 1 ? (
                                <>Limit Reached (1/1)</>
                            ) : (
                                <><Plus className="w-4 h-4" /> New Instance</>
                            )}
                        </Button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Database List Sidebar */}
                    <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                <Search className="w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search clusters..."
                                    className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-400"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {databases.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                        <Database className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-xs text-zinc-500">No active databases found. Create one to get started.</p>
                                </div>
                            ) : (
                                databases.map((db) => (
                                    <button
                                        key={db._id}
                                        onClick={() => {
                                            setSelectedDb(db);
                                            setTerminalLogs([...INITIAL_TERMINAL_LOGS]);
                                        }}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all group",
                                            selectedDb?._id === db._id
                                                ? "bg-primary/10 border-primary/20"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                db.type === 'postgres' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                                                    db.type === 'mongodb' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                                        'text-red-400 border-red-400/20 bg-red-400/10'
                                            )}>
                                                {db.type}
                                            </span>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                db.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    db.status === 'provisioning' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                                            )} />
                                        </div>
                                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{db.name}</div>
                                        <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">
                                            Created {new Date(db.created_on).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Database Details */}
                    <div className="flex-1 flex flex-col bg-[#050505]">
                        {selectedDb ? (
                            <>
                                <div className="p-8 border-b border-white/5 shrink-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h1 className="text-3xl font-black tracking-tight">{selectedDb.name}</h1>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                    selectedDb.status === 'running' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                )}>
                                                    ● {selectedDb.status}
                                                </span>
                                            </div>
                                            <p className="text-zinc-500 text-sm font-medium">Instance ID: {selectedDb._id}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRestartDb(selectedDb._id)}
                                                className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-10"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" /> Restart
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeleteDb(selectedDb)}
                                                className="rounded-xl border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 h-10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex gap-8 mt-8 border-b border-white/5">
                                        {[
                                            { id: 'overview', label: 'Overview', icon: Activity },
                                            { id: 'credentials', label: 'Credentials', icon: Key },
                                            { id: 'terminal', label: 'Terminal', icon: Terminal },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as 'overview' | 'credentials' | 'terminal')}
                                                className={cn(
                                                    "flex items-center gap-2 pb-4 text-sm font-bold transition-all relative",
                                                    activeTab === tab.id ? "text-primary" : "text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                <tab.icon className="w-4 h-4" />
                                                {tab.label}
                                                {activeTab === tab.id && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_rgba(255,59,48,0.5)]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8">
                                    {activeTab === 'overview' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                                                    <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">Core Technology</div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                            {selectedDb.type === 'mongodb' ? <Database className="w-5 h-5 text-emerald-400" /> :
                                                                selectedDb.type === 'postgres' ? <Database className="w-5 h-5 text-blue-400" /> :
                                                                    selectedDb.type === 'redis' ? <Database className="w-5 h-5 text-red-500" /> :
                                                                        selectedDb.type === 'mysql' ? <Database className="w-5 h-5 text-[#00758F]" /> :
                                                                            <Database className="w-5 h-5 text-primary" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold capitalize">{selectedDb.type === 'postgres' ? 'PostgreSQL Relational' :
                                                                selectedDb.type === 'mongodb' ? 'MongoDB NoSQL' :
                                                                    selectedDb.type === 'redis' ? 'Redis In-Memory' :
                                                                        selectedDb.type === 'mysql' ? 'MySQL Relational' : selectedDb.type} Enterprise</div>
                                                            <div className="text-xs text-zinc-500">
                                                                {selectedDb.type === 'postgres' ? 'v16.2 Stable' :
                                                                    selectedDb.type === 'mongodb' ? 'v6.0 Latest' :
                                                                        selectedDb.type === 'redis' ? 'v7.2 stable' :
                                                                            selectedDb.type === 'mysql' ? 'v8.0 Stable' : 'Latest'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                                                    <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">Availability Zone</div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                            <Shield className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">US-East (Virginia)</div>
                                                            <div className="text-xs text-zinc-500">Multi-AZ Enabled</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                                                    <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">Instance Health</div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                            <Activity className="w-5 h-5 text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-emerald-400">Optimal</div>
                                                            <div className="text-xs text-zinc-500">99.99% Uptime</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8">
                                                <h3 className="text-lg font-bold mb-6">Connection Endpoints</h3>
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Public Connection URI</div>
                                                            <code className="text-sm text-primary truncate block">{selectedDb.public_uri || selectedDb.connection_string || 'provisioning...'}</code>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="shrink-0"
                                                            onClick={() => handleCopy(selectedDb.public_uri || selectedDb.connection_string || '', 'uri')}
                                                        >
                                                            {copiedField === 'uri' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                        </Button>
                                                    </div>

                                                    <div className="p-4 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Internal Connection URI</div>
                                                            <code className="text-sm text-emerald-400 truncate block">{selectedDb.internal_uri || 'provisioning...'}</code>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="shrink-0"
                                                            onClick={() => handleCopy(selectedDb.internal_uri || '', 'internal_uri')}
                                                        >
                                                            {copiedField === 'internal_uri' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Port</div>
                                                                <code className="text-sm">{selectedDb.port || '...'}</code>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Database Name</div>
                                                                <code className="text-sm">{selectedDb.db_name || '...'}</code>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deployment Timeline */}
                                            {selectedDb.events && selectedDb.events.length > 0 && (
                                                <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 mt-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h3 className="text-lg font-bold">Deployment Timeline</h3>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Real-time Logs</span>
                                                    </div>
                                                    <div className="space-y-6 relative ml-2">
                                                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/5" />
                                                        {selectedDb.events.map((event, idx) => (
                                                            <div key={idx} className="flex gap-6 relative">
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded-full border-2 border-[#050505] relative z-10 shrink-0 mt-1",
                                                                    event.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                                        event.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-primary'
                                                                )} />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className={cn(
                                                                            "text-sm font-bold",
                                                                            event.type === 'error' ? 'text-red-400' :
                                                                                event.type === 'success' ? 'text-emerald-400' : 'text-zinc-200'
                                                                        )}>
                                                                            {event.message}
                                                                        </p>
                                                                        <span className="text-[10px] font-medium text-zinc-400">
                                                                            {new Date(event.timestamp).toLocaleTimeString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'credentials' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-400">
                                                <Shield className="w-5 h-5 shrink-0" />
                                                <p className="text-xs leading-relaxed">Security Warning: Never share your database credentials. Use environment variables in your applications to store these safely.</p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {[
                                                    { label: 'Username', value: selectedDb.username, field: 'username' },
                                                    { label: 'Password', value: selectedDb.password, field: 'password', secret: true },
                                                    {
                                                        label: selectedDb.type === 'mongodb' ? 'Public Connection URI (Compass/Shell)' :
                                                            selectedDb.type === 'postgres' ? 'Standard URI (DataGrip/DBeaver/psql)' :
                                                                selectedDb.type === 'redis' ? 'Public Redis URL (RedisInsight/cli)' :
                                                                    selectedDb.type === 'mysql' ? 'Standard URI (Workbench/HeidiSQL/mysql)' : 'Public Connection URI',
                                                        value: selectedDb.public_uri,
                                                        field: 'public'
                                                    },
                                                    { label: 'Internal Connection URI (In-Service)', value: selectedDb.internal_uri, field: 'internal' },
                                                    ...(selectedDb.type === 'postgres' ? [{
                                                        label: 'JDBC Connection String',
                                                        value: `jdbc:postgresql://${selectedDb.host || 'backend.nexode.app'}:${selectedDb.port || 5432}/${selectedDb.db_name}?user=${selectedDb.username}&password=${selectedDb.password}`,
                                                        field: 'jdbc'
                                                    }] : []),
                                                    ...(selectedDb.type === 'redis' ? [{
                                                        label: 'JDBC Connection String (DataGrip)',
                                                        value: `jdbc:redis://${selectedDb.host || 'backend.nexode.app'}:${selectedDb.port || 6379}/0`,
                                                        field: 'jdbc_redis'
                                                    }] : []),
                                                    ...(selectedDb.type === 'mysql' ? [{
                                                        label: 'JDBC Connection String (DataGrip)',
                                                        value: `jdbc:mysql://${selectedDb.host || 'backend.nexode.app'}:${selectedDb.port || 3306}/${selectedDb.db_name}`,
                                                        field: 'jdbc_mysql'
                                                    }] : [])
                                                ].map((item) => (
                                                    <div key={item.field} className="group p-6 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">{item.label}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                                onClick={() => handleCopy(item.value || '', item.field)}
                                                            >
                                                                {copiedField === item.field ? <><Check className="w-3 h-3 mr-2" /> Copied</> : <><Copy className="w-3 h-3 mr-2" /> Copy Item</>}
                                                            </Button>
                                                        </div>
                                                        <div className="bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-sm break-all">
                                                            {item.value || 'Generating...'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'terminal' && (
                                        <div className="h-full flex flex-col bg-[#080808] rounded-[32px] border border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                                            {/* Terminal Header */}
                                            <div className="px-6 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">
                                                        {selectedDb.type === 'mongodb' ? 'Mongosh' :
                                                            selectedDb.type === 'postgres' ? 'PSQL' :
                                                                selectedDb.type === 'redis' ? 'Redis-CLI' : 'MySQL'} Proxy — {selectedDb.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Terminal Output */}
                                            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed space-y-2 selection:bg-primary/30 scrollbar-hide">
                                                {terminalLogs.map((log, i) => (
                                                    <div key={i} className={cn(
                                                        "break-all whitespace-pre-wrap",
                                                        log.type === 'input' ? "text-white flex gap-2" :
                                                            log.type === 'error' ? "text-red-400" : "text-emerald-400/80"
                                                    )}>
                                                        {log.type === 'input' && <span className="text-primary shrink-0">➜</span>}
                                                        {log.text}
                                                    </div>
                                                ))}
                                                {isExecuting && (
                                                    <div className="text-zinc-500 animate-pulse flex items-center gap-2">
                                                        <RefreshCw className="w-3 h-3 animate-spin" /> Processing request...
                                                    </div>
                                                )}
                                            </div>

                                            {/* Terminal Input */}
                                            <form onSubmit={handleExecuteCommand} className="p-4 bg-black border-t border-white/5 flex items-center gap-3">
                                                <span className="text-primary font-bold ml-2">➜</span>
                                                <input
                                                    name="command"
                                                    autoComplete="off"
                                                    placeholder={
                                                        selectedDb.type === 'mongodb' ? "Enter command (e.g. db.stats())" :
                                                            selectedDb.type === 'postgres' || selectedDb.type === 'mysql' ? "Enter SQL query (e.g. SELECT version())" :
                                                                "Enter Redis command (e.g. INFO)"
                                                    }
                                                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-zinc-700"
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={isExecuting}
                                                    size="sm"
                                                    className="h-8 rounded-lg px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Run Cmd
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <Database className="w-16 h-16 text-white mb-6" />
                                <h1 className="text-2xl font-black mb-2">Select a Database</h1>
                                <p className="text-zinc-500 max-w-xs mx-auto">Choose a cluster from the sidebar to view metrics, credentials and management tools.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main >

            {/* Create Database Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl relative">
                            <h2 className="text-2xl font-black mb-6">Provision New Database</h2>
                            <form onSubmit={handleCreateDb} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 px-1">Instance Name</label>
                                    <input
                                        name="name"
                                        required
                                        type="text"
                                        placeholder="e.g. Production Cluster"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-primary transition-colors outline-none"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 px-1">Engine Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            {
                                                id: 'postgres',
                                                label: 'PostgreSQL',
                                                color: '#336791',
                                                svg: (
                                                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                                                        <path fill="#336791" d="M19.07 13.13c-.15-.55-.38-1.09-.69-1.58.11-.11.23-.22.34-.33.15-.15.28-.31.39-.47.16-.27.27-.55.33-.85.1-.49.1-1 .02-1.49-.07-.49-.24-.96-.48-1.39-.24-.44-.57-.82-.97-1.12-.39-.3-.84-.52-1.32-.64-.48-.12-.98-.15-1.48-.09-.5.06-.98.21-1.43.43-.45.22-.85.52-1.18.89-.04.04-.08.09-.11.13-.19.22-.36.46-.5.71-.14.25-.26.51-.34.78-.08.27-.13.55-.15.82-.02.27-.01.55.03.82.04.27.12.53.22.78.1.25.23.49.39.71.16.22.34.42.55.6.14.12.29.23.45.33.12.08.25.15.38.2.14.07.28.11.43.14-.3.44-.56.91-.77 1.41-.33.78-.5 1.62-.51 2.47a5.13 5.13 0 0 0 .15 1.2c.11.39.27.76.49 1.11.22.34.5.64.83.89.33.25.71.44 1.12.56.41.12.83.17 1.25.14.36-.02.71-.08 1.05-.18a4.93 4.93 0 0 0 1.34-.69c.17-.12.33-.25.48-.39s.29-.3.42-.46c.13-.16.24-.32.34-.5s.17-.35.24-.54c.14-.38.21-.77.21-1.16a5.15 5.15 0 0 0-.11-1.07Z" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                id: 'mongodb',
                                                label: 'MongoDB',
                                                color: '#47A248',
                                                svg: (
                                                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                                                        <path fill="#47A248" d="M17.18 10.15c-.46-3.14-1.89-6.3-3.08-8.2-.3-.5-.5-.9-.6-.94-.04 0-.25.46-.53.97-1.16 2.1-2.4 5.23-2.6 8.2-.18 2.6.28 4.67 1.43 6.32 1.43 2.03 2.94 2.8 3.51 2.8.5 0 .58-.46.74-.82.64-1.39.92-2.94 1-4.9.04-1.25-.13-2.58-.87-3.43Z" />
                                                        <path fill="#3F3E3E" d="M12.91 17.51c-1.18 0-2.31-.48-3.14-1.32-.84-.84-1.32-1.97-1.32-3.14 0-1.18.48-2.31 1.32-3.14.84-.84 1.97-1.32 3.14-1.32v8.92Z" opacity=".1" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                id: 'redis',
                                                label: 'Redis',
                                                color: '#DC382D',
                                                svg: (
                                                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                                                        <path fill="#DC382D" d="M22.5 12c0 5.8-4.7 10.5-10.5 10.5S1.5 17.8 1.5 12 6.2 1.5 12 1.5 22.5 6.2 22.5 12Z" opacity=".1" />
                                                        <path fill="#DC382D" d="M19 10h-2V8h2v2Zm-3 0h-2V8h2v2Zm-3 0h-2V8h2v2Zm-3 0H8V8h2v2Zm-3 0H5V8h2v2Zm14 3h-2v-2h2v2Zm-3 0h-2v-2h2v2Zm-3 0h-2v-2h2v2Zm-3 0H8v-2h2v2Zm-3 0H5v-2h2v2Zm14 3h-2v-2h2v2Zm-3 0h-2v-2h2v2Zm-3 0h-2v-2h2v2Zm-3 0H8v-2h2v2Zm-3 0H5v-2h2v2Z" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                id: 'mysql',
                                                label: 'MySQL',
                                                color: '#4479A1',
                                                svg: (
                                                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                                                        <path fill="#4479A1" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 14.5v-1.1c-.5-.1-.9-.2-1.2-.4-.3-.2-.5-.4-.6-.7-.1-.2-.2-.5-.2-.8h1.2c0 .2.1.4.2.5s.3.2.5.3.4.1.7.1c.3 0 .5-.1.7-.2.2-.1.3-.3.3-.5 0-.2-.1-.3-.2-.4-.1-.1-.3-.2-.6-.3l-.8-.2c-.4-.1-.7-.2-.9-.4-.2-.2-.4-.4-.5-.7-.1-.3-.1-.6-.1-1s.1-.7.3-1c.2-.3.5-.5.8-.7.3-.1.7-.2 1.1-.2v-1h.9v1.1c.4.1.8.2 1.1.4.3.2.5.4.6.7.1.2.2.5.2.8h-1.2c0-.2-.1-.4-.2-.5-.1-.1-.3-.2-.5-.3-.2 0-.4-.1-.6-.1-.3 0-.5.1-.7.2s-.3.3-.3.5c0 .2.1.3.2.4.1.1.3.2.6.3l.8.2c.4.1.7.2.9.4.2.2.4.4.5.7.1.3.1.6.1 1s-.1.7-.3 1-.5.5-.8.7-.7.2-1.1.2V16.5H11Z" />
                                                    </svg>
                                                )
                                            },
                                        ].map((type) => (
                                            <label key={type.id} className="relative cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value={type.id}
                                                    defaultChecked={type.id === 'postgres'}
                                                    className="peer hidden"
                                                />
                                                <div className="h-28 p-4 rounded-[24px] border border-white/5 bg-white/[0.02] peer-checked:bg-primary/5 peer-checked:border-primary/40 peer-checked:ring-1 peer-checked:ring-primary/20 transition-all flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] hover:border-white/10">
                                                    <div className="relative">
                                                        <div
                                                            className="absolute inset-0 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"
                                                            style={{ backgroundColor: type.color }}
                                                        />
                                                        <div className="relative transform group-hover:scale-110 transition-transform duration-300">
                                                            {type.svg}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 peer-checked:text-white transition-colors">{type.label}</span>

                                                    {/* Selection Indicator */}
                                                    <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity">
                                                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex-1 rounded-2xl h-12 font-bold text-zinc-500 hover:text-white"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 rounded-2xl h-12 font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    >
                                        Provision Now
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Delete Confirmation Modal */}
            <DeleteDatabaseModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDbToDelete(null);
                }}
                onConfirm={confirmDelete}
                dbName={dbToDelete?.name || ""}
            />
        </div >
    );
}
