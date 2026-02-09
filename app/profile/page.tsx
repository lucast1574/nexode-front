"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    User,
    Camera,
    ArrowLeft,
    Save,
    Shield,
    Lock,
    Edit3,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { getAuthUser, setAuthSession } from "@/lib/auth-utils";
import { User as UserType } from "@/lib/types";
import { toast } from "sonner";
import { UserNav } from "@/components/user-nav";

export default function ProfilePage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });

    const router = useRouter();

    useEffect(() => {
        const u = getAuthUser();
        if (!u) {
            router.push("/auth/login");
            return;
        }

        // Wrap in microtasks to avoid synchronous setState in effect warnings
        Promise.resolve().then(() => {
            setUser(u);
            setFormData({
                first_name: u.first_name || "",
                last_name: u.last_name || "",
                email: u.email || "",
            });
            setIsLoading(false);
        });
    }, [router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Mocking API call
        setTimeout(() => {
            if (user) {
                const updatedUser = {
                    ...user,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                };
                setAuthSession(undefined, undefined, updatedUser);
                setUser(updatedUser);
                toast.success("Profile updated successfully!");
            }
            setIsSaving(false);
        }, 1000);
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const initials = (user.first_name?.[0] || "") + (user.last_name?.[0] || "");
    const hasAvatar = user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/"));

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <nav className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-zinc-400" />
                        </Link>
                        <Link href="/" className="text-2xl font-black italic tracking-tighter text-primary">NEXODE</Link>
                    </div>
                    <UserNav />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight mb-2">Account Settings</h1>
                    <p className="text-zinc-500">Manage your profile information and account preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Left Column - Avatar */}
                    <div className="space-y-6">
                        <div className="relative group">
                            <div className="w-48 h-48 rounded-[40px] bg-zinc-900 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative mx-auto md:mx-0">
                                {hasAvatar ? (
                                    <Image
                                        src={user.avatar}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="text-5xl font-black text-zinc-800 uppercase tracking-tighter">{initials}</span>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                                    <Camera className="w-8 h-8 text-white" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Change Photo</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 md:right-auto md:left-40 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-black shadow-xl ring-4 ring-[#050505]">
                                <Edit3 className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="w-4 h-4 text-primary" />
                                <span className="text-zinc-400">Account Status: </span>
                                <span className="font-bold text-emerald-500 uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Verified</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Lock className="w-4 h-4 text-zinc-500" />
                                <span className="text-zinc-400">Auth Method: </span>
                                <span className="font-bold text-zinc-200">Local Auth</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="md:col-span-2 space-y-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 space-y-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-lg font-bold">Personal Information</h3>
                                </div>

                                <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Field>
                                        <FieldLabel>First Name</FieldLabel>
                                        <Input
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="bg-black/50 border-white/10 rounded-2xl h-12"
                                            placeholder="Enter first name"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Last Name</FieldLabel>
                                        <Input
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="bg-black/50 border-white/10 rounded-2xl h-12"
                                            placeholder="Enter last name"
                                        />
                                    </Field>
                                </FieldGroup>

                                <Field>
                                    <FieldLabel>Email Address</FieldLabel>
                                    <div className="relative">
                                        <Input
                                            value={formData.email}
                                            readOnly
                                            className="bg-black/20 border-white/5 text-zinc-500 rounded-2xl h-12 pr-10 cursor-not-allowed"
                                        />
                                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-[10px] text-zinc-600 mt-2 font-medium">Email address cannot be changed for security reasons.</p>
                                </Field>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="rounded-2xl h-12 px-6 font-bold"
                                    asChild
                                >
                                    <Link href="/dashboard">Cancel</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-2xl h-12 px-8 font-bold shadow-lg shadow-primary/20 gap-2"
                                >
                                    {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                                </Button>
                            </div>
                        </form>

                        <div className="bg-red-500/[0.03] border border-red-500/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h3>
                            <p className="text-sm text-zinc-500 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            <Button variant="outline" className="rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/30">
                                Delete Account
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
