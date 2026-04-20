"use client";

import React, { useEffect, useState, useCallback, useRef, useId } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import Image from "next/image";
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
    Shield,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Subscription } from "@/app/dashboard/layout";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { DeleteDatabaseModal } from "@/components/modals/DeleteDatabaseModal";
import { SubscriptionLimitModal } from "@/components/modals/SubscriptionLimitModal";
import { useModal } from "@/components/ui/modal";
import { useActionLock } from "@/lib/use-action-lock";

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



const INITIAL_TERMINAL_LOGS: { type: 'input' | 'output' | 'error', text: string }[] = [
    { type: 'output', text: 'Nexode Secure Terminal v1.1.0' },
    { type: 'output', text: 'Establishing secure proxy connection...' },
    { type: 'output', text: 'Connected to isolated cluster. Type "help" to see available commands.' }
];

export default function DatabasesPage() {
    const id = useId();
    const [loading, setLoading] = useState(true);
    const [databases, setDatabases] = useState<DatabaseInstance[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedDb, setSelectedDb] = useState<DatabaseInstance | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [dbToDelete, setDbToDelete] = useState<DatabaseInstance | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isSuperuser, setIsSuperuser] = useState(false);

    const [terminalLogs, setTerminalLogs] = useState<{ type: 'input' | 'output' | 'error', text: string }[]>(INITIAL_TERMINAL_LOGS);
    const [isExecuting, setIsExecuting] = useState(false);
    const { showAlert } = useModal();
    const createLock = useActionLock(5000);
    const restartLock = useActionLock(5000);
    const deleteLock = useActionLock(5000);

    const selectedDbIdRef = useRef<string | null>(null);

    useEffect(() => {
        selectedDbIdRef.current = selectedDb?._id || null;
    }, [selectedDb?._id]);

    const fetchDatabases = useCallback(async () => {
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            if (!token) return;

            const query = `
                query GetDatabases {
                    me { role { slug } }
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
                setIsSuperuser(result.data.me?.role?.slug === 'superuser');
                setSubscriptions(result.data.mySubscriptions || []);
                const dbs = result.data.myDatabases || [];
                setDatabases(dbs);

                const currentId = selectedDbIdRef.current;
                if (currentId) {
                    const updated = dbs.find((d: DatabaseInstance) => d._id === currentId);
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
    }, []);

    useEffect(() => {
        fetchDatabases();
    }, [fetchDatabases]);

    const dbSubscriptions = subscriptions.filter(s => s.service === 'database');
    const usedSlots = databases.length;
    const totalSlots = dbSubscriptions.length;
    const canCreate = isSuperuser || usedSlots < totalSlots;

    const handleCreateClick = () => {
        if (canCreate) {
            setShowCreateModal(true);
        } else {
            setShowLimitModal(true);
        }
    };

    useEffect(() => {
        const transitionalStatuses = ['provisioning', 'deploying', 'restarting', 'deleting', 'pending'];
        const hasTransitional = databases.some(db => transitionalStatuses.includes(db.status));
        if (!hasTransitional) return;

        const interval = setInterval(() => {
            fetchDatabases();
        }, 3000);

        return () => clearInterval(interval);
    }, [databases, fetchDatabases]);

    useEffect(() => {
        setTerminalLogs([...INITIAL_TERMINAL_LOGS]);
    }, [selectedDb?._id, activeTab]);

    const toggleReveal = (field: string) => {
        setRevealedFields(prev => {
            const next = new Set(prev);
            if (next.has(field)) next.delete(field);
            else next.add(field);
            return next;
        });
    };

    const maskValue = (value: string | undefined, field: string, isSecret: boolean) => {
        if (!value) return 'Generating...';
        if (!isSecret) return value;
        if (revealedFields.has(field)) return value;
        return '•'.repeat(Math.min(value.length, 32));
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCreateDb = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (createLock.isLocked) return;
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const type = formData.get('type') as string;

        const dbPlan = subscriptions.find(s => s.service === 'database');

        if (!dbPlan) {
            showAlert({
                title: "Subscription Required",
                message: "No active database subscription found. You must be subscribed to create a database.",
                type: "warning"
            });
            return;
        }

        const plan_slug = dbPlan.plan.slug;

        if (name.length < 3) {
            showAlert({
                title: "Invalid Details",
                message: "Instance name must be at least 3 characters long.",
                type: "warning"
            });
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

                showAlert({
                    title: "Provisioning Failed",
                    message: `Creation Failed: ${msg} (Code: ${code})`,
                    type: "error"
                });
            } else {
                showAlert({
                    title: "Connection Error",
                    message: "Communication error with the server. Please check your connection.",
                    type: "error"
                });
            }
        } catch (err) {
            const error = err as Error;
            console.error("[Databases] Network or execution error:", error);
            showAlert({
                title: "Execution Error",
                message: `Execution Error: ${error.message || 'Unknown error'}`,
                type: "error"
            });
        }
    };

    const handleRestartDb = async (id: string) => {
        if (restartLock.isLocked) return;
        await restartLock.execute(async () => {
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
                showAlert({
                    title: "Restart Failed",
                    message: "Failed to restart database instance.",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Restart error:", error);
            showAlert({
                title: "Restart Error",
                message: "An error occurred while restarting the database.",
                type: "error"
            });
        }
        });
    };

    const handleDeleteDb = async (db: DatabaseInstance) => {
        setDbToDelete(db);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!dbToDelete) return;
        if (deleteLock.isLocked) return;
        await deleteLock.execute(async () => {

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
                showAlert({
                    title: "Deletion Failed",
                    message: "Failed to delete database instance.",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Delete error:", error);
            showAlert({
                title: "Deletion Error",
                message: "An error occurred while deleting the database.",
                type: "error"
            });
        }
        });
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm animate-pulse">Syncing Database Clusters...</p>
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
                                <BreadcrumbPage>Databases</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex-1" />
                    <div className="mr-2"><NotificationBell /></div>
                    <Button onClick={handleCreateClick} className="gap-2">
                        <Plus className="size-4" /> New Instance
                    </Button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-80 border-r border-border bg-black/20 flex flex-col">
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <Search className="size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search clusters..."
                                    className="bg-muted border-border text-xs h-8"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                            {databases.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <Database className="size-6 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-xs text-muted-foreground">No active databases found. Create one to get started.</p>
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
                                            "w-full text-left p-4  border transition-all group",
                                            selectedDb?._id === db._id
                                                ? "bg-primary/10 border-primary/20"
                                                : "bg-card border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className={cn(
                                                "text-xs font-medium",
                                                db.type === 'postgres' ? 'text-primary border-primary/20 bg-primary/10' :
                                                    db.type === 'mongodb' ? 'text-primary border-emerald-400/20 bg-emerald-400/10' :
                                                        db.type === 'mysql' ? 'text-primary border-primary/20 bg-primary/10' :
                                                            'text-destructive border-red-400/20 bg-red-400/10'
                                            )}>
                                                {db.type}
                                            </Badge>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                db.status === 'running' ? 'bg-emerald-500 ' :
                                                    db.status === 'provisioning' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                                            )} />
                                        </div>
                                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{db.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Created {new Date(db.created_on).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

<div className="flex-1 flex flex-col bg-background">
                        {selectedDb ? (
                            <>
                                <div className="p-8 border-b border-border shrink-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h1 className="text-3xl font-bold tracking-tight">{selectedDb.name}</h1>
                                                <Badge variant="outline" className={cn(
                                                    "text-xs font-medium",
                                                    selectedDb.status === 'running' ? "bg-primary/10 text-primary border-emerald-500/20" :
                                                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                )}>
                                                    ● {selectedDb.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-sm font-medium">Instance ID: {selectedDb._id}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRestartDb(selectedDb._id)}
                                                className="h-10 gap-2"
                                            >
                                                <RefreshCw className="size-4" /> Restart
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDeleteDb(selectedDb)}
                                                className="h-10 w-10"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                                    <TabsList variant="line" className="mt-8 gap-8 px-8">
                                        <TabsTrigger value="overview" className="flex items-center gap-2">
                                            <Activity className="size-4" /> Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="credentials" className="flex items-center gap-2">
                                            <Key className="size-4" /> Credentials
                                        </TabsTrigger>
                                        <TabsTrigger value="terminal" className="flex items-center gap-2">
                                            <Terminal className="size-4" /> Terminal
                                        </TabsTrigger>
</TabsList>

                                    <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto p-8">
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-6">
                                                        <div className="text-muted-foreground text-xs mb-4">Core Technology</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10  flex items-center justify-center border",
                                                                selectedDb.type === 'mongodb' ? 'bg-primary/10 border-emerald-500/20' :
                                                                    selectedDb.type === 'postgres' ? 'bg-primary/10 border-primary/20' :
                                                                        selectedDb.type === 'redis' ? 'bg-destructive/10 border-destructive/20' :
                                                                            selectedDb.type === 'mysql' ? 'bg-blue-600/10 border-blue-600/20' :
                                                                                'bg-primary/10 border-primary/20'
                                                            )}>
                                                                <Database className={cn(
                                                                    "size-5",
                                                                    selectedDb.type === 'mongodb' ? 'text-primary' :
                                                                        selectedDb.type === 'postgres' ? 'text-primary' :
                                                                            selectedDb.type === 'redis' ? 'text-destructive' :
                                                                                selectedDb.type === 'mysql' ? 'text-primary' : 'text-primary'
                                                                )} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold leading-tight">{selectedDb.type === 'postgres' ? 'PostgreSQL' :
                                                                    selectedDb.type === 'mongodb' ? 'MongoDB' :
                                                                        selectedDb.type === 'redis' ? 'Redis' :
                                                                            selectedDb.type === 'mysql' ? 'MySQL' : selectedDb.type} Enterprise</div>
                                                                <div className="text-xs text-muted-foreground font-medium">
                                                                    {selectedDb.type === 'postgres' ? 'v16.2 Stable' :
                                                                        selectedDb.type === 'mongodb' ? 'v6.0 Latest' :
                                                                            selectedDb.type === 'redis' ? 'v7.2 stable' :
                                                                                selectedDb.type === 'mysql' ? 'v8.0 Stable' : 'Latest'}
                                                                </div>
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
                                                                <div className="font-bold text-primary">Optimal</div>
                                                                <div className="text-xs text-muted-foreground">Monitored</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <Card className="bg-card border-border">
                                                <CardContent className="p-8">
                                                    <h3 className="text-lg font-bold mb-6">Connection Endpoints</h3>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="p-4 bg-background border border-border flex items-center justify-between">
                                                            <div className="flex-1 overflow-hidden">
                                                                <div className="text-xs text-muted-foreground mb-1">Public Connection URI</div>
                                                                <code className="text-sm text-primary truncate block">{selectedDb.public_uri || selectedDb.connection_string || 'provisioning...'}</code>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="shrink-0"
                                                                onClick={() => handleCopy(selectedDb.public_uri || selectedDb.connection_string || '', 'uri')}
                                                            >
                                                                {copiedField === 'uri' ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                                                            </Button>
                                                        </div>

                                                        <div className="p-4 bg-background border border-border flex items-center justify-between">
                                                            <div className="flex-1 overflow-hidden">
                                                                <div className="text-xs text-muted-foreground mb-1">Internal Connection URI</div>
                                                                <code className="text-sm text-primary truncate block">{selectedDb.internal_uri || 'provisioning...'}</code>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="shrink-0"
                                                                onClick={() => handleCopy(selectedDb.internal_uri || '', 'internal_uri')}
                                                            >
                                                                {copiedField === 'internal_uri' ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">Host</div>
                                                                    <code className="text-sm">{selectedDb.host || 'backend.nexode.app'}</code>
                                                                </CardContent>
                                                            </Card>
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">Port</div>
                                                                    <code className="text-sm">{selectedDb.port || '...'}</code>
                                                                </CardContent>
                                                            </Card>
                                                            <Card className="bg-background border-border">
                                                                <CardContent className="p-4">
                                                                    <div className="text-xs text-muted-foreground mb-1">Database Name</div>
                                                                    <code className="text-sm">{selectedDb.db_name || '...'}</code>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {selectedDb.events && selectedDb.events.length > 0 && (
                                                <Card className="bg-card border-border">
                                                    <CardContent className="p-8">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <h3 className="text-lg font-bold">Deployment Timeline</h3>
                                                            <span className="text-xs text-muted-foreground">Real-time Logs</span>
                                                        </div>
                                                        <div className="space-y-6 relative ml-2">
                                                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-muted" />
                                                            {selectedDb.events.map((event, idx) => (
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

                                    <TabsContent value="credentials" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-6">
                                            <Card className="border-destructive/20 bg-destructive/10">
                                                <CardContent className="p-4">
                                                    <div className="flex gap-3 text-destructive">
                                                        <Shield className="size-5 shrink-0" />
                                                        <p className="text-xs leading-relaxed">Security Warning: Never share your database credentials. Use environment variables in your applications to store these safely.</p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <div className="grid grid-cols-1 gap-4">
                                                {[
                                                    { label: 'Host / Endpoint', value: selectedDb.host || 'backend.nexode.app', field: 'host' },
                                                    { label: 'Database Name', value: selectedDb.db_name, field: 'db_name' },
                                                    { label: 'Username', value: selectedDb.username, field: 'username' },
                                                    { label: 'Password', value: selectedDb.password, field: 'password', secret: true },
                                                    {
                                                        label: selectedDb.type === 'mongodb' ? 'Public Connection URI (Compass/Shell)' :
                                                            selectedDb.type === 'postgres' ? 'Standard URI (DataGrip/DBeaver/psql)' :
                                                                selectedDb.type === 'redis' ? 'Public Redis URL (RedisInsight/cli)' :
                                                                    selectedDb.type === 'mysql' ? 'Standard URI (Workbench/HeidiSQL/mysql)' : 'Public Connection URI',
                                                        value: selectedDb.public_uri,
                                                        field: 'public', secret: true
                                                    },
                                                    { label: 'Internal Connection URI (In-Service)', value: selectedDb.internal_uri, field: 'internal', secret: true },
                                                    ...(selectedDb.type === 'postgres' ? [{
                                                        label: 'JDBC Connection String',
                                                        value: `jdbc:postgresql://${selectedDb.host || 'backend.nexode.app'}:${selectedDb.port || 5432}/${selectedDb.db_name}?user=${selectedDb.username}&password=${selectedDb.password}`,
                                                        field: 'jdbc', secret: true
                                                    }] : []),
                                                    ...(selectedDb.type === 'redis' ? [{
                                                        label: 'JDBC Connection String (DataGrip)',
                                                        value: `jdbc:redis://${selectedDb.host || 'backend.nexode.app'}:${selectedDb.port || 6379}/0`,
                                                        field: 'jdbc_redis', secret: true
                                                    }] : []),
                                                    ...(selectedDb.type === 'mysql' ? [{
                                                        label: 'JDBC Connection String (DataGrip)',
                                                        value: `jdbc:mysql://${selectedDb.host || 'backend.nexode.app'}:${selectedDb.port || 3306}/${selectedDb.db_name}`,
                                                        field: 'jdbc_mysql', secret: true
                                                    }] : [])
                                                ].map((item: { label: string, value: string | undefined, field: string, secret?: boolean }) => (
                                                    <Card key={item.field} className="bg-card border-border hover:border-primary/20 transition-all group">
                                                        <CardContent className="p-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <Label className="text-sm font-medium text-muted-foreground">{item.label}</Label>
<Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="gap-2"
                                                                    onClick={() => handleCopy(item.value || '', item.field)}
                                                                >
                                                                    {copiedField === item.field ? <><Check className="w-3 h-3 mr-2" /> Copied</> : <><Copy className="w-3 h-3 mr-2" /> Copy Item</>}
                                                                </Button>
                                                            </div>
                                                            <div className="bg-muted/50 p-4 border border-border font-mono text-sm break-all flex items-center justify-between gap-3">
                                                                <span className="flex-1 overflow-hidden">{maskValue(item.value, item.field, !!item.secret)}</span>
                                                                {item.secret && (
                                                                    <button
                                                                        onClick={() => toggleReveal(item.field)}
                                                                        className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                        title={revealedFields.has(item.field) ? 'Hide' : 'Reveal'}
                                                                    >
                                                                        {revealedFields.has(item.field) ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="terminal" className="animate-in fade-in zoom-in-95 duration-500">
                                        <Card className="bg-background border-border h-full flex flex-col overflow-hidden">
                                            <CardHeader className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground ml-2">
                                                        {selectedDb.type === 'mongodb' ? 'Mongosh' :
                                                            selectedDb.type === 'postgres' ? 'PSQL' :
                                                                selectedDb.type === 'redis' ? 'Redis-CLI' : 'MySQL'} Proxy — {selectedDb.name}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-xs font-bold text-primary">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" /> Connected
                                                </Badge>
                                            </CardHeader>

                                            <CardContent className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed space-y-2 selection:bg-primary/30 scrollbar-hide">
                                                {terminalLogs.map((log, i) => (
                                                    <div key={i} className={cn(
                                                        "break-all whitespace-pre-wrap",
                                                        log.type === 'input' ? "text-foreground flex gap-2" :
                                                            log.type === 'error' ? "text-destructive" : "text-primary/80"
                                                    )}>
                                                        {log.type === 'input' && <span className="text-primary shrink-0">➜</span>}
                                                        {log.text}
                                                    </div>
                                                ))}
                                                {isExecuting && (
                                                    <div className="text-muted-foreground animate-pulse flex items-center gap-2">
                                                        <RefreshCw className="w-3 h-3 animate-spin" /> Processing request...
                                                    </div>
                                                )}
                                            </CardContent>

                                            <CardFooter className="p-4 bg-background border-t border-border">
                                                <form onSubmit={handleExecuteCommand} className="flex items-center gap-3 w-full">
                                                    <span className="text-primary font-bold ml-2">➜</span>
                                                    <input
                                                        name="command"
                                                        autoComplete="off"
                                                        placeholder={
                                                            selectedDb.type === 'mongodb' ? "Enter command (e.g. db.stats())" :
                                                                selectedDb.type === 'postgres' || selectedDb.type === 'mysql' ? "Enter SQL query (e.g. SELECT version())" :
                                                                    "Enter Redis command (e.g. INFO)"
                                                        }
                                                        className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground"
                                                    />
                                                    <Button
                                                        type="submit"
                                                        disabled={isExecuting}
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                    >
                                                        Run Cmd
                                                    </Button>
                                                </form>
                                            </CardFooter>
                                        </Card>
</TabsContent>
                                </Tabs>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Database className="size-16 text-muted-foreground mb-6" />
                                <h1 className="text-2xl font-bold mb-2">No active databases found</h1>
                                <p className="text-muted-foreground max-w-xs mx-auto mb-6">Create one to get started.</p>
                                <Button onClick={handleCreateClick} className="gap-2">
                                    <Plus className="size-4" /> Provision Database
                                </Button>
                            </div>
                        )}
                    </div>
                </div>


            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Provision New Database</DialogTitle>
                        <DialogDescription>Create a new database instance to get started.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDb}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="db-name">Instance Name</FieldLabel>
                                <Input id="db-name" name="name" required placeholder="e.g. Production Cluster" />
                            </Field>

                            <FieldSet>
                                <FieldLegend variant="label">Engine Type</FieldLegend>
                                <RadioGroup name="type" defaultValue="postgres" className="w-full gap-2">
                                    {[
                                        {
                                            id: 'postgres',
                                            label: 'PostgreSQL',
                                            svg: (
                                                <Image src="/db/postgres.svg" alt="PostgreSQL" width={24} height={24} className="shrink-0 brightness-0 invert" />
                                            )
                                        },
                                        {
                                            id: 'mongodb',
                                            label: 'MongoDB',
                                            svg: (
                                                <Image src="/db/mongo.svg" alt="MongoDB" width={24} height={24} className="shrink-0 brightness-0 invert" />
                                            )
                                        },
                                        {
                                            id: 'redis',
                                            label: 'Redis',
                                            svg: (
                                                <Image src="/db/redis.svg" alt="Redis" width={24} height={24} className="shrink-0 brightness-0 invert" />
                                            )
                                        },
                                    ].map((type) => {
                                        const itemId = `${id}-${type.id}`;
                                        return (
                                            <label
                                                key={type.id}
                                                htmlFor={itemId}
                                                className="border-input has-[[data-checked]]:border-primary/50 relative flex w-full cursor-pointer items-center gap-3 rounded-md border p-4 outline-none transition-all hover:bg-muted"
                                            >
                                                {type.svg}
                                                <RadioGroupItem
                                                    value={type.id}
                                                    id={itemId}
                                                    aria-label={`engine-${type.id}`}
                                                    className="size-5 [&_svg]:size-3"
                                                />
                                                <span className="grow text-sm font-medium">{type.label}</span>
                                            </label>
                                        );
                                    })}
                                </RadioGroup>
                            </FieldSet>

                            <Button
                                type="submit"
                                className="w-full h-12"
                            >
                                Provision Now
                            </Button>
                        </FieldGroup>
                    </form>
                </DialogContent>
            </Dialog>
            <DeleteDatabaseModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDbToDelete(null);
                }}
                onConfirm={confirmDelete}
                dbName={dbToDelete?.name || ""}
            />
            <SubscriptionLimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                serviceName="Database"
                serviceId="database"
                usedSlots={usedSlots}
                totalSlots={totalSlots}
            />
        </>
    );
}