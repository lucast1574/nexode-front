"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background">
            {/* Background Pattern/Illustration */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
            </div>

            {/* Content */}
            <div className="relative z-10 grid min-h-screen grid-cols-1 md:grid-cols-2 w-full">
                {/* Left Side - Auth Form */}
                <div className="flex flex-col justify-center p-4 md:p-8 lg:p-12 h-full">
                    <div className="w-full max-w-[450px] mx-auto">
                        <div className="mb-8 flex justify-center md:justify-start">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                                    N
                                </div>
                                <span className="text-2xl font-black tracking-tighter">NEXODE</span>
                            </Link>
                        </div>

                        <Card className="border-none shadow-none bg-transparent">
                            <CardContent className="p-0">
                                <main className="w-full">{children}</main>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Side - Visual Content */}
                <div className="hidden md:flex items-center justify-center p-8 bg-muted/30">
                    <div className="w-full max-w-lg space-y-8 text-center">
                        <div className="relative aspect-square w-full max-w-[400px] mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-3xl blur-2xl animate-pulse" />
                            <div className="relative h-full w-full bg-card border border-border/50 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                                        <div className="w-12 h-12 bg-primary rounded-lg animate-bounce" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Boost Your Business</h2>
                                    <p className="text-muted-foreground max-w-[300px]">
                                        The most powerful platform to manage and grow your seller account.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Join thousands of sellers</h3>
                            <p className="text-sm text-muted-foreground">Nexode provides the tools you need to succeed in the digital marketplace.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
