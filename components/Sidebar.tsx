"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Database,
    Cpu,
    Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    user: { first_name: string; email: string; avatar?: string } | null;
    subscriptions: Subscription[];
}

export function Sidebar({ user, subscriptions }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = () => {
        clearAuthSession();
        router.push("/auth/login");
    };

    const hasDatabase = subscriptions.some((s) => s.service === "database");
    const hasN8n = subscriptions.some((s) => s.service === "n8n");
    const hasCompute = subscriptions.some((s) => s.service === "compute");

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
        { icon: Workflow, label: "Automations", href: "/dashboard/automations", visible: hasN8n },
        { icon: Cpu, label: "Compute", href: "/dashboard/compute", visible: hasCompute },
        { icon: Database, label: "Databases", href: "/dashboard/databases", visible: hasDatabase },
        { icon: BarChart3, label: "Metrics", href: "/dashboard/metrics" },
        { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ].filter((item) => item.visible !== false);

    const initials = user?.first_name ? user.first_name[0].toUpperCase() : "N";

    return (
        <aside className="w-64 border-r border-white/5 bg-black flex flex-col hidden md:flex shrink-0">
            <div className="p-8">
                <Button asChild variant="ghost" className="text-2xl font-black italic tracking-tighter text-primary p-0 h-auto hover:bg-transparent">
                    <Link href="/">NEXODE</Link>
                </Button>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <TooltipProvider key={item.label} delay={0}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3 rounded-2xl h-11",
                                            isActive
                                                ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
                                                : "text-zinc-500 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-semibold text-sm">{item.label}</span>
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={8}>
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-white/5 mx-4 mb-6">
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-2xl h-auto p-2 hover:bg-white/5 mb-2">
                    <Link href="/dashboard/settings" className="group">
                        <Avatar size="lg">
                            {user?.avatar && (
                                <AvatarImage src={user.avatar} alt={user?.first_name || "User"} />
                            )}
                            <AvatarFallback className="bg-zinc-800 border border-white/10 group-hover:border-primary/50 transition-colors">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                                {user?.first_name || "Nexus User"}
                            </div>
                            <div className="text-xs text-zinc-500 truncate">{user?.email || "user@nexode.com"}</div>
                        </div>
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}