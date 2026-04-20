"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push("/auth/login");
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm animate-pulse">Redirecting to login...</p>
            </div>
        </div>
    );
}