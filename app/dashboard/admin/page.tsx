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
            description: "Gross revenue from all plans",
            icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
            trend: "+12.5%",
            trendUp: true
        },
        {
            title: "Subscribers",
            value: adminStats.totalSubscribers,
            description: "Unique paying customers",
            icon: <Users className="h-5 w-5 text-blue-500" />,
            trend: "+3",
            trendUp: true
        },
        {
            title: "Active Subs",
            value: adminStats.activeSubscriptions,
            description: "Total active service plans",
            icon: <CreditCard className="h-5 w-5 text-purple-500" />,
            trend: "+5",
            trendUp: true
        },
        {
            title: "Total Users",
            value: adminStats.totalUsers,
            description: "Registered accounts",
            icon: <ShieldCheck className="h-5 w-5 text-orange-500" />,
            trend: "+24",
            trendUp: true
        },
    ];

    return (
        <div className="flex-1 space-y-8 p-1 pt-6 sm:p-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-muted-foreground">
                        Real-time overview of your application metrics and subscriptions.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat, i) => (
                    <Card key={i} className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                            <div className={`text-xs mt-2 flex items-center font-medium ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {stat.trend} from last month
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4">
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Recent Subscriptions</CardTitle>
                        <CardDescription>
                            A detailed list of all customer payments and active services.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-muted/20">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Cycle</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adminSubscriptions.map((sub) => (
                                        <TableRow key={sub.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell>
                                                <div className="font-medium">{sub.userName}</div>
                                                <div className="text-xs text-muted-foreground">{sub.userEmail}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-primary/5 font-semibold">
                                                    {sub.planName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{sub.service || "N/A"}</TableCell>
                                            <TableCell className="capitalize text-xs">{sub.billingCycle}</TableCell>
                                            <TableCell className="font-semibold text-emerald-600">
                                                ${sub.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    className={sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-orange-100 text-orange-700 hover:bg-orange-100 uppercase text-[10px]'}
                                                >
                                                    {sub.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {new Date(sub.createdOn).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {adminSubscriptions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No subscriptions found.
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
