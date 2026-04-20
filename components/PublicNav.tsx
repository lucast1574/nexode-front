"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"

interface PublicNavProps {
    showUserNav?: boolean
}

export function PublicNav({ showUserNav = true }: PublicNavProps) {
    const pathname = usePathname()

    const links = [
        { href: "/services", label: "Services" },
        { href: "/checkout", label: "Subscriptions" },
        { href: "/dashboard", label: "Dashboard" },
    ]

    return (
        <nav className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo/logo_white.svg"
                        alt="Nexode"
                        width={90}
                        height={24}
                        className="h-6 w-auto"
                        priority
                    />
                </Link>
                <div className="flex items-center gap-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href
                        return (
                            <Button
                                key={link.href}
                                render={<Link href={link.href} />}
                                nativeButton={false}
                                variant="ghost"
                                className={cn(
                                    "text-sm font-medium rounded-xl",
                                    isActive
                                        ? "text-white font-bold"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                {link.label}
                            </Button>
                        )
                    })}
                    {showUserNav && <UserNav />}
                </div>
            </div>
        </nav>
    )
}