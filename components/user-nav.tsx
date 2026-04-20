"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { getAuthUser, signOutFromServer } from "@/lib/auth-utils";
import { User as UserType } from "@/lib/types";

export function UserNav() {
    const [user, setUser] = useState<UserType | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const u = getAuthUser();

        // Wrap in microtasks to avoid synchronous setState in effect warnings
        // while still ensuring it happens immediately after mount.
        Promise.resolve().then(() => {
            setMounted(true);
            if (u) setUser(u);
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOutFromServer();
        router.push("/auth/login");
        router.refresh();
    };

    if (!mounted || !user) return null;

    const initials = (user.first_name?.[0] || "") + (user.last_name?.[0] || "");
    const hasAvatar = user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/"));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id="btn-user-menu"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-border overflow-hidden hover:border-primary/50 transition-all focus:outline-none bg-card group"
            >
                {hasAvatar ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={user.avatar}
                            alt={user.first_name}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {initials || <UserIcon className="w-5 h-5" />}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl bg-card border border-border shadow-2xl z-[100] overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-bold text-foreground">
                            {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {user.email}
                        </p>
                    </div>

                    <div className="p-1">
                        <Link
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-muted transition-all"
                        >
                            <UserIcon className="w-4 h-4" />
                            <span>Settings</span>
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-muted transition-all"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </Link>
                    </div>

                    <div className="p-1 border-t border-white/5 mt-1">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
