"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useModal } from "@/components/ui/modal";
import { PricingTable, CycleToggle, SERVICE_ORDER, type PricingPlan } from "@/components/billing/pricing-table";

interface Subscription {
    status: string;
    service: string;
    plan: { slug: string };
}

export default function ServicesPage() {
    const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
    const [ownedSlugs, setOwnedSlugs] = useState<string[]>([]);
    const [trialsUsed, setTrialsUsed] = useState<string[]>([]);
    const [globalCycle, setGlobalCycle] = useState<"monthly" | "annual">("monthly");
    /** Map of service → selectedSlug, for multi-service bundle checkout. */
    const [selectedTiers, setSelectedTiers] = useState<Record<string, string | null>>({});
    const [activeHash, setActiveHash] = useState<string>("");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const { showAlert } = useModal();

    useEffect(() => {
        const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
        if (hash) {
            setActiveHash(hash);
            setTimeout(() => {
                document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
                const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

                const query = token
                    ? `
                        query GetServicesData {
                            availablePlans { id name slug service price_monthly price_annual features }
                            mySubscriptions { status service plan { slug } }
                            me { trial_used trials_used }
                        }
                    `
                    : `query GetGuestPlans { availablePlans { id name slug service price_monthly price_annual features } }`;

                const response = await fetch(GQL_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ query }),
                });
                const result = await response.json();
                if (!result.data) return;

                setAvailablePlans(result.data.availablePlans || []);

                if (token && result.data.mySubscriptions) {
                    const subs: Subscription[] = result.data.mySubscriptions.filter((s: Subscription) =>
                        ["ACTIVE", "TRIALING"].includes(s.status)
                    );
                    setOwnedSlugs(subs.map((s) => s.plan.slug));
                }
                if (token && result.data.me) {
                    setTrialsUsed(
                        result.data.me.trial_used
                            ? Array.from(SERVICE_ORDER)
                            : result.data.me.trials_used || []
                    );
                }
            } catch (err) {
                console.error("Services fetch error:", err);
            }
        };
        fetchData();
    }, []);

    const handleSelect = (service: string, slug: string | null) => {
        setSelectedTiers((prev) => ({ ...prev, [service]: slug }));
    };

    const selectedItems = Object.entries(selectedTiers)
        .filter(([, slug]) => !!slug)
        .map(([service, slug]) => {
            const plan = availablePlans.find((p) => p.slug === slug);
            return { service, slug: slug as string, plan };
        });

    const totalPrice = selectedItems.reduce((acc, { plan }) => {
        if (!plan) return acc;
        return acc + (globalCycle === "monthly" ? plan.price_monthly : plan.price_annual);
    }, 0);

    /** Bundle preview: cheapest item is free if 2+ services are selected. */
    const bundleDiscountTotal = (() => {
        if (selectedItems.length < 2) return totalPrice;
        const prices = selectedItems
            .map(({ plan }) =>
                plan ? (globalCycle === "monthly" ? plan.price_monthly : plan.price_annual) : 0
            )
            .sort((a, b) => a - b);
        // Cheapest free
        return prices.slice(1).reduce((a, b) => a + b, 0);
    })();

    const handleCheckout = async () => {
        if (selectedItems.length === 0) return;
        setCheckoutLoading(true);
        try {
            const items = selectedItems.map(({ slug }) => ({ planSlug: slug, billingCycle: globalCycle }));
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
            const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

            const query = token
                ? `mutation CreateCheckout($items: [CheckoutItemInput!]!, $allowPromotionCodes: Boolean) {
                       createCheckoutSession(items: $items, allowPromotionCodes: $allowPromotionCodes)
                   }`
                : `mutation CreateGuestCheckout($items: [CheckoutItemInput!]!, $allowPromotionCodes: Boolean) {
                       createGuestCheckoutSession(items: $items, allowPromotionCodes: $allowPromotionCodes)
                   }`;

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ query, variables: { items, allowPromotionCodes: true } }),
            });
            const result = await response.json();
            if (result.errors) {
                showAlert({ title: "Checkout Error", message: result.errors[0].message, type: "error" });
                return;
            }
            const url = token
                ? result.data?.createCheckoutSession
                : result.data?.createGuestCheckoutSession;
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Checkout failed";
            showAlert({ title: "Checkout Failed", message, type: "error" });
        } finally {
            setCheckoutLoading(false);
        }
    };

    /** Filter visible services if a hash is set (deep-link to a single service tab). */
    const visibleServices = activeHash
        ? SERVICE_ORDER.filter((s) => s === activeHash)
        : SERVICE_ORDER;

    /** Trial preview for the cart: services that qualify in this selection. */
    const trialEligibleInCart = selectedItems.filter(({ plan, service }) => {
        if (!plan || trialsUsed.includes(service)) return false;
        const cheapest = availablePlans
            .filter((p) => p.service === service && p.price_monthly > 0 && (p.features as Record<string, unknown>)?.admin_only !== "true")
            .sort((a, b) => a.price_monthly - b.price_monthly)[0];
        return cheapest?.slug === plan.slug;
    });

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Services</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex-1" />
                <Button render={<Link href="/dashboard/billing" />} nativeButton={false} variant="outline" className="gap-2">
                    Manage Billing
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Launch Your Infrastructure</h1>
                    <p className="text-muted-foreground">
                        Pick high-performance services for your hosting environment. Mix &amp; match — the cheapest tier of each service includes a 7-day free trial, and bundling 2+ services makes the cheapest one free forever.
                    </p>
                </div>

                <div className="flex items-center justify-between mb-6">
                    {activeHash ? (
                        <Button variant="outline" size="sm" onClick={() => { setActiveHash(""); window.history.replaceState(null, "", "/dashboard/services"); }}>
                            ← Show all services
                        </Button>
                    ) : <div />}
                    <CycleToggle value={globalCycle} onChange={setGlobalCycle} />
                </div>

                <div className="pb-32">
                    {visibleServices.map((service) => (
                        <section key={service} id={service} className="scroll-mt-24">
                            <PricingTable
                                service={service}
                                plans={availablePlans}
                                cycle={globalCycle}
                                ownedSlugs={ownedSlugs}
                                trialsUsed={trialsUsed}
                                selectionMode
                                selectedSlug={selectedTiers[service] || null}
                                onSelect={(slug) => handleSelect(service, slug)}
                            />
                        </section>
                    ))}
                </div>
            </div>

            {/* Floating cart */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl animate-in slide-in-from-bottom-full duration-500">
                    <Card className="bg-card border-border rounded-2xl shadow-2xl p-0">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6 px-4">
                                <div className="bg-primary/20 p-3 rounded-lg relative">
                                    <Zap className="w-6 h-6 text-primary" />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background">
                                        {selectedItems.length}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                        Total {globalCycle === "monthly" ? "Monthly" : "Annual"}
                                        {trialEligibleInCart.length > 0 && (
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
                                                Trial available
                                            </span>
                                        )}
                                        {selectedItems.length >= 2 && (
                                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-bold">
                                                Bundle: cheapest free
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        {selectedItems.length >= 2 ? (
                                            <>
                                                <span className="text-3xl font-bold text-foreground">${bundleDiscountTotal}</span>
                                                <span className="text-sm text-muted-foreground line-through">${totalPrice}</span>
                                                <span className="text-sm font-normal text-muted-foreground">/{globalCycle === "monthly" ? "mo" : "yr"}</span>
                                            </>
                                        ) : (
                                            <span className="text-3xl font-bold text-foreground">
                                                ${totalPrice}
                                                <span className="text-sm font-normal text-muted-foreground">/{globalCycle === "monthly" ? "mo" : "yr"}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto px-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedTiers({})}
                                    className="cursor-pointer hover:text-primary hover:bg-primary/10"
                                >
                                    Clear All
                                </Button>
                                <Button
                                    size="lg"
                                    disabled={checkoutLoading}
                                    className="rounded-lg h-14 px-10 gap-2 text-lg font-bold flex-1 sm:flex-none cursor-pointer hover:opacity-90"
                                    onClick={handleCheckout}
                                >
                                    {checkoutLoading ? "Redirecting…" : (trialEligibleInCart.length > 0 ? "Start Trial" : "Deploy Now")}
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedItems.length === 0 && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button onClick={() => document.getElementById(SERVICE_ORDER[0])?.scrollIntoView({ behavior: "smooth" })} className="gap-2 shadow-lg">
                        <Plus className="size-4" /> Pick a service
                    </Button>
                </div>
            )}
        </>
    );
}
