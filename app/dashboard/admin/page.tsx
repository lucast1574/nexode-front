"use client";

import React from "react";
import Link from "next/link";
import { useGraphQL } from "@/lib/use-graphql";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ADMIN_DATA, GET_ALL_USERS } from "@/lib/graphql-operations";
import { GENERATE_AFFILIATE_LINK_MUTATION } from "@/lib/graphql-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    CreditCard,
    DollarSign,
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Plus,
    Copy,
    Link2,
    Wallet,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    ChevronRight,
    Search,
    Wrench,
    Trash2,
    Settings,
    Eye,
    EyeOff,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useDashboard } from "@/app/dashboard/layout";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminStats {
    totalSubscribers: number;
    totalRevenue: number;
    totalUsers: number;
    activeSubscriptions: number;
    mrrCents: number;
    arrCents: number;
    trialMrrCents: number;
    payingCustomers: number;
    trialingCustomers: number;
    trialingCount: number;
    pastDueCount: number;
}

interface AdminSubscription {
    id: string;
    userEmail: string;
    userName: string;
    planName: string;
    price: number;
    billingCycle: string;
    status: string;
    createdOn: string;
    service?: string;
    authProvider: string;
    isVerified: boolean;
}

interface AdminData {
    adminStats: AdminStats;
    adminSubscriptions: AdminSubscription[];
}

interface AffiliateUser {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    is_affiliate: boolean;
    affiliate_code: string;
    referral_count: number;
    created_on?: string;
}

