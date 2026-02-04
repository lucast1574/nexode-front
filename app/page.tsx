import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 blur-[150px] rounded-full animate-pulse" />
      </div>

      <main className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase animate-fade-in">
            Next Generation Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            Scale Your Seller Business with <span className="text-primary italic">Precision</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The all-in-one ecosystem for elite sellers. Manage inventory, analyze data, and grow your brand with automated intelligence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button asChild size="lg" className="rounded-full px-8 text-lg h-14 shadow-xl shadow-primary/20">
            <Link href="/services">Explore Services</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-lg h-14 bg-background/50 backdrop-blur-sm">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>

        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">TRUSTED</div>
          <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">PARTNERED</div>
          <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">SCALABLE</div>
          <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">NEXODE</div>
        </div>
      </main>

      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Nexode Technologies. All rights reserved.
      </footer>
    </div>
  );
}
