"use client";

import React from "react";
import { useGraphQL } from "@/lib/use-graphql";
import { GET_ADMIN_DATA } from "@/lib/graphql-operations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Users, 
    CreditCard, 
    DollarSign, 
    TrendingUp, 
    ShieldCheck, 
    AlertCircle,
    Loader2
} from "lucide-react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow,
} from "../../../components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/app/dashboard/layout";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

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
}

interface AdminData {
    adminStats: AdminStats;
    adminSubscriptions: AdminSubscription[];
}

export default function AdminPage() {
    const { user } = useDashboard();
    
    // Convert gql object to string for useGraphQL
    const queryStr = GET_ADMIN_DATA.loc?.source.body || "";
    
    const { data, loading, error } = useGraphQL<AdminData>({
        query: queryStr,
    });

    // Security check: If not admin/superuser, redirect
    if (user && user.role?.slug !== 'superuser' && user.role?.slug !== 'admin') {
        redirect("/dashboard");
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-5 w-5" />
                    <p>Error loading admin data: {error}</p>
                </div>
            </div>
        );
    }

    const { adminStats, adminSubscriptions } = data || { 
        adminStats: { totalRevenue: 0, totalSubscribers: 0, activeSubscriptions: 0, totalUsers: 0 }, 
        adminSubscriptions: [] 
    };

    const statsCards = [
        {
            title: "Total Revenue",
            value: `$${adminStats.totalRevenue.toLocaleString()}`,
            description: "Gross revenue from paid plans",
            icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
            color: "from-emerald-500/20 to-emerald-500/5",
            border: "border-emerald-500/20",
            trend: "+12.5%",
            trendUp: true
        },
        {
            title: "Subscribers",
            value: adminStats.totalSubscribers,
            description: "Unique paid customers",
            icon: <Users className="h-5 w-5 text-blue-400" />,
            color: "from-blue-500/20 to-blue-500/5",
            border: "border-blue-500/20",
            trend: "+3",
            trendUp: true
        },
        {
            title: "Active Paid Subs",
            value: adminStats.activeSubscriptions,
            description: "Total active paid plans",
            icon: <CreditCard className="h-5 w-5 text-purple-400" />,
            color: "from-purple-500/20 to-purple-500/5",
            border: "border-purple-500/20",
            trend: "+5",
            trendUp: true
        },
        {
            title: "Total Users",
            value: adminStats.totalUsers,
            description: "All registered accounts",
            icon: <ShieldCheck className="h-5 w-5 text-orange-400" />,
            color: "from-orange-500/20 to-orange-500/5",
            border: "border-orange-500/20",
            trend: "+24",
            trendUp: true
        },
    ];

    return (
        <div className="flex-1 space-y-8 p-1 pt-6 sm:p-8 bg-black/5">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Admin Dashboard</h2>
                    <p className="text-muted-foreground">
                        Real-time revenue metrics and subscriber management.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat, i) => (
                    <Card key={i} className={cn(
                        "overflow-hidden border shadow-2xl transition-all duration-300 hover:scale-[1.02]",
                        "bg-gradient-to-br border-white/5",
                        stat.color,
                        stat.border
                    )}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/80">
                                {stat.title}
                            </CardTitle>
                            <div className="p-2 rounded-full bg-white/5 backdrop-blur-md">
                                {stat.icon}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tighter text-white">{stat.value}</div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-semibold">
                                {stat.description}
                            </p>
                            <div className={`text-xs mt-4 flex items-center font-bold ${stat.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    <TrendingUp className="h-3 w-3" />
                                    {stat.trend}
                                </div>
                                <span className="ml-2 text-white/30 font-normal">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4">
                <Card className="border border-white/5 shadow-2xl bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-xl font-bold text-white">Recent Subscriptions</CardTitle>
                        <CardDescription className="text-white/40">
                            A detailed list of all customer payments and active services.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-white/[0.03] border-white/5 hover:bg-white/[0.03]">
                                        <TableHead className="text-white/60 font-bold uppercase text-[10px] tracking-wider">Customer</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase text-[10px] tracking-wider">Plan</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase text-[10px] tracking-wider">Service</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase text-[10px] tracking-wider">Cycle</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase text-[10px] tracking-wider">Amount</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
                                        <TableHead className="text-right text-white/60 font-bold uppercase text-[10px] tracking-wider">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adminSubscriptions.map((sub) => (
                                        <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <TableCell>
                                                <div className="font-bold text-white">{sub.userName}</div>
                                                <div className="text-xs text-white/30">{sub.userEmail}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80 font-medium">
                                                    {sub.planName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize text-white/70">{sub.service || "N/A"}</TableCell>
                                            <TableCell className="capitalize text-[10px] font-bold text-white/40">{sub.billingCycle}</TableCell>
                                            <TableCell className="font-bold text-emerald-400">
                                                ${sub.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5",
                                                        sub.status === 'ACTIVE' 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10' 
                                                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/10'
                                                    )}
                                                >
                                                    {sub.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-white/40 font-medium">
                                                {new Date(sub.createdOn).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {adminSubscriptions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20 text-white/20">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CreditCard className="h-10 w-10 opacity-20" />
                                                    <p>No subscriptions found.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
