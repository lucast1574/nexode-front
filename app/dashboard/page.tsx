"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    Database,
    Cpu,
    Settings,
    LogOut,
    Plus,
    ExternalLink,
    ChevronRight,
    Search,
    Bell,
    CreditCard,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAccessToken, setAuthSession } from "@/lib/auth-utils";
import { UserNav } from "@/components/user-nav";

interface Subscription {
    id: string;
    service: string;
    status: string;
    plan: {
        name: string;
        features: Record<string, string>;
    };
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string>("Authenticating System...");
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [user, setUser] = useState<{ first_name: string, email: string, avatar?: string } | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const sessionId = urlParams.get('session_id');
                let token = getAccessToken();

                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

                // AUTO-LOGIN FOR GUEST CHECKOUT OR SESSION RECOVERY
                if (sessionId) {
                    console.log("[Dashboard] Found session_id, performing authentication exchange...");
                    setStatusMessage("Initializing Secure Session...");

                    const stripeMutation = `
                        mutation StripeLogin($sessionId: String!) {
                            stripeLogin(sessionId: $sessionId) {
                                success
                                access_token
                                refresh_token
                                user {
                                    first_name
                                    last_name
                                    email
                                    avatar
                                }
                            }
                        }
                    `;

                    try {
                        const stripeRes = await fetch(GQL_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                query: stripeMutation,
                                variables: { sessionId }
                            }),
                        });
                        const stripeResult = await stripeRes.json();

                        if (stripeResult.data?.stripeLogin?.success) {
                            const { access_token, refresh_token, user } = stripeResult.data.stripeLogin;
                            setAuthSession(access_token, refresh_token, user);
                            token = access_token;
                            console.log("[Dashboard] Stripe auto-login successful");
                            // Clean up URL
                            window.history.replaceState({}, document.title, "/dashboard");
                        } else {
                            console.error("[Dashboard] Stripe login failed:", stripeResult.errors);
                        }
                    } catch (err) {
                        console.error("[Dashboard] Stripe login mutation error:", err);
                    }
                }

                console.log("[Dashboard] Retrieved token:", token ? "Exists (starts with " + token.substring(0, 10) + "...)" : "MISSING");

                if (!token) {
                    console.warn("[Dashboard] No token found, redirecting to login");
                    router.push("/auth/login");
                    return;
                }

                setStatusMessage("Loading Infrastructure...");
                const query = `
                    query GetDashboardData {
                        me {
                            first_name
                            last_name
                            email
                            avatar
                        }
                        mySubscription {
                            id
                            service
                            status
                            plan {
                                name
                                features
                            }
                        }
                    }
                `;

                const response = await fetch(GQL_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ query }),
                });

                const result = await response.json();
                console.log("[Dashboard] API Result:", result);

                if (result.data) {
                    setUser(result.data.me);
                    // Filter out free plans (service 'nexus')
                    const subs = [result.data.mySubscription].filter(s => s && s.status === 'ACTIVE' && s.service !== 'nexus');

                    if (subs.length === 0) {
                        console.warn("[Dashboard] No active paid subscriptions found, redirecting to checkout");
                        setIsAuthorized(false);
                        router.push("/checkout");
                        return;
                    }

                    setSubscriptions(subs);
                    setIsAuthorized(true);
                } else {
                    console.error("[Dashboard] No data in result, redirecting to login. Errors:", result.errors);
                    router.push("/auth/login");
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                router.push("/auth/login");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading || isAuthorized === null) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">{statusMessage}</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard", active: true },
        { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ];

    return (
        <div className="min-h-screen bg-[#020202] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-black flex flex-col hidden md:flex">
                <div className="p-8">
                    <Link href="/" className="text-2xl font-black italic tracking-tighter text-primary">NEXODE</Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                                item.active
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5 mx-4 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden relative">
                            {user?.avatar && (
                                <Image
                                    src={user.avatar}
                                    alt="User avatar"
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{user?.first_name || "Nexus User"}</div>
                            <div className="text-xs text-zinc-500 truncate">{user?.email || "user@nexode.com"}</div>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl">
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 w-96">
                        <Search className="w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search instances, services..."
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full relative">
                            <Bell className="w-5 h-5 text-zinc-400" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-black" />
                        </Button>
                        <Button asChild className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20">
                            <Link href="/checkout"><Plus className="w-4 h-4" /> New Service</Link>
                        </Button>
                        <UserNav />
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black tracking-tight mb-2">System Overview</h1>
                        <p className="text-zinc-500">Monitor and manage your active cloud resources.</p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 rounded-[32px] bg-white/[0.03] animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="group relative bg-white/[0.03] border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.06] transition-all duration-500">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-inner",
                                            sub.service === "database" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {sub.service === "database" ? <Database className="w-8 h-8" /> : <Cpu className="w-8 h-8" />}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                {sub.status}
                                            </div>
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Active Runtime</div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-2xl font-black capitalize">{sub.service} Cluster</h3>
                                        <p className="text-zinc-500 font-medium text-sm">{sub.plan.name} Instance</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        {Object.entries(sub.plan.features).slice(0, 4).map(([key, val]: [string, string]) => (
                                            <div key={key} className="space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">{key}</div>
                                                <div className="text-sm font-bold text-zinc-200">{val}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <Button className="flex-1 rounded-xl h-11 font-bold gap-2">
                                                Open Console <ExternalLink className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" className="w-11 h-11 p-0 rounded-xl bg-white/5 border-white/10 hover:bg-white/10">
                                                <ChevronRight className="w-5 h-5 text-zinc-400" />
                                            </Button>
                                        </div>
                                        <Button asChild variant="ghost" className="w-full rounded-xl h-11 font-bold gap-2 text-primary hover:bg-primary/10 hover:text-primary">
                                            <Link href="/checkout"><Zap className="w-4 h-4" /> Upgrade Plan</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Upgrade Performance</h3>
                                <p className="text-sm text-zinc-400 max-w-xs mb-6">Need more compute power? Upscale your instances with zero downtime.</p>
                                <Button asChild size="sm" variant="outline" className="rounded-xl border-primary/50 text-primary hover:bg-primary/20">
                                    <Link href="/checkout">View Tiers</Link>
                                </Button>
                            </div>
                            <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8">
                            <h3 className="text-xl font-bold mb-4">Instance Health</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">Uptime</span>
                                    <span className="font-bold text-emerald-400">99.98%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 w-[99.98%]" />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">Global Connectivity</span>
                                    <span className="font-bold text-primary">Operational</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
