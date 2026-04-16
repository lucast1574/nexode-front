"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/user-nav";

interface PublicNavProps {
    showUserNav?: boolean;
}

export function PublicNav({ showUserNav = true }: PublicNavProps) {
    const pathname = usePathname();

    const links = [
        { href: "/services", label: "Services" },
        { href: "/checkout", label: "Subscriptions" },
        { href: "/dashboard", label: "Dashboard" },
    ];

    return (
        <nav className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-2xl font-black italic tracking-tighter text-primary"
                >
                    NEXODE
                </Link>
                <div className="flex items-center gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors",
                                pathname === link.href
                                    ? "text-white font-bold"
                                    : "text-zinc-400 hover:text-white"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {showUserNav && <UserNav />}
                </div>
            </div>
        </nav>
    );
}
