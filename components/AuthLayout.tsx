"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"

interface AuthLayoutProps {
    children: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
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
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        {children}
                    </div>
                </div>
            </div>
            <div className="relative hidden overflow-hidden lg:block">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                >
                    <source src="/bg/bg_auth.mp4" type="video/mp4" />
                </video>
            </div>
        </div>
    )
}

export default AuthLayout