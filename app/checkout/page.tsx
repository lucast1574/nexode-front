"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Zap, Database, Cpu, Workflow, ArrowRight, Shield, Globe, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/user-nav";
import { getAccessToken } from "@/lib/auth-utils";

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
                features: ["3 Workflows", "Daily Logs"]
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
                features: ["50 Workflows", "HA Ready"]
            },
            {
                name: "Ultra",
                slug: "n8n-ultra",
                price: 40,
                specs: { "EXECS": "50,000 /mo", "TYPE": "4GB RAM" },
                features: ["Max Throughput", "Enterprise SLA"]
            },
        ]
    },
    {
        id: "database",
        title: "Database",
        description: "High-availability MySQL and PostgreSQL instances for your mission-critical data.",
        icon: Database,
        color: "bg-purple-500",
        highlights: ["Automated Backups", "Vertical Scaling", "Metrics Dashboard", "Private Networking"],
        tiers: [
            {
                name: "Basic",
                slug: "db-tier-1",
                price: 1,
                specs: { "RAM": "Shared", "STORAGE": "0.25 GB" },
                features: ["Daily Backups", "Shared CPU"]
            },
            {
                name: "Standard",
                slug: "db-tier-2",
                price: 5,
                specs: { "RAM": "Shared", "STORAGE": "1 GB" },
                features: ["Priority Support", "Point-in-time Recovery"]
            },
            {
                name: "Performance",
                slug: "db-tier-3",
                price: 10,
                specs: { "RAM": "Shared", "STORAGE": "5 GB" },
                features: ["24/7 Monitoring", "High Availability"]
            },
            {
                name: "Ultra",
                slug: "db-tier-4",
                price: 20,
                specs: { "RAM": "Shared", "STORAGE": "10 GB" },
                features: ["Enterprise SLA", "Dedicated instances"]
            },
        ]
    },
    {
        id: "compute",
        title: "Compute",
        description: "Liquid-cooled virtual servers built for extreme high-frequency performance.",
        icon: Cpu,
        color: "bg-blue-500",
        highlights: ["NVMe Storage", "Global Edge", "Zero-downtime upscaling", "Advanced DDoS Protection"],
        tiers: [
            {
                name: "Instance Nano",
                slug: "compute-basic",
                price: 15,
                specs: { "CPU": "1 vCPU", "RAM": "2 GB", "NETWORK": "1 TB" },
                features: ["Fast SSDs", "Public IP"]
            },
            {
                name: "Instance Pro",
                slug: "compute-pro",
                price: 45,
                specs: { "CPU": "4 vCPU", "RAM": "8 GB", "NETWORK": "5 TB" },
                features: ["Optimized I/O", "Snapshots", "Premium Support"]
            },
        ]
    }
];

