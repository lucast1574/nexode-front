"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
                <Button asChild variant="ghost" className="text-2xl font-black italic tracking-tighter text-primary p-0 h-auto hover:bg-transparent">
                    <Link href="/">NEXODE</Link>
                </Button>
                <div className="flex items-center gap-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Button
                                key={link.href}
                                asChild
                                variant="ghost"
                                className={cn(
                                    "text-sm font-medium rounded-xl",
                                    isActive
                                        ? "text-white font-bold"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                <Link href={link.href}>{link.label}</Link>
                            </Button>
                        );
                    })}
                    {showUserNav && <UserNav />}
                </div>
            </div>
        </nav>
    );
}