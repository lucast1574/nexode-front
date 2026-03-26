"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    CreditCard,
    Plus,
    User,
    Shield,
    Bell,
    Save,
    ChevronRight,
    Globe,
    Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAccessToken, getAuthUser, setAuthSession } from "@/lib/auth-utils";
import { User as UserType } from "@/lib/types";
import { Sidebar, Subscription } from "@/components/Sidebar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
    const [user, setUser] = useState<UserType | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        notifications_enabled: true,
        avatar: "",
    });
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
                    notifications_enabled: u.notifications_enabled ?? true,
                    avatar: u.avatar || "",
                });

                // Fetch Subscriptions for Sidebar
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
                const query = `
                    query GetSettingsData {
                        me {
                           first_name
                           last_name
                           email
                           avatar
                           notifications_enabled
                        }
                        mySubscriptions {
                            id
                            service
                            status
                            plan {
                                name
                                slug
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
                if (result.data) {
                    if (result.data.me) {
                        const uFull = result.data.me;
                        setUser(uFull);
                        setFormData({
                            first_name: uFull.first_name || "",
                            last_name: uFull.last_name || "",
                            email: uFull.email || "",
                            notifications_enabled: uFull.notifications_enabled ?? true,
                            avatar: uFull.avatar || "",
                        });
                        // Update local storage sync
                        setAuthSession(undefined, undefined, uFull);
                    }
                    if (result.data.mySubscriptions) {
                        const allSubs = result.data.mySubscriptions || [];
                        setSubscriptions(allSubs.filter((s: Subscription) => s && s.status === 'ACTIVE'));
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error("Settings fetch error:", error);
                router.push("/auth/login");
            }
        };

        fetchData();
    }, [router]);

    const handleSave = async (e?: React.FormEvent, overrideData?: Partial<typeof formData>) => {
        if (e) {
            e.preventDefault();
            setIsSaving(true);
        } else {
            setIsTogglingNotifications(true);
        }

        const token = getAccessToken();
        if (!token) return;

        try {
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const currentData = { ...formData, ...overrideData };
            
            const query = `
                mutation UpdateMe($input: UpdateUserInput!) {
                    updateMe(input: $input) {
                        id
                        first_name
                        last_name
                        email
                        notifications_enabled
                        avatar
                    }
                }
            `;

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query,
                    variables: {
                        input: {
                            first_name: currentData.first_name,
                            last_name: currentData.last_name,
                            notifications_enabled: currentData.notifications_enabled,
                            avatar: currentData.avatar
                        }
                    }
                }),
            });

            const result = await response.json();
            if (result.data?.updateMe) {
                const updated = result.data.updateMe;
                setAuthSession(undefined, undefined, updated);
                setUser(updated);
                setFormData(prev => ({ ...prev, ...updated }));
                toast.success("Identity synchronized", {
                    description: "User preferences updated on Nexode Core",
                    style: { background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }
                });
            } else {
                const errMsg = result.errors?.[0]?.message || "Identity update rejected by gateway";
                toast.error("Protocol Error", {
                    description: errMsg
                });
            }
        } catch (error) {
            console.error("Save error:", error);
            const message = error instanceof Error ? error.message : "Could not reach Nexode API";
            toast.error("Internal Server Error", {
                description: message
            });
        } finally {
            setIsSaving(false);
            setIsTogglingNotifications(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Ensure it is an image
        if (!file.type.startsWith('image/')) {
            toast.error("Invalid File", { description: "You must provide an image file" });
            return;
        }

        // Limit size (approx 2MB for base64 storage)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File oversized", { description: "Maximum avatar size is 2MB" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setFormData(prev => ({ ...prev, avatar: base64 }));
            handleSave(undefined, { avatar: base64 });
        };
        reader.readAsDataURL(file);
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


    return (
        <div className="h-screen bg-[#020202] text-white flex overflow-hidden font-sans">
            <Sidebar user={user} subscriptions={subscriptions} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="h-28 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                    <h2 className="text-xl font-black tracking-tight uppercase">System Settings</h2>
                    <div className="flex items-center gap-6">
                        <Button asChild className="rounded-2xl h-12 px-6 gap-2 font-bold shadow-lg shadow-primary/20">
                            <Link href="/checkout"><Plus className="w-5 h-5" /> New Service</Link>
                        </Button>
                    </div>
                </header>

                <div className="p-8 pt-24 max-w-4xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black tracking-tight mb-2">Configuration</h1>
                        <p className="text-zinc-500">Manage your system preferences and account data.</p>
                    </div>

                    <div className="space-y-8">
                        {/* Profile Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                                <div 
                                    className="relative w-28 h-28 group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className={cn(
                                        "w-full h-full rounded-[32px] overflow-hidden border-2 border-white/5 transition-all duration-500 group-hover:border-primary/50 relative",
                                        !formData.avatar && "bg-primary/10 flex items-center justify-center text-primary"
                                    )}>
                                        {formData.avatar ? (
                                            <Image 
                                                src={formData.avatar} 
                                                alt="Avatar" 
                                                fill 
                                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <User className="w-10 h-10" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleAvatarUpload} 
                                    />
                                    {isTogglingNotifications && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#020202] rounded-full border border-white/10 flex items-center justify-center">
                                            <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">Identity & Profile</h3>
                                    <p className="text-xs text-zinc-500 font-medium">Coordinate your digital credentials and profile metadata.</p>
                                </div>
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
                                    <p className="text-[10px] text-zinc-400 ml-4">Managed via Identity Provider. Contact support to change.</p>
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
                            <div className={cn(
                                "bg-[#080808]/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 transition-all duration-700 group",
                                formData.notifications_enabled && "border-emerald-500/20 bg-emerald-500/[0.02] shadow-[0_0_50px_-12px_rgba(16,185,129,0.1)]"
                            )}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className={cn(
                                        "p-3 rounded-2xl transition-all duration-700 group-hover:scale-110",
                                        formData.notifications_enabled ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-white/5 text-zinc-400"
                                    )}>
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <Switch 
                                        checked={formData.notifications_enabled}
                                        disabled={isTogglingNotifications}
                                        className={cn(
                                            formData.notifications_enabled ? "bg-emerald-500 hover:bg-emerald-400" : "bg-white/10",
                                            isTogglingNotifications && "opacity-50 cursor-not-allowed"
                                        )}
                                        onCheckedChange={(checked) => {
                                            const newData = { ...formData, notifications_enabled: checked };
                                            setFormData(newData);
                                            handleSave(undefined, newData);
                                        }}
                                    />
                                </div>
                                <h4 className={cn("font-bold text-lg mb-1 transition-colors", formData.notifications_enabled ? "text-emerald-400" : "text-white")}>Notification Protocol</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed font-medium">Configure how the system alerts you regarding instance health, autonomous scaling events, and billing protocol.</p>
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
                            <ChevronRight className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                        </div>

                        {/* System Info */}
                        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                                <Globe className="w-3 h-3 text-white" /> Infrastructure Edge: North Virginia (US-EAST-1)
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span className="hover:text-primary transition-colors cursor-pointer">Compliance</span>
                                <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
                                <span className="text-white">v2.4.0-prod</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