export default function CheckoutPage() {
    const [selectedTiers, setSelectedTiers] = useState<Record<string, string | null>>({
        database: null,
        compute: null,
        n8n: null,
    });
    const [loading, setLoading] = useState(false);
    const [currentSubSlugs, setCurrentSubSlugs] = useState<string[]>([]);

    useEffect(() => {
        const fetchCurrentSubs = async () => {
            const token = getAccessToken();
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
                    const activeSlugs = result.data.mySubscriptions
                        .filter((s: { status: string; plan?: { slug: string } }) => s.status === 'ACTIVE')
                        .map((s: { status: string; plan?: { slug: string } }) => s.plan?.slug)
                        .filter((slug: string | undefined): slug is string => !!slug);
                    setCurrentSubSlugs(activeSlugs);
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
        setLoading(true);
        try {
            const items = Object.values(selectedTiers)
                .filter(Boolean)
                .map(slug => ({
                    planSlug: slug,
                    billingCycle: "monthly"
                }));

            if (items.length === 0) return;

            // In a real app, we'd get the token from localStorage/cookies
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
            const mutation = `
                mutation CreateCheckout($items: [CheckoutItemInput!]!) {
                    createCheckoutSession(items: $items)
                }
            `;

            const token = getAccessToken();

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { items }
                }),
            });

            const result = await response.json();

            if (result.errors) {
                console.error("GraphQL Errors for authenticated session:", result.errors);

                // Fallback to guest checkout if authenticated session failed
                // Attempt to get user email from localStorage to preserve session linkage
                const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
                const userObj = storedUser ? JSON.parse(storedUser) : null;
                const userEmail = userObj?.email;

                console.warn(`Attempting fallback to Guest Checkout. Preserved email: ${userEmail || 'None'}`);

                const guestMutation = `
                    mutation CreateGuestCheckout($items: [CheckoutItemInput!]!, $email: String) {
                        createGuestCheckoutSession(items: $items, email: $email)
                    }
                `;
                const guestRes = await fetch(GQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: guestMutation,
                        variables: { items, email: userEmail }
                    }),
                });
                const guestResult = await guestRes.json();
                if (guestResult.data?.createGuestCheckoutSession) {
                    window.location.href = guestResult.data.createGuestCheckoutSession;
                    return;
                }
                alert(`Checkout failed. Error: ${result.errors[0]?.message || 'Unknown error'}`);
                return;
            }

            const checkoutUrl = result.data.createCheckoutSession;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            alert("Checkout failed. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
            </div>

            <nav className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-black italic tracking-tighter text-primary">NEXODE</Link>
                    <div className="flex items-center gap-6">
                        <Link href="/services" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Marketplace</Link>
                        <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
                        <UserNav />
                    </div>
                </div>
            </nav>

            <header className="relative z-10 pt-20 pb-16 px-6 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                    Provision Your <span className="text-primary italic underline decoration-primary/30 decoration-8 underline-offset-8">Infrastructure</span>
                </h1>
                <p className="text-lg text-zinc-400 leading-relaxed">
                    Configure your high-frequency hosting environment. Select high-availability instances tailored for your mission-critical workload.
                </p>
            </header>

            <main className="relative z-10 pb-40 px-6 max-w-5xl mx-auto space-y-16">
                {SERVICES.map((service) => (
                    <div key={service.id} className="space-y-6">
                        <div className="flex items-center gap-4 border-l-4 border-primary pl-6">
                            <div className={cn("p-2 rounded-xl", service.color)}>
                                <service.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{service.title}</h2>
                                <p className="text-sm text-zinc-500">{service.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {service.tiers.filter(t => !currentSubSlugs.includes(t.slug)).map((tier) => {
                                const isSelected = selectedTiers[service.id] === tier.slug;
                                return (
                                    <button
                                        key={tier.slug}
                                        onClick={() => handleSelectTier(service.id, tier.slug)}
                                        className={cn(
                                            "relative flex flex-col p-6 rounded-[24px] border transition-all duration-300 text-left group overflow-hidden",
                                            isSelected
                                                ? "bg-white/10 border-primary ring-2 ring-primary/20 shadow-2xl shadow-primary/10"
                                                : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                                        )}
                                    >
                                        <div className="mb-4">
                                            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{tier.name}</div>
                                            <div className="text-3xl font-black">${tier.price}<span className="text-xs font-normal text-zinc-500">/mo</span></div>
                                        </div>

                                        <div className="space-y-3 mb-6 flex-1">
                                            {Object.entries(tier.specs).map(([label, value]) => (
                                                <div key={label} className="flex items-center justify-between text-xs">
                                                    <span className="text-zinc-500 font-medium">{label}</span>
                                                    <span className="font-bold">{value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={cn(
                                            "mt-auto py-2 px-4 rounded-xl text-xs font-bold text-center transition-all",
                                            isSelected ? "bg-primary text-white" : "bg-white/5 text-zinc-400 group-hover:bg-white/10"
                                        )}>
                                            {(() => {
                                                if (isSelected) return "Selected";

                                                const activeTierSlug = service.tiers.find(t => currentSubSlugs.includes(t.slug))?.slug;
                                                if (activeTierSlug) {
                                                    const activeTier = service.tiers.find(t => t.slug === activeTierSlug);
                                                    if (activeTier) {
                                                        return tier.price > activeTier.price ? "Upgrade Plan" : "Downgrade Plan";
                                                    }
                                                }
                                                return "Select Tier";
                                            })()}
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary rotate-45 flex items-end justify-center pb-1">
                                                <Check className="w-3 h-3 text-white stroke-[4] -rotate-45" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </main>

            {/* Floating Summary Bar */}
            <div className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl transition-all duration-500",
                selectedCount > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
            )}>
                <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
                    <div className="flex items-center gap-4 px-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center relative">
                            <Zap className="w-6 h-6 text-primary" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900">
                                {selectedCount}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Hosting Commitment</div>
                            <div className="text-2xl font-black">${totalPrice}</div>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full sm:w-auto rounded-[20px] h-14 px-8 gap-3 text-lg font-bold shadow-xl shadow-primary/20 transition-transform active:scale-95 bg-primary hover:bg-primary/90 text-white"
                    >
                        {loading ? "Provisioning..." : "Pay & Deploy Instance"} <div className="flex items-center gap-1 border-l border-black/10 pl-3 ml-1"><CreditCard className="w-5 h-5" /><ArrowRight className="w-4 h-4" /></div>
                    </Button>
                </div>
            </div>

            <footer className="relative z-10 py-12 px-6 border-t border-white/5 text-center text-zinc-400 text-sm">
                <div className="flex items-center justify-center gap-8 mb-6 text-zinc-400 flex-wrap">
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Trusted Enterprise Grade</div>
                    <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Secure Stripe Payment</div>
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Global Infrastructure</div>
                </div>
                © {new Date().getFullYear()} Nexode Technologies. All rights reserved.
            </footer>
        </div>
    );
}
