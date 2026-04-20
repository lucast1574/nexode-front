export default function DashboardLoading() {
    return (
        <div className="h-full flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6">
                <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
}
