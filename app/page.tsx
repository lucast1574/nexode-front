import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 blur-[150px] rounded-full animate-pulse" />
            </div>

            <main className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto space-y-12">
                <div className="space-y-6">
                    <Badge variant="outline" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border-primary/20 text-primary text-xs font-bold tracking-wider uppercase animate-fade-in">
                        Next Generation Platform
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                        Scale Your{" "}
                        <span className="text-primary italic">Infrastructure</span>{" "}
                        with Precision
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Enterprise-grade hosting for mission-critical applications.
                        Deploy high-performance servers, manage databases, and scale
                        your global footprint with ease.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Button
                        id="btn-home-launch"
                        render={<Link href="/services" />}
                        size="lg"
                        className="rounded-full px-8 text-lg h-14 shadow-xl shadow-primary/20"
                    >
                        Explore Services
                    </Button>
                    <Button
                        id="btn-home-signin"
                        render={<Link href="/auth/login" />}
                        variant="outline"
                        size="lg"
                        className="rounded-full px-8 text-lg h-14 bg-background/50 backdrop-blur-sm"
                    >
                        Sign In
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground -mt-6">
                    Already have an account?{" "}
                    <Link
                        href="/auth/login"
                        className="text-primary hover:underline font-medium"
                    >
                        Sign in
                    </Link>
                </p>

                <Card className="bg-transparent border-0 shadow-none p-0 w-full">
                    <CardContent className="p-0">
                        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">
                                TRUSTED
                            </div>
                            <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">
                                PARTNERED
                            </div>
                            <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">
                                SCALABLE
                            </div>
                            <div className="flex items-center justify-center font-bold text-xl tracking-tighter italic">
                                NEXODE
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <footer className="absolute bottom-8 text-sm text-muted-foreground">
                © {new Date().getFullYear()} Nexode Technologies. All rights
                reserved.
            </footer>
        </div>
    );
}