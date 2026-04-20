"use client";

import React, { useState, useEffect } from "react";
import { Check, Database, Cpu, Zap, ArrowRight, Shield, Globe, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { useModal } from "@/components/ui/modal";

interface Tier {
    name: string;
    slug: string;
    price: number;
    specs: Record<string, string>;
    features: string[];
}

interface Service {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    tiers: Tier[];
    highlights: string[];
}

const SERVICES: Service[] = [
    {
        id: "n8n",
        title: "n8n Automation",
        description: "Self-hosted workflow automation. Connect everything and design complex logic with ease.",
        icon: Workflow,
        color: "bg-red-500",
        highlights: ["Nodes for 400+ apps", "Self-hosted privacy", "Unlimited triggers", "Custom JS nodes"],
        tiers: [
            {
                name: "Basic",
                slug: "n8n-basic",
                price: 5,
                specs: { "EXECS": "1,000 /mo", "TYPE": "Shared" },
                features: ["3 Workflows", "Standard Support"]
            },
            {
                name: "Standard",
                slug: "n8n-standard",
                price: 10,
                specs: { "EXECS": "5,000 /mo", "TYPE": "1GB RAM" },
                features: ["10 Workflows", "Priority Support"]
            },
            {
                name: "Pro",
                slug: "n8n-pro",
                price: 20,
                specs: { "EXECS": "20,000 /mo", "TYPE": "2GB RAM" },
                features: ["50 Workflows", "24/7 Support"]
            },
            {
                name: "Ultra",
                slug: "n8n-ultra",
                price: 40,
                specs: { "EXECS": "50,000 /mo", "TYPE": "4GB RAM" },
                features: ["Unlimited Workflows", "Enterprise SLA"]
            },
        ]
    },
    {
        id: "database",
        title: "Database",
        description: "Provision PostgreSQL, MongoDB and Redis databases with zero setup — ready to query in seconds.",
        icon: Database,
        color: "bg-purple-500",
        highlights: ["14 days of metrics", "Expandable storage options", "Connect via private or public network"],
        tiers: [
            {
                name: "Tier 1",
                slug: "db-tier-1",
                price: 1,
                specs: { "RAM & CPU": "Shared", "STORAGE": "0.25 GB" },
                features: ["Standard Support", "Basic Backups"]
            },
            {
                name: "Tier 2",
                slug: "db-tier-2",
                price: 5,
                specs: { "RAM & CPU": "Shared", "STORAGE": "1 GB" },
                features: ["Priority Support", "Daily Backups"]
            },
            {
                name: "Tier 3",
                slug: "db-tier-3",
                price: 10,
                specs: { "RAM & CPU": "Shared", "STORAGE": "5 GB" },
                features: ["24/7 Support", "Hourly Backups"]
            },
            {
                name: "Tier 4",
                slug: "db-tier-4",
                price: 20,
                specs: { "RAM & CPU": "Shared", "STORAGE": "10 GB" },
                features: ["Enterprise Support", "Real-time Replication"]
            },
        ]
    },
    {
        id: "compute",
        title: "Compute",
        description: "High-performance virtual machines for your applications with lightning fast SSD storage.",
        icon: Cpu,
        color: "bg-blue-500",
        highlights: ["NVMe SSDs", "Global Edge Network", "Auto-scaling ready", "DDoS Protection"],
        tiers: [
            {
                name: "Compute Basic",
                slug: "compute-basic",
                price: 15,
                specs: { "CPU": "1 vCPU", "RAM": "2 GB", "BANDWIDTH": "1 TB" },
                features: ["Custom Subdomain", "Auto SSL"]
            },
            {
                name: "Compute Pro",
                slug: "compute-pro",
                price: 45,
                specs: { "CPU": "4 vCPU", "RAM": "8 GB", "BANDWIDTH": "5 TB" },
                features: ["Custom Domain", "Auto SSL", "Priority Support"]
            },
        ]
    }
];

export default function ServicesPage() {
    const [selectedTiers, setSelectedTiers] = useState<Record<string, string | null>>({
        database: null,
        compute: null,
        n8n: null,
    });
    const { showAlert } = useModal();

    useEffect(() => {
        const fetchCurrentSubs = async () => {
            const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
            if (!token) return;

            try {
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
                const query = `
                    query GetUserSubs {
                        mySubscriptions {
                            status
                            plan {
                                slug
                            }
                        }
                    }
                `;
                const response = await fetch(GQL_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ query }),
                });
                const result = await response.json();
                if (result.data?.mySubscriptions) {
                    // Kept for analytics or future use if needed, but not actively used to block UI
                }
            } catch (err) {
                console.error("Error fetching current subs:", err);
            }
        };

        fetchCurrentSubs();
    }, []);

    const handleSelectTier = (serviceId: string, tierSlug: string) => {
        setSelectedTiers((prev) => ({
            ...prev,
            [serviceId]: prev[serviceId] === tierSlug ? null : tierSlug,
        }));
    };

    const totalPrice = Object.entries(selectedTiers).reduce((acc, [serviceId, tierSlug]) => {
        if (!tierSlug) return acc;
        const service = SERVICES.find(s => s.id === serviceId);
        const tier = service?.tiers.find(t => t.slug === tierSlug);
        return acc + (tier?.price || 0);
    }, 0);

    const selectedCount = Object.values(selectedTiers).filter(Boolean).length;

    const handleCheckout = async () => {
        try {
            const items = Object.values(selectedTiers)
                .filter(Boolean)
                .map(slug => ({
                    planSlug: slug,
                    billingCycle: "monthly"
                }));

            if (items.length === 0) return;

            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
            
            const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
            
            let query = `
                mutation CreateGuestCheckout($items: [CheckoutItemInput!]!) {
                    createGuestCheckoutSession(items: $items)
                }
            `;
            
            if (token) {
                query = `
                    mutation CreateCheckout($items: [CheckoutItemInput!]!) {
                        createCheckoutSession(items: $items)
                    }
                `;
            }

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                body: JSON.stringify({
                    query: query,
                    variables: { items }
                }),
            });

            const result = await response.json();

            if (result.errors) {
                console.error("GraphQL Errors:", result.errors);
                showAlert({
                    title: "Checkout Error",
                    message: "Error: " + result.errors[0].message,
                    type: "error"
                });
                return;
            }

            const checkoutUrl = token ? result.data.createCheckoutSession : result.data.createGuestCheckoutSession;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            showAlert({
                title: "Checkout Failed",
                message: "Checkout failed. Is the backend running?",
                type: "error"
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">

            <PublicNav />

            <header className="relative z-10 pt-20 pb-12 px-6 text-center max-w-5xl mx-auto">
                <Badge variant="outline" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border-border text-primary text-xs font-bold tracking-wider uppercase mb-6">
                    <Zap className="w-3 h-3 fill-current" /> Scalable Infrastructure
                </Badge>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                    Launch Your <span className="text-primary italic">Infrastructure</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Select high-performance building blocks for your hosting environment. Mix and match services to scale your system in real-time.
                </p>
            </header>

            <main className="relative z-10 pb-32 px-6 max-w-6xl mx-auto space-y-24">
                {SERVICES.map((service) => (
                    <section key={service.id} id={service.id} className="space-y-10 scroll-mt-24">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4 max-w-2xl">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-lg shadow-lg", service.color)}>
                                        <service.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-4xl font-bold">{service.title}</h2>
                                </div>
                                <p className="text-muted-foreground text-lg">{service.description}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                {service.highlights.map((highlight, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        {highlight}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid grid-cols-12 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                <div className="col-span-4 md:col-span-3">Type</div>
                                <div className="hidden md:block col-span-3">Performance</div>
                                <div className="col-span-4 md:col-span-3 text-center md:text-left">Details</div>
                                <div className="col-span-4 md:col-span-3 text-right">Price per month</div>
                            </div>

                            <div className="space-y-3">
                                {service.tiers.map((tier) => {
                                    const isSelected = selectedTiers[service.id] === tier.slug;
                                    return (
                                        <Card
                                            key={tier.slug}
                                            className={cn(
                                                "cursor-pointer rounded-lg p-0 transition-all duration-300",
                                                isSelected
                                                    ? "bg-white/10 border-primary ring-1 ring-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                                    : "bg-muted border-border hover:border-border hover:bg-white/[0.05]"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleSelectTier(service.id, tier.slug)}
                                                className="w-full text-left grid grid-cols-12 items-center px-6 py-6"
                                            >
                                                <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                        isSelected ? "bg-primary border-primary" : "border-white/20 group-hover:border-white/40"
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                                    </div>
                                                    <span className="font-bold text-lg">{tier.name}</span>
                                                </div>

                                                <div className="hidden md:block col-span-3 text-muted-foreground font-medium">
                                                    {Object.entries(tier.specs)[0][1]}
                                                </div>

                                                <div className="col-span-4 md:col-span-3 flex md:block flex-col items-center">
                                                    <span className="text-muted-foreground text-sm font-medium">
                                                        {Object.entries(tier.specs)[1][1]}
                                                    </span>
                                                </div>

                                                <div className="col-span-4 md:col-span-3 text-right">
                                                    <span className="text-2xl font-black text-white">${tier.price} <span className="text-sm font-normal text-zinc-500">/m</span></span>
                                                </div>
                                            </button>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                ))}
            </main>

            {selectedCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-6 animate-in slide-in-from-bottom-full duration-500">
                    <Card className="max-w-4xl mx-auto bg-muted backdrop-blur-2xl border-border rounded-xl shadow-2xl p-0">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6 px-4">
                                <div className="bg-primary/20 p-3 rounded-lg relative">
                                    <Zap className="w-6 h-6 text-primary" />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white/20">
                                        {selectedCount}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground font-medium">Selected Services Monthly Total</div>
                                    <div className="text-3xl font-black text-white">${totalPrice}<span className="text-sm font-normal text-zinc-500">/mo</span></div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto px-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedTiers({ database: null, compute: null, n8n: null })}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    size="lg"
                                    className="rounded-lg h-14 px-10 gap-2 text-lg font-bold shadow-xl shadow-primary/20 flex-1 sm:flex-none"
                                    onClick={handleCheckout}
                                >
                                    Deploy Now <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <footer className="relative z-10 bg-muted border-t border-border py-24 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <Card className="bg-transparent border-0 shadow-none p-0">
                        <CardContent className="p-0 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Secure by Design</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Every service includes advanced DDoS protection and isolated environments to keep your data safe.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-transparent border-0 shadow-none p-0">
                        <CardContent className="p-0 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Globe className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Global Presence</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Deploy your infrastructure in seconds across our multi-region edge locations globally.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-transparent border-0 shadow-none p-0">
                        <CardContent className="p-0 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Instantly Scalable</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Need more power? Upgrade any service instantly with zero downtime or complex migrations.
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div className="mt-24 pt-12 border-t border-border text-center text-muted-foreground text-sm">
                    © {new Date().getFullYear()} Nexode Technologies. All rights reserved.
                </div>
            </footer>
        </div>
    );
}