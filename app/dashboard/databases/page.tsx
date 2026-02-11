"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Database,
    Plus,
    Search,
    ExternalLink,
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
    created_on: string;
}

interface User {
    first_name: string;
    email: string;
    avatar?: string;
}

export default function DatabasesPage() {
    const [loading, setLoading] = useState(true);
    const [databases, setDatabases] = useState<DatabaseInstance[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedDb, setSelectedDb] = useState<DatabaseInstance | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'explorer'>('overview');

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
                        _id name type status host port username password db_name connection_string created_on
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
                setDatabases(result.data.myDatabases || []);
                if (result.data.myDatabases?.length > 0 && !selectedDb) {
                    setSelectedDb(result.data.myDatabases[0]);
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

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

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
                    variables: { input: { name, type } }
                }),
            });

            const result = await res.json();
            if (result.data?.createDatabase) {
                setShowCreateModal(false);
                fetchDatabases();
            } else if (result.errors) {
                alert(result.errors[0].message);
            }
        } catch (err) {
            console.error(err);
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
                            className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" /> New Instance
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
                                    className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {databases.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                        <Database className="w-6 h-6 text-zinc-700" />
                                    </div>
                                    <p className="text-xs text-zinc-500">No active databases found. Create one to get started.</p>
                                </div>
                            ) : (
                                databases.map((db) => (
                                    <button
                                        key={db._id}
                                        onClick={() => setSelectedDb(db)}
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
                                            <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-10">
                                                <RefreshCw className="w-4 h-4 mr-2" /> Restart
                                            </Button>
                                            <Button variant="outline" className="rounded-xl border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 h-10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex gap-8 mt-8 border-b border-white/5">
                                        {[
                                            { id: 'overview', label: 'Overview', icon: Activity },
                                            { id: 'credentials', label: 'Credentials', icon: Key },
                                            { id: 'explorer', label: 'Explorer', icon: Terminal },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as 'overview' | 'credentials' | 'explorer')}
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
                                                            <Database className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold capitalize">{selectedDb.type} Entrerprise</div>
                                                            <div className="text-xs text-zinc-500">v16.2 Latest</div>
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
                                                        <div className="flex-1">
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Public Endpoint</div>
                                                            <code className="text-sm text-primary">{selectedDb.host || 'provisioning...'}</code>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleCopy(selectedDb.host || '', 'host')}
                                                        >
                                                            {copiedField === 'host' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
                                                    { label: 'Connection String', value: selectedDb.connection_string, field: 'conn' },
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

                                    {activeTab === 'explorer' && (
                                        <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                                            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                                                <Terminal className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-2">Web Terminal / Explorer</h3>
                                            <p className="text-zinc-500 max-w-md mx-auto mb-8">Direct database access via our cloud explorer is coming soon. You can currently connect using external clients like DBeaver or TablePlus.</p>
                                            <div className="flex gap-4">
                                                <Button className="rounded-xl px-8 h-12 font-bold bg-white text-black hover:bg-zinc-200">
                                                    Download Config
                                                </Button>
                                                <Button variant="outline" className="rounded-xl px-8 h-12 font-bold border-white/10 hover:bg-white/5">
                                                    Documentation <ExternalLink className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <Database className="w-16 h-16 text-zinc-900 mb-6" />
                                <h1 className="text-2xl font-black mb-2">Select a Database</h1>
                                <p className="text-zinc-500 max-w-xs mx-auto">Choose a cluster from the sidebar to view metrics, credentials and management tools.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Database Modal */}
            {showCreateModal && (
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

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 px-1">Engine Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'postgres', label: 'PostgreSQL', icon: Database },
                                        { id: 'mongodb', label: 'MongoDB', icon: Database },
                                        { id: 'redis', label: 'Redis', icon: Database },
                                        { id: 'mysql', label: 'MySQL', icon: Database },
                                    ].map((type) => (
                                        <label key={type.id} className="cursor-pointer">
                                            <input type="radio" name="type" value={type.id} defaultChecked={type.id === 'postgres'} className="peer hidden" />
                                            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] peer-checked:bg-primary/10 peer-checked:border-primary/50 transition-all flex flex-col items-center gap-2">
                                                <type.icon className="w-6 h-6 text-zinc-500 peer-checked:text-primary" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
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
                                    className="flex-1 rounded-2xl h-12 font-bold bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20"
                                >
                                    Provision Now
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