export default function AdminPage() {
    const { user } = useDashboard();

    const queryStr = GET_ADMIN_DATA.loc?.source.body || "";

    const { data, loading, error } = useGraphQL<AdminData>({
        query: queryStr,
    });

    if (user && user.role?.slug !== "superuser" && user.role?.slug !== "admin") {
        redirect("/dashboard");
    }

    if (loading) {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Admin</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex-1" />
                    <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
                        <Plus className="size-4" /> New Service
                    </Button>
                </header>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Admin</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex-1" />
                    <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
                        <Plus className="size-4" /> New Service
                    </Button>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                        <AlertCircle className="h-5 w-5" />
                        <p>Error loading admin data: {error}</p>
                    </div>
                </div>
            </>
        );
    }

    const { adminStats, adminSubscriptions } = data || {
        adminStats: {
            totalRevenue: 0, totalSubscribers: 0, activeSubscriptions: 0, totalUsers: 0,
            mrrCents: 0, arrCents: 0, trialMrrCents: 0, payingCustomers: 0,
            trialingCustomers: 0, trialingCount: 0, pastDueCount: 0,
        },
        adminSubscriptions: [],
    };

    const fmt = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Estimated revenue for the current calendar month: MRR prorated by days
    // remaining in the month, plus any portion already accumulated. Useful for
    // tactical planning ("how much will land this month?") rather than ARR run-rate.
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    // Treat MRR as the full-month projection. "This month estimated" = MRR pro-rated for
    // the remaining days, given that subs created mid-month start billing on creation.
    const remainingDays = Math.max(0, daysInMonth - dayOfMonth + 1);
    const thisMonthRemainingCents = Math.round((adminStats.mrrCents / daysInMonth) * remainingDays);

    const statsCards = [
        {
            title: "MRR",
            value: fmt(adminStats.mrrCents),
            description: `From ${adminStats.payingCustomers} paying customer${adminStats.payingCustomers === 1 ? '' : 's'}`,
            icon: DollarSign,
            sub: `${adminStats.activeSubscriptions} active paid sub${adminStats.activeSubscriptions === 1 ? '' : 's'}`,
            tone: "primary",
        },
        {
            title: "This Month (estimated)",
            value: fmt(thisMonthRemainingCents),
            description: `${remainingDays} day${remainingDays === 1 ? '' : 's'} left in ${now.toLocaleString('en-US', { month: 'long' })}`,
            icon: TrendingUp,
            sub: `Full month at this MRR: ${fmt(adminStats.mrrCents)}`,
            tone: "emerald",
        },
        {
            title: "Trials Active",
            value: adminStats.trialingCount,
            description: `${adminStats.trialingCustomers} unique customer${adminStats.trialingCustomers === 1 ? '' : 's'}`,
            icon: Users,
            sub: `+${fmt(adminStats.trialMrrCents)} MRR if all convert`,
            tone: "amber",
        },
        {
            title: "Total Users",
            value: adminStats.totalUsers,
            description: "All registered accounts",
            icon: ShieldCheck,
            sub: `${adminStats.pastDueCount} past-due sub${adminStats.pastDueCount === 1 ? '' : 's'}`,
            tone: adminStats.pastDueCount > 0 ? "red" : "muted",
        },
    ] as const;

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Admin</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex-1" />
                <MaintenanceMenu onRefetch={() => window.location.reload()} />
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
                    <p className="text-muted-foreground">Infrastructure and revenue control center.</p>
                </div>

                {adminStats.pastDueCount > 0 && (
                    <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center gap-3">
                        <AlertCircle className="size-5 text-red-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-300">
                                {adminStats.pastDueCount} subscription{adminStats.pastDueCount === 1 ? '' : 's'} past due or unpaid.
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Filter the table by status &quot;PAST_DUE&quot; to investigate.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {statsCards.map((stat, i) => (
                        <Card key={i} className={cn(
                            stat.tone === 'primary' && 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
                            stat.tone === 'emerald' && 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent',
                            stat.tone === 'amber' && 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent',
                            stat.tone === 'red' && 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent',
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">{stat.title}</CardTitle>
                                <stat.icon className={cn(
                                    'h-4 w-4',
                                    stat.tone === 'primary' && 'text-primary',
                                    stat.tone === 'emerald' && 'text-emerald-400',
                                    stat.tone === 'amber' && 'text-amber-400',
                                    stat.tone === 'red' && 'text-red-400',
                                    stat.tone === 'muted' && 'text-muted-foreground',
                                )} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black tracking-tight tabular-nums">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                                <div className="text-[10px] text-muted-foreground/70 mt-2">{stat.sub}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="subscriptions" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="more">More</TabsTrigger>
                    </TabsList>

                    <TabsContent value="subscriptions">
                        <SubscriptionsTab subscriptions={adminSubscriptions} />
                    </TabsContent>

                    <TabsContent value="users">
                        <UsersTab />
                    </TabsContent>

                    <TabsContent value="more">
                        <Tabs defaultValue="affiliates" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
                                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                            </TabsList>
                            <TabsContent value="affiliates">
                                <AffiliatesTab />
                            </TabsContent>
                            <TabsContent value="withdrawals">
                                <WithdrawalsTab />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

// ====================================================================
// Subscriptions tab — filterable, sortable, hides Free/Nexus by default.
// Replaces the old 'Financial Ledger' which was unusable due to noise.
// ====================================================================

interface SubscriptionsTabProps {
    subscriptions: AdminSubscription[];
}

function SubscriptionsTab({ subscriptions }: SubscriptionsTabProps) {
    const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
    const [serviceFilter, setServiceFilter] = React.useState<string>("ALL");
    const [hideFree, setHideFree] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const filtered = subscriptions.filter((s) => {
        if (hideFree && (s.price === 0 || s.service === 'nexus' || s.planName === 'Free Starter')) return false;
        if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
        if (serviceFilter !== "ALL" && (s.service || "system").toLowerCase() !== serviceFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!s.userName.toLowerCase().includes(q) && !(s.userEmail || "").toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const monthlyContribution = (s: AdminSubscription): number => {
        if (s.billingCycle === 'annual') return s.price / 12;
        return s.price;
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle>Subscriptions</CardTitle>
                        <CardDescription>{filtered.length} of {subscriptions.length} subscriptions shown</CardDescription>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v: string | null) => setStatusFilter(v ?? "ALL")}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="TRIALING">Trialing</SelectItem>
                            <SelectItem value="PAST_DUE">Past Due</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={serviceFilter} onValueChange={(v: string | null) => setServiceFilter(v ?? "ALL")}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Service" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All services</SelectItem>
                            <SelectItem value="compute">Compute</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="n8n">n8n</SelectItem>
                            <SelectItem value="nexus">Nexus (free)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setHideFree(!hideFree)} className="gap-2">
                        {hideFree ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                        {hideFree ? "Show free" : "Hide free"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subscriber</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead className="text-right">MRR</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((sub) => {
                                const isPaying = sub.price > 0 && sub.status === 'ACTIVE';
                                const isTrial = sub.status === 'TRIALING';
                                const isPastDue = ['PAST_DUE', 'UNPAID', 'INCOMPLETE'].includes(sub.status);
                                return (
                                    <TableRow key={sub.id} className={cn(isPastDue && 'bg-red-500/5')}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="font-medium">{sub.userName}</div>
                                                <Badge variant="outline" className="text-[9px]">{sub.authProvider === "GOOGLE" ? "G" : "Local"}</Badge>
                                                {!sub.isVerified && (
                                                    <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/30">unverified</Badge>
                                                )}
                                            </div>
                                            {sub.userEmail !== "N/A" && sub.userEmail && (
                                                <div className="text-xs text-muted-foreground">{sub.userEmail}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{sub.planName}</Badge>
                                            <div className="text-[10px] text-muted-foreground capitalize mt-1">{sub.billingCycle} • ${sub.price.toFixed(2)}</div>
                                        </TableCell>
                                        <TableCell className="capitalize text-muted-foreground text-sm">
                                            {sub.service || "system"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums font-medium">
                                            {isPaying ? `$${monthlyContribution(sub).toFixed(2)}` : <span className="text-muted-foreground/50">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={sub.status === "ACTIVE" ? "default" : "secondary"}
                                                className={cn(
                                                    sub.status === "ACTIVE" && "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30",
                                                    isTrial && "bg-amber-500/15 text-amber-400 hover:bg-amber-500/20 border-amber-500/30",
                                                    isPastDue && "bg-red-500/15 text-red-400 hover:bg-red-500/20 border-red-500/30",
                                                )}
                                            >
                                                {sub.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {new Date(sub.createdOn).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "2-digit" })}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4">
                                            <CreditCard className="h-10 w-10 opacity-20" />
                                            <p className="text-sm font-medium">No subscriptions match the current filters.</p>
                                            <Button variant="outline" size="sm" onClick={() => { setStatusFilter('ALL'); setServiceFilter('ALL'); setHideFree(false); setSearch(''); }}>Clear all filters</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// ====================================================================
// MaintenanceMenu — popover with destructive admin operations.
// Uses a custom click-away pattern instead of base-ui DropdownMenu, which was
// swallowing item clicks and showing only "hubo un error".
// ====================================================================
function MaintenanceMenu({ onRefetch }: { onRefetch: () => void }) {
    const [open, setOpen] = React.useState(false);
    const [busy, setBusy] = React.useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = React.useState<{
        title: string;
        message: string;
        destructive: boolean;
        mutation: string;
        label: string;
    } | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const runMutation = async () => {
        if (!confirmDialog) return;
        const { mutation, label } = confirmDialog;
        setConfirmDialog(null);
        setBusy(label);
        try {
            const token = (typeof window !== 'undefined') ? localStorage.getItem('access_token') : null;
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api-v1/graphql';
            const res = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ query: mutation }),
            });
            const result = await res.json();
            if (result.errors) {
                const msg = result.errors[0]?.message || JSON.stringify(result.errors[0]);
                toast.error(`${label} failed`, { description: msg });
                console.error('[Admin Maintenance] mutation error:', result.errors);
                return;
            }
            const data = result.data;
            const key = Object.keys(data || {})[0];
            const payload = data?.[key];
            if (key === 'adminWipeAllInstances') {
                toast.success(`Wiped: ${payload.compute} compute, ${payload.database} db, ${payload.n8n} n8n${payload.errors.length ? ` (${payload.errors.length} errors)` : ''}`);
            } else if (key === 'adminCleanOrphanSubscriptions') {
                toast.success(`Removed ${payload.removed} orphan subscription${payload.removed === 1 ? '' : 's'}`);
            } else {
                toast.success(`${label} OK`);
            }
            onRefetch();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'unknown error';
            toast.error(label, { description: msg });
            console.error('[Admin Maintenance] network error:', err);
        } finally {
            setBusy(null);
        }
    };

    return (
        <>
            <div ref={wrapperRef} className="relative mr-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(!open)}
                    disabled={!!busy}
                    className="gap-2"
                >
                    {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Wrench className="size-3.5" />}
                    Maintenance
                </Button>
                {open && (
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden">
                        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border">Cleanup</div>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                setConfirmDialog({
                                    title: 'Clean orphan subscriptions',
                                    message: 'Removes all subscriptions whose user no longer exists in the database. Useful for cleaning up after deleted accounts.',
                                    destructive: false,
                                    mutation: 'mutation { adminCleanOrphanSubscriptions { removed sample } }',
                                    label: 'Clean orphans',
                                });
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-muted/50 flex items-center gap-2 text-sm"
                        >
                            <Trash2 className="size-3.5 text-muted-foreground" />
                            <span>Clean orphan subscriptions</span>
                        </button>
                        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-destructive border-b border-t border-border">Destructive</div>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                setConfirmDialog({
                                    title: 'Wipe all instances',
                                    message: '⚠️ This will DELETE every compute, database, and n8n instance across every user — both from Mongo and from Dokploy containers. This cannot be undone.',
                                    destructive: true,
                                    mutation: 'mutation { adminWipeAllInstances { compute database n8n errors } }',
                                    label: 'Wipe instances',
                                });
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-destructive/10 flex items-center gap-2 text-sm text-destructive"
                        >
                            <Trash2 className="size-3.5" />
                            <span>Wipe all instances</span>
                        </button>
                    </div>
                )}
            </div>

            {confirmDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 rounded-lg border border-border bg-card shadow-2xl">
                        <div className="p-6">
                            <h3 className={cn(
                                'text-lg font-bold mb-2 flex items-center gap-2',
                                confirmDialog.destructive && 'text-destructive'
                            )}>
                                {confirmDialog.destructive && <AlertCircle className="size-5" />}
                                {confirmDialog.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
                        </div>
                        <div className="px-6 pb-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
                            <Button
                                variant={confirmDialog.destructive ? 'destructive' : 'default'}
                                onClick={runMutation}
                            >
                                {confirmDialog.destructive ? 'Yes, wipe everything' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const AffiliatesTab = () => {
    const { data, loading, error, refetch } = useQuery<{ findAllUsers: AffiliateUser[] }>(GET_ALL_USERS, {
        fetchPolicy: "network-only",
    });
    const [generateLink, { loading: generating }] = useMutation(GENERATE_AFFILIATE_LINK_MUTATION);
    const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
    const [detailLoading, setDetailLoading] = React.useState(false);
    const [detailStats, setDetailStats] = React.useState<any>(null);
    const [detailReferrals, setDetailReferrals] = React.useState<any[]>([]);

    const handleGenerate = async (userId: string) => {
        try {
            await generateLink({ variables: { userId } });
            toast.success("Affiliate link generated successfully!");
            refetch();
        } catch (err: any) {
            toast.error(err.message || "Failed to generate link");
        }
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(`https://cloud.nexode.app/auth/register?ref=${code}`);
        toast.success("Affiliate link copied!");
    };

    const loadDetail = async (userId: string) => {
        setSelectedUserId(userId);
        setDetailLoading(true);
        try {
            const token = typeof window !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token') : null;
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const [statsRes, refsRes] = await Promise.all([
                fetch(GQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    credentials: "include",
                    body: JSON.stringify({ query: `query { adminAffiliateStats(userId: "${userId}") { is_affiliate affiliate_code total_referrals total_converted total_commission available_balance } }` }),
                }).then(r => r.json()),
                fetch(GQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    credentials: "include",
                    body: JSON.stringify({ query: `query { adminAffiliateReferrals(userId: "${userId}") { id referred_email referred_name status first_payment commission created_at converted_at } }` }),
                }).then(r => r.json()),
            ]);
            if (statsRes.data?.adminAffiliateStats) setDetailStats(statsRes.data.adminAffiliateStats);
            if (refsRes.data?.adminAffiliateReferrals) setDetailReferrals(refsRes.data.adminAffiliateReferrals);
        } catch { } finally { setDetailLoading(false); }
    };

    if (loading) return <Card><CardContent className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></CardContent></Card>;
    if (error) return <Card><CardContent className="p-8 text-destructive">Error loading users</CardContent></Card>;

    const users = data?.findAllUsers || [];
    const totalAffiliates = users.filter(u => u.is_affiliate).length;

    // Detail panel for selected affiliate
    if (selectedUserId && detailStats) {
        const user = users.find(u => u.id === selectedUserId);
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="sm" className="gap-2 mb-2" onClick={() => { setSelectedUserId(null); setDetailStats(null); setDetailReferrals([]); }}>
                    <ArrowLeft className="size-4" /> Back to affiliates list
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Users className="size-5" />
                            {user?.first_name} {user?.last_name || ''}
                        </CardTitle>
                        <CardDescription>{user?.email} · {detailStats.affiliate_code || 'Not affiliate'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold">{detailStats.total_referrals}</p>
                                <p className="text-xs text-muted-foreground">Total Referrals</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-500">{detailStats.total_converted}</p>
                                <p className="text-xs text-muted-foreground">Converted (Paid)</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-primary">${detailStats.total_commission?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs text-muted-foreground">Total Commission</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold">${detailStats.available_balance?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs text-muted-foreground">Available Balance</p>
                            </div>
                        </div>

                        {detailLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Referred User</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>First Payment</TableHead>
                                        <TableHead>Commission</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detailReferrals.map((r: any) => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div className="font-medium">{r.referred_name}</div>
                                                <div className="text-xs text-muted-foreground">{r.referred_email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {r.status === 'converted' ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-500">Converted</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Registered</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono">{r.first_payment > 0 ? `$${r.first_payment.toFixed(2)}` : '—'}</TableCell>
                                            <TableCell className="font-mono font-bold text-emerald-500">{r.commission > 0 ? `+$${r.commission.toFixed(2)}` : '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {detailReferrals.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No referrals yet</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Affiliates & Users</CardTitle>
                    <CardDescription>Manage user affiliate links and track referrals. {totalAffiliates} active affiliates.</CardDescription>
                </div>
                <Badge variant="secondary">{users.length} users</Badge>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Affiliate Status</TableHead>
                            <TableHead className="text-center">Referrals</TableHead>
                            <TableHead className="text-center">Converted</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u: AffiliateUser) => (
                            <TableRow key={u.id} className={u.is_affiliate ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => u.is_affiliate && loadDetail(u.id)}>
                                <TableCell>
                                    <div className="font-medium">{u.first_name} {u.last_name || ''}</div>
                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                </TableCell>
                                <TableCell>
                                    {u.is_affiliate ? (
                                        <div className="flex flex-col gap-1">
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 w-fit">Active Affiliate</Badge>
                                            <code className="text-xs text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-medium border border-emerald-500/20 w-fit">{u.affiliate_code}</code>
                                        </div>
                                    ) : (
                                        <Badge variant="secondary">Standard User</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-bold text-xl">{u.referral_count || 0}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-bold text-xl text-emerald-500">—</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {u.is_affiliate ? (
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleCopy(u.affiliate_code); }} className="gap-2">
                                                <Copy className="size-3" /> Copy Link
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); loadDetail(u.id); }} className="gap-1">
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); handleGenerate(u.id); }} disabled={generating} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                                            <Link2 className="size-3" /> Make Affiliate
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const UsersTab = () => {
    const { data, loading, error } = useQuery<{ findAllUsers: AffiliateUser[] }>(GET_ALL_USERS, {
        fetchPolicy: "network-only",
    });

    if (loading) return <Card><CardContent className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></CardContent></Card>;
    if (error) return <Card><CardContent className="p-8 text-destructive">Error loading users</CardContent></Card>;

    const users = data?.findAllUsers || [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>All registered accounts on the platform.</CardDescription>
                </div>
                <Badge variant="secondary">{users.length} users</Badge>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Referrals</TableHead>
                                <TableHead className="text-right">Registered On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="font-medium">{u.first_name} {u.last_name || ''}</div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {u.email}
                                    </TableCell>
                                    <TableCell>
                                        {u.is_affiliate ? (
                                            <div className="flex flex-col gap-1">
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 w-fit">Active Affiliate</Badge>
                                                <code className="text-xs text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-medium border border-emerald-500/20 w-fit">{u.affiliate_code}</code>
                                            </div>
                                        ) : (
                                            <Badge variant="secondary">Standard User</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-bold">{u.referral_count || 0}</span>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {u.created_on ? new Date(u.created_on).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4">
                                            <Users className="h-10 w-10 opacity-20" />
                                            <p className="text-sm font-medium">No users found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

const WithdrawalsTab = () => {
    const [withdrawals, setWithdrawals] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [processingId, setProcessingId] = React.useState<string | null>(null);

    const fetchWithdrawals = React.useCallback(async () => {
        try {
            const token = typeof window !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token') : null;
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                credentials: "include",
                body: JSON.stringify({ query: `query { adminWithdrawals { id user_email user_name amount payment_method payment_details status admin_notes created_at paid_at } }` }),
            });
            const data = await res.json();
            if (data.data?.adminWithdrawals) setWithdrawals(data.data.adminWithdrawals);
        } catch { } finally { setLoading(false); }
    }, []);

    React.useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

    const handleMarkPaid = async (id: string) => {
        setProcessingId(id);
        try {
            const token = typeof window !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token') : null;
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                credentials: "include",
                body: JSON.stringify({ query: `mutation { markWithdrawalPaid(id: "${id}") { id status } }` }),
            });
            const data = await res.json();
            if (data.errors) { toast.error(data.errors[0]?.message || "Failed"); return; }
            toast.success("Withdrawal marked as paid! Email sent to affiliate.");
            await fetchWithdrawals();
        } finally { setProcessingId(null); }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Rejection reason:");
        if (!reason) return;
        setProcessingId(id);
        try {
            const token = typeof window !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1] || localStorage.getItem('access_token') : null;
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                credentials: "include",
                body: JSON.stringify({ query: `mutation { rejectWithdrawal(id: "${id}", reason: "${reason.replace(/"/g, '\\"')}") { id status } }` }),
            });
            const data = await res.json();
            if (data.errors) { toast.error(data.errors[0]?.message || "Failed"); return; }
            toast.success("Withdrawal rejected");
            await fetchWithdrawals();
        } finally { setProcessingId(null); }
    };

    if (loading) return <Card><CardContent className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></CardContent></Card>;

    const pending = withdrawals.filter(w => w.status === 'pending');
    const completed = withdrawals.filter(w => w.status !== 'pending');

    return (
        <div className="space-y-6">
            {pending.length > 0 && (
                <Card className="border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Wallet className="size-5 text-amber-500" /> Pending Withdrawals</CardTitle>
                            <CardDescription>{pending.length} withdrawal{pending.length !== 1 ? 's' : ''} awaiting payment</CardDescription>
                        </div>
                        <Badge variant="secondary">{pending.length} pending</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Affiliate</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Payment Details</TableHead>
                                    <TableHead>Requested</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pending.map((w: any) => (
                                    <TableRow key={w.id}>
                                        <TableCell>
                                            <div className="font-medium">{w.user_name}</div>
                                            <div className="text-xs text-muted-foreground">{w.user_email}</div>
                                        </TableCell>
                                        <TableCell className="font-bold text-lg">${w.amount.toFixed(2)}</TableCell>
                                        <TableCell><Badge variant="outline" className="uppercase">{w.payment_method}</Badge></TableCell>
                                        <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{w.payment_details}</code></TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" onClick={() => handleMarkPaid(w.id)} disabled={processingId === w.id} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                                                {processingId === w.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} Mark Paid
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleReject(w.id)} disabled={processingId === w.id} className="gap-1">
                                                <XCircle className="size-3" /> Reject
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>All Withdrawals</CardTitle>
                        <CardDescription>{withdrawals.length} total withdrawal requests</CardDescription>
                    </div>
                    <Badge variant="secondary">{withdrawals.length} requests</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Affiliate</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {withdrawals.map((w: any) => (
                                <TableRow key={w.id}>
                                    <TableCell>
                                        <div className="font-medium">{w.user_name}</div>
                                        <div className="text-xs text-muted-foreground">{w.user_email}</div>
                                    </TableCell>
                                    <TableCell className="font-bold">${w.amount.toFixed(2)}</TableCell>
                                    <TableCell className="uppercase text-xs">{w.payment_method}</TableCell>
                                    <TableCell><code className="text-xs">{w.payment_details}</code></TableCell>
                                    <TableCell>
                                        {w.status === "paid" && <Badge className="bg-emerald-500/10 text-emerald-500">Paid</Badge>}
                                        {w.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                                        {w.status === "approved" && <Badge className="bg-blue-500/10 text-blue-500">Approved</Badge>}
                                        {w.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(w.created_at).toLocaleDateString()}
                                        {w.paid_at && <div className="text-[10px]">Paid: {new Date(w.paid_at).toLocaleDateString()}</div>}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {withdrawals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                                        <Wallet className="h-10 w-10 opacity-20 mx-auto mb-4" />
                                        <p>No withdrawal requests yet</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
