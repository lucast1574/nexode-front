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
        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-background">
            <div className="size-20 bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-8">
                <AlertTriangle className="size-10 text-destructive" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-4 text-foreground">
                Something went wrong
            </h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                An unexpected error occurred while loading this page. This has been logged automatically.
            </p>
            <div className="flex gap-4">
                <Button
                    onClick={reset}
                    className="gap-2 font-bold shadow-lg shadow-primary/20"
                >
                    <RefreshCw className="size-4" /> Try Again
                </Button>
                <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/dashboard")}
                    className="font-bold border-border hover:bg-muted"
                >
                    Back to Dashboard
                </Button>
            </div>
            {error.digest && (
                <p className="text-[10px] text-muted-foreground mt-8 font-mono">
                    Error ID: {error.digest}
                </p>
            )}
        </div>
    );
}