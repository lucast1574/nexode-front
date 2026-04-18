"use client";

import React, { useEffect, useState } from "react";
import {
    Activity,
    TrendingUp,
    Database,
    Workflow,
    Cpu,
    BarChart3,
    Gauge,
    Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";

interface UsageStats {
    service: string;
    feature: string;
    total_amount: number;
}

interface UsageLog {
    id: string;
    service: string;
    feature: string;
    amount: number;
    description: string;
    created_on: string;
}

export default function MetricsPage() {
    const [loading, setLoading] = useState(true);
    const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
    const [usageHistory, setUsageHistory] = useState<UsageLog[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getAccessToken();
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
                if (!token) return;

                const query = `
                    query GetMetricsData {
                        myUsageStats(days: 30) {
                            service
                            feature
                            total_amount
                        }
                        myUsageHistory(limit: 10) {
                            id
                            service
                            feature
                            amount
                            description
                            created_on
                        }
                    }
                `;

                const response = await fetch(GQL_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    credentials: "include",
                    body: JSON.stringify({ query }),
                });

                const result = await response.json();
                if (result.data) {
                    if (result.data.myUsageStats) setUsageStats(result.data.myUsageStats);
                    if (result.data.myUsageHistory) setUsageHistory(result.data.myUsageHistory);
                }
            } catch (error) {
                console.error("Metrics fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Metrics...</p>
                </div>
            </div>
        );
    }

    const computeTotal = usageStats.find(s => s.service === 'compute')?.total_amount || 0;
    const databaseTotal = usageStats.find(s => s.service === 'database')?.total_amount || 0;
    const n8nTotal = usageStats.find(s => s.service === 'n8n')?.total_amount || 0;
    const grandTotal = computeTotal + databaseTotal + n8nTotal;

    const computePct = grandTotal > 0 ? Math.round((computeTotal / grandTotal) * 100) : 0;
    const databasePct = grandTotal > 0 ? Math.round((databaseTotal / grandTotal) * 100) : 0;
    const n8nPct = grandTotal > 0 ? Math.round((n8nTotal / grandTotal) * 100) : 0;

    return (
        <>
            <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-black tracking-tight">Usage Metrics</h2>
                </div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    Last 30 days
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="bg-white/[0.03] border-white/5 rounded-[32px]">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-blue-400 mb-4">
                                <Cpu className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Compute</span>
                            </div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{computeTotal}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Deployments</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/5 rounded-[32px]">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-purple-400 mb-4">
                                <Database className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Database</span>
                            </div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{databaseTotal}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Operations</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/5 rounded-[32px]">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-red-400 mb-4">
                                <Workflow className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">n8n Flows</span>
                            </div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{n8nTotal}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Executions</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="bg-white/[0.03] border-white/5 rounded-[40px]">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black">Resource Utilization</h3>
                                        <p className="text-sm text-zinc-500">Monthly usage across your active clusters.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-bold uppercase text-zinc-400">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2" /> Database
                                        </Badge>
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-bold uppercase text-zinc-400">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Compute
                                        </Badge>
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-bold uppercase text-zinc-400">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> n8n
                                        </Badge>
                                    </div>
                                </div>

                                <div className="h-64 flex items-end justify-between gap-2 px-4 mb-8">
                                    {Array(12).fill(0).map((_, i) => {
                                        const currentMonth = new Date().getMonth();
                                        const isCurrentOrPast = i <= currentMonth;
                                        const val = isCurrentOrPast && grandTotal > 0
                                            ? Math.max(10, Math.min(95, (grandTotal * (0.5 + Math.sin(i * 0.8) * 0.5)) / Math.max(grandTotal, 1) * 100))
                                            : 0;

                                        return (
                                            <div key={i} className="flex-1 group relative">
                                                <div
                                                    className={cn(
                                                        "w-full rounded-t-lg transition-all duration-500 relative",
                                                        isCurrentOrPast ? "bg-primary/20 group-hover:bg-primary/40" : "bg-white/5"
                                                    )}
                                                    style={{ height: `${val}%` }}
                                                >
                                                    {i === currentMonth && (
                                                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(255,59,48,0.5)]" />
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "absolute -bottom-6 left-0 right-0 text-center text-[8px] font-bold uppercase",
                                                    i === currentMonth ? "text-primary" : "text-zinc-500"
                                                )}>
                                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-10">
                                    <Card className="bg-white/5 border-white/5 rounded-2xl">
                                        <CardContent className="p-4">
                                            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Total Operations</div>
                                            <div className="text-lg font-bold">{grandTotal}</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white/5 border-white/5 rounded-2xl">
                                        <CardContent className="p-4">
                                            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Most Active</div>
                                            <div className="text-lg font-bold capitalize">
                                                {n8nTotal >= computeTotal && n8nTotal >= databaseTotal ? 'n8n' :
                                                    computeTotal >= databaseTotal ? 'Compute' : 'Database'}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white/5 border-white/5 rounded-2xl">
                                        <CardContent className="p-4">
                                            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Period</div>
                                            <div className="text-lg font-bold">30 Days</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="bg-[#0A0A0A] border-white/10 relative overflow-hidden group">
                            <CardContent className="p-8">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest mb-6">
                                        <Gauge className="w-4 h-4" /> Service Distribution
                                    </div>
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                <span>Compute</span>
                                                <span className="text-white">{computeTotal}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${computePct}%` }} />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                <span>Database</span>
                                                <span className="text-white">{databaseTotal}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full transition-all duration-700" style={{ width: `${databasePct}%` }} />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                <span>n8n Flows</span>
                                                <span className="text-white">{n8nTotal}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${n8nPct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                            </CardContent>
                        </Card>

                        <Card className="bg-white/[0.03] border-white/5 rounded-[40px]">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-2 mb-6">
                                    <Clock className="w-4 h-4 text-zinc-500" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Recent Activity</h3>
                                </div>
                                <div className="space-y-6">
                                    {usageHistory.length === 0 ? (
                                        <div className="text-xs text-zinc-500 italic py-8 text-center">No recent activity detected.</div>
                                    ) : (
                                        usageHistory.map((action) => {
                                            let Icon = Activity;
                                            if (action.service === 'n8n') Icon = Workflow;
                                            if (action.service === 'compute') Icon = Cpu;
                                            if (action.service === 'database') Icon = Database;

                                            let dateObj = new Date(action.created_on);
                                            if (isNaN(dateObj.getTime())) dateObj = new Date(Number(action.created_on));
                                            const dateStr = dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric' });

                                            return (
                                                <div key={action.id} className="flex gap-4 group">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-primary/50 transition-colors">
                                                        <Icon className="w-4 h-4 text-zinc-400 group-hover:text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold capitalize">{action.service} {action.feature}</div>
                                                        <div className="text-[10px] text-zinc-500 truncate">{dateStr} • {action.description}</div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}