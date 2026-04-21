export default function Home() {
    // proxy.ts handles redirect: authenticated → /dashboard, else → /auth/login
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
