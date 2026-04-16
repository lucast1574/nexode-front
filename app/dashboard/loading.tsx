export default function DashboardLoading() {
    return (
        <div className="h-full flex items-center justify-center bg-[#020202]">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
}
