"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    Settings,
    LogOut,
    Database,
    Cpu,
    Workflow
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";

export interface Subscription {
    id: string;
    service: string;
    status: string;
    plan: {
        name: string;
        slug: string;
        features: Record<string, string>;
    };
}

interface SidebarProps {
    user: { first_name: string, email: string, avatar?: string } | null;
    subscriptions: Subscription[];
}

export function Sidebar({ user, subscriptions }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = () => {
        clearAuthSession();
        router.push("/auth/login");
    };

    const hasDatabase = subscriptions.some(s => s.service === 'database');
    const hasN8n = subscriptions.some(s => s.service === 'n8n');
    const hasCompute = subscriptions.some(s => s.service === 'compute');

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
        { icon: Workflow, label: "Automations", href: "/dashboard/automations", visible: hasN8n },
        { icon: Cpu, label: "Compute", href: "/dashboard/compute", visible: hasCompute },
        { icon: Database, label: "Databases", href: "/dashboard/databases", visible: hasDatabase },
        { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ].filter(item => item.visible !== false);

    return (
        <aside className="w-64 border-r border-white/5 bg-black flex flex-col hidden md:flex shrink-0">
            <div className="p-8">
                <Link href="/" className="text-2xl font-black italic tracking-tighter text-primary">NEXODE</Link>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-white/5 mx-4 mb-6">
                <Link href="/dashboard/settings" className="flex items-center gap-3 mb-6 p-2 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden relative group-hover:border-primary/50 transition-colors">
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
                        <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user?.first_name || "Nexus User"}</div>
                        <div className="text-xs text-zinc-500 truncate">{user?.email || "user@nexode.com"}</div>
                    </div>
                </Link>
                <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                >
                    <LogOut className="w-5 h-5" /> Sign Out
                </Button>
            </div>
        </aside>
    );
}
