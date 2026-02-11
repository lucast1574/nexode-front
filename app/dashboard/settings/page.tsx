"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    Settings as SettingsIcon,
    LogOut,
    Plus,
    User,
    Shield,
    Bell,
    Save,
    ChevronRight,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAccessToken, getAuthUser, setAuthSession } from "@/lib/auth-utils";
import { User as UserType } from "@/lib/types";
import { toast } from "sonner";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getAccessToken();
                const u = getAuthUser();

                if (!token || !u) {
                    router.push("/auth/login");
                    return;
                }

                setUser(u);
                setFormData({
                    first_name: u.first_name || "",
                    last_name: u.last_name || "",
                    email: u.email || "",
                });
                setLoading(false);
            } catch (error) {
                console.error("Settings fetch error:", error);
                router.push("/auth/login");
            }
        };

        fetchData();
    }, [router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Mocking API call for now (matches profile page behavior)
        setTimeout(() => {
            if (user) {
                const updatedUser: UserType = {
                    ...user,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                };
                setAuthSession(undefined, undefined, updatedUser); // Using current tokens
                setUser(updatedUser);
                toast.success("Settings updated successfully!");
            }
            setIsSaving(false);
        }, 800);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Initializing System Config...</p>
                </div>
            </div>
        );
    }

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
        { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
        { icon: SettingsIcon, label: "Settings", href: "/dashboard/settings", active: true },
    ];

    return (
        <div className="h-screen bg-[#020202] text-white flex overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-black flex flex-col hidden md:flex shrink-0">
                <div className="p-8">
                    <Link href="/" className="text-2xl font-black italic tracking-tighter text-primary">NEXODE</Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
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
                    <Link href="/profile" className="flex items-center gap-3 mb-6 p-2 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden relative group-hover:border-primary/50 transition-colors">
                            {user?.avatar && (
                                <Image src={user.avatar} alt="User avatar" fill className="object-cover" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user?.first_name || "Nexus User"}</div>
                            <div className="text-xs text-zinc-500 truncate">{user?.email || "user@nexode.com"}</div>
                        </div>
                    </Link>
                    <Button variant="ghost" onClick={() => router.push("/auth/login")} className="w-full justify-start gap-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl">
                    <h2 className="text-xl font-black tracking-tight uppercase">System Settings</h2>
                    <div className="flex items-center gap-4">
                        <Button asChild className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20">
                            <Link href="/checkout"><Plus className="w-4 h-4" /> New Service</Link>
                        </Button>
                    </div>
                </header>

                <div className="p-8 max-w-4xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black tracking-tight mb-2">Configuration</h1>
                        <p className="text-zinc-500">Manage your system preferences and account data.</p>
                    </div>

                    <div className="space-y-8">
                        {/* Profile Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                    <User className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black">Identity & Profile</h3>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">First Name</label>
                                        <Input
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 focus:border-primary/50 transition-all"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Last Name</label>
                                        <Input
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 focus:border-primary/50 transition-all"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Email Address</label>
                                    <Input
                                        value={formData.email}
                                        readOnly
                                        className="bg-white/[0.02] border-white/5 text-zinc-500 rounded-2xl h-14 px-6 cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-zinc-600 ml-4">Managed via Identity Provider. Contact support to change.</p>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                                    >
                                        {isSaving ? "Syncing..." : <><Save className="w-4 h-4" /> Update Identity</>}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Preferences */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.04] transition-all group cursor-pointer">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</div>
                                </div>
                                <h4 className="font-bold text-lg mb-1">Notification Protocol</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">Configure how the system alerts you regarding instance health and billing events.</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.04] transition-all group cursor-pointer">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest border border-white/5">Standard</div>
                                </div>
                                <h4 className="font-bold text-lg mb-1">Security & Access</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">Manage your authentication methods, session timeout settings, and 2FA status.</p>
                            </div>
                        </div>

                        {/* Billing Quick Link */}
                        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[40px] p-8 flex items-center justify-between group cursor-pointer" onClick={() => router.push("/dashboard/billing")}>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[24px] bg-primary/20 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform duration-500">
                                    <CreditCard className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Billing Architecture</h3>
                                    <p className="text-sm text-zinc-400">Manage payment methods, invoices, and cloud usage costs.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-primary transition-colors" />
                        </div>

                        {/* System Info */}
                        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                                <Globe className="w-3 h-3 text-zinc-700" /> Infrastructure Edge: North Virginia (US-EAST-1)
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span className="hover:text-primary transition-colors cursor-pointer">Compliance</span>
                                <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
                                <span className="text-zinc-800">v2.4.0-prod</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
