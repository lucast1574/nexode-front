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
import { useDashboard } from "@/app/dashboard/layout";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminStats {
    totalSubscribers: number;
    totalRevenue: number;
    totalUsers: number;
    activeSubscriptions: number;
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
        adminStats: { totalRevenue: 0, totalSubscribers: 0, activeSubscriptions: 0, totalUsers: 0 },
        adminSubscriptions: [],
    };

    const statsCards = [
        {
            title: "Total Revenue",
            value: `$${adminStats.totalRevenue.toLocaleString()}`,
            description: "Gross revenue from paid plans",
            icon: DollarSign,
            trend: "+12.5%",
            trendUp: true,
        },
        {
            title: "Subscribers",
            value: adminStats.totalSubscribers,
            description: "Unique paid customers",
            icon: Users,
            trend: "+3",
            trendUp: true,
        },
        {
            title: "Active Paid Subs",
            value: adminStats.activeSubscriptions,
            description: "Total active paid plans",
            icon: CreditCard,
            trend: "+5",
            trendUp: true,
        },
        {
            title: "Total Users",
            value: adminStats.totalUsers,
            description: "All registered accounts",
            icon: ShieldCheck,
            trend: "+24",
            trendUp: true,
        },
    ];

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
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
                    <p className="text-muted-foreground">Infrastructure and revenue control center.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {statsCards.map((stat, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">{stat.description}</p>
                                <div className={cn("text-xs mt-2 flex items-center gap-1", stat.trendUp ? "text-emerald-600" : "text-red-600")}>
                                    <TrendingUp className="h-3 w-3" />
                                    {stat.trend}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="financial" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="financial">Financial Ledger</TabsTrigger>
                        <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
                    </TabsList>

                    <TabsContent value="financial">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Financial Ledger</CardTitle>
                                    <CardDescription>Real-time transaction stream and subscriber status.</CardDescription>
                                </div>
                                <Badge variant="secondary">{adminSubscriptions.length} active</Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subscriber</TableHead>
                                                <TableHead>Auth</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Service</TableHead>
                                                <TableHead>Cycle</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Date</TableHead>
                                                <TableHead className="text-right">Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {adminSubscriptions.map((sub) => (
                                                <TableRow key={sub.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{sub.userName}</div>
                                                        {sub.userEmail !== "N/A" && sub.userEmail && (
                                                            <div className="text-xs text-muted-foreground">{sub.userEmail}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {sub.authProvider === "GOOGLE" ? "Google" : "Local"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{sub.planName}</Badge>
                                                    </TableCell>
                                                    <TableCell className="capitalize text-muted-foreground text-sm">
                                                        {sub.service || "SYSTEM"}
                                                    </TableCell>
                                                    <TableCell className="capitalize text-muted-foreground text-sm">
                                                        {sub.billingCycle}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        ${sub.price.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Badge
                                                                variant={sub.status === "ACTIVE" ? "default" : "secondary"}
                                                                className={cn(
                                                                    sub.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                )}
                                                            >
                                                                {sub.status}
                                                            </Badge>
                                                            {sub.isVerified ? (
                                                                <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
                                                            ) : (
                                                                <span className="text-[10px] text-red-600 font-medium">Unverified</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                        {new Date(sub.createdOn).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                        {new Date(sub.createdOn).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {adminSubscriptions.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <CreditCard className="h-10 w-10 opacity-20" />
                                                            <p className="text-sm font-medium">No subscriptions found</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="affiliates">
                        <AffiliatesTab />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

const AffiliatesTab = () => {
    const { data, loading, error, refetch } = useQuery<{ findAllUsers: AffiliateUser[] }>(GET_ALL_USERS, {
        fetchPolicy: "network-only",
    });
    const [generateLink, { loading: generating }] = useMutation(GENERATE_AFFILIATE_LINK_MUTATION);

    const handleGenerate = async (userId: string) => {
        try {
            await generateLink({ variables: { userId } });
            toast.success("Affiliate link generated successfully!");
            refetch();
        } catch (e: unknown) {
            toast.error((e as Error).message || "Failed to generate link");
        }
    };

    const handleCopy = (code: string) => {
        const link = `${window.location.origin}/auth/register?ref=${code}`;
        navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard!");
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 flex justify-center">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-8">
                    <p className="text-destructive font-bold">Error loading users: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    const users = data?.findAllUsers || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Affiliates & Users</CardTitle>
                <CardDescription>Manage user affiliate links and track referrals.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Affiliate Status</TableHead>
                                <TableHead className="text-center">Referrals</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u: AffiliateUser) => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="font-medium">{u.first_name} {u.last_name || ""}</div>
                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        {u.is_affiliate ? (
                                            <div className="flex flex-col gap-1 items-start">
                                                <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400">
                                                    Active Affiliate
                                                </Badge>
                                                <code className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded font-mono">
                                                    {u.affiliate_code}
                                                </code>
                                            </div>
                                        ) : (
                                            <Badge variant="secondary">Standard User</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-semibold text-lg">{u.referral_count || 0}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {u.is_affiliate ? (
                                            <Button size="sm" variant="outline" onClick={() => handleCopy(u.affiliate_code)} className="gap-2">
                                                <Copy className="size-3" /> Copy Link
                                            </Button>
                                        ) : (
                                            <Button size="sm" disabled={generating} onClick={() => handleGenerate(u.id)} className="gap-2">
                                                <Link2 className="size-3" /> Make Affiliate
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
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
