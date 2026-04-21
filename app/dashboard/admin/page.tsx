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
    authProvider: string;
    isVerified: boolean;
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
        <div className="flex-1 space-y-8 p-4 pt-6 sm:p-8 bg-[#030303]">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase pr-2">Terminal Admin</h2>
                </div>
                <p className="text-white/40 text-sm font-medium ml-1">
                    Nexode Infrastructure & Revenue Control Center
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat, i) => (
                    <Card key={i} className={cn(
                        "overflow-hidden border-0 shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative",
                        "bg-[#0a0a0b] hover:bg-[#0d0d0f]"
                    )}>
                        <div className={cn(
                            "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity bg-gradient-to-br",
                            stat.color
                        )} />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                {stat.title}
                            </CardTitle>
                            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 group-hover:border-white/10 transition-colors">
                                {stat.icon}
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold tracking-tighter text-white mb-1">{stat.value}</div>
                            <p className="text-[11px] text-white/30 font-medium line-clamp-1">
                                {stat.description}
                            </p>
                            <div className={`text-[10px] mt-6 flex items-center font-black ${stat.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-full border border-white/5">
                                    <TrendingUp className="h-3 w-3" />
                                    {stat.trend}
                                </div>
                                <span className="ml-3 text-white/20 font-bold uppercase tracking-wider">Growth</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6">
                <Card className="border border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-[#0a0a0b] overflow-hidden rounded-2xl">
                    <CardHeader className="border-b border-white/[0.03] bg-white/[0.01] p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold text-white tracking-tight">Financial Ledger</CardTitle>
                                <CardDescription className="text-white/30 font-medium">
                                    Real-time transaction stream and subscriber status.
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary px-4 py-1 font-bold">
                                {adminSubscriptions.length} ACTIVE STREAMS
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-white/[0.01] border-white/[0.03] hover:bg-transparent">
                                        <TableHead className="text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14 px-8">Subscriber</TableHead>
                                        <TableHead className="text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14">Auth</TableHead>
                                        <TableHead className="text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14">Architecture</TableHead>
                                        <TableHead className="text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14">Infrastructure</TableHead>
                                        <TableHead className="text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14">Frequency</TableHead>
                                        <TableHead className="text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14">Contribution</TableHead>
                                        <TableHead className="text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14">Status</TableHead>
                                        <TableHead className="text-right text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14 px-4">Date</TableHead>
                                        <TableHead className="text-right text-white/30 font-black uppercase text-[10px] tracking-[0.2em] h-14 px-8">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adminSubscriptions.map((sub) => (
                                        <TableRow key={sub.id} className="border-white/[0.03] hover:bg-white/[0.01] transition-all group">
                                            <TableCell className="px-8 py-6">
                                                <div className="font-bold text-white group-hover:text-primary transition-colors">{sub.userName}</div>
                                                {sub.userEmail && (
                                                    <div className="text-xs text-white/20 font-medium">{sub.userEmail}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter",
                                                    sub.authProvider === 'GOOGLE' 
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                )}>
                                                    {sub.authProvider === 'GOOGLE' ? 'Google' : 'Local'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white/[0.02] border-white/5 text-white/60 font-bold text-[10px] px-3 py-0.5">
                                                    {sub.planName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize text-white/40 font-bold text-[11px]">{sub.service || "SYSTEM"}</TableCell>
                                            <TableCell className="capitalize text-[10px] font-black text-white/20 tracking-widest">{sub.billingCycle}</TableCell>
                                            <TableCell className="font-black text-emerald-400 text-lg tracking-tighter">
                                                ${sub.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge 
                                                        className={cn(
                                                            "text-[9px] font-black px-3 py-0.5 uppercase tracking-tighter w-fit",
                                                            sub.status === 'ACTIVE' 
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                                : 'bg-white/5 text-white/30 border-white/10'
                                                        )}
                                                    >
                                                        {sub.status}
                                                    </Badge>
                                                    {sub.isVerified ? (
                                                        <span className="text-[8px] font-bold text-emerald-400/50 uppercase ml-0.5 italic">Verified</span>
                                                    ) : (
                                                        <span className="text-[8px] font-bold text-rose-400/50 uppercase ml-0.5 italic">Unverified</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-[11px] px-4 text-white/20 font-bold tracking-tighter">
                                                {new Date(sub.createdOn).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-right text-[11px] px-8 text-white/20 font-bold tracking-tighter">
                                                {new Date(sub.createdOn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {adminSubscriptions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-32 text-white/10 bg-white/[0.01]">
                                                <div className="flex flex-col items-center gap-4">
                                                    <CreditCard className="h-12 w-12 opacity-10 animate-pulse" />
                                                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">No Data Streams Found</p>
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
