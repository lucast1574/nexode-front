"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Dashboard Error]", error);
    }, [error]);

    return (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[#020202]">
            <div className="w-20 h-20 rounded-[32px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
                <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-4 text-white">
                Something went wrong
            </h2>
            <p className="text-zinc-500 max-w-md mb-8 leading-relaxed">
                An unexpected error occurred while loading this page. This has been logged automatically.
            </p>
            <div className="flex gap-4">
                <Button
                    onClick={reset}
                    className="rounded-2xl h-12 px-8 gap-2 font-bold shadow-lg shadow-primary/20"
                >
                    <RefreshCw className="w-4 h-4" /> Try Again
                </Button>
                <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/dashboard")}
                    className="rounded-2xl h-12 px-8 font-bold border-white/10 hover:bg-white/5"
                >
                    Back to Dashboard
                </Button>
            </div>
            {error.digest && (
                <p className="text-[10px] text-zinc-600 mt-8 font-mono">
                    Error ID: {error.digest}
                </p>
            )}
        </div>
    );
}
