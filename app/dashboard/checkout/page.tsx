"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Database, Cpu, Workflow, ArrowRight, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";

interface Subscription {
    id: string;
    service: string;
    status: string;
    billing_cycle: string;
    created_on: string;
    plan: {
        name: string;
        price_monthly: number;
        price_annual: number;
    };
}

export default function CheckoutPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const { showAlert } = useModal();

    useEffect(() => {
        const fetchCurrentSubs = async () => {
            const token = getAccessToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
                const query = `
                    query GetUserSubs {
                        mySubscriptions {
                            id
                            service
                            status
                            billing_cycle
                            created_on
                            plan {
                                name
                                price_monthly
                                price_annual
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
                    const activeSubs = result.data.mySubscriptions
                        .filter((s: { status: string; service: string }) => s.status === 'ACTIVE' && s.service !== 'nexus');
                    setSubscriptions(activeSubs);
                }
            } catch (err) {
                console.error("Error fetching current subs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentSubs();
    }, []);

    const handleManageBilling = async () => {
        try {
            const token = getAccessToken();
            if (!token) {
                showAlert({
                    title: "Authentication Required",
                    message: "Please log in to manage your subscriptions.",
                    type: "warning"
                });
                return;
            }
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

            const mutation = `
                mutation {
                    createCustomerPortalSession
                }
            `;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ query: mutation }),
            });
            const result = await res.json();
            if (result.data?.createCustomerPortalSession) {
                window.location.href = result.data.createCustomerPortalSession;
            } else {
                showAlert({
                    title: "Portal Error",
                    message: "Could not open billing portal. Do you have an active Stripe subscription?",
                    type: "warning"
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Checkout</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Manage Your Infrastructure</h1>
                    <p className="text-muted-foreground">Review and manage your active subscriptions and billing.</p>
                </div>

            <main className="relative z-10 pb-12">
                <Card className="border-border mb-12">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center gap-3">
                            <Database className="size-6 text-primary" /> Active Subscriptions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        ) : subscriptions.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                                <div className="mx-auto size-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Shield className="size-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No active subscriptions</h3>
                                <p className="text-muted-foreground mb-6">Subscribe to a plan to start deploying infrastructure.</p>
                                <Button render={<Link href="/dashboard/services" />} nativeButton={false} variant="outline">
                                    Explore Services
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {subscriptions.map((sub, index) => {
                                    let Icon = Database;
                                    let color = "text-purple-400 bg-purple-500/10";
                                    if (sub.service === "n8n") {
                                        Icon = Workflow;
                                        color = "text-red-400 bg-red-500/10";
                                    } else if (sub.service === "compute") {
                                        Icon = Cpu;
                                        color = "text-blue-400 bg-blue-500/10";
                                    }

                                    const isAnnual = sub.billing_cycle === 'annual';
                                    const price = isAnnual ? sub.plan.price_annual : sub.plan.price_monthly;

                                    return (
                                        <Card key={sub.id || index} className="bg-card border-border hover:bg-muted/50 transition-all">
                                            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-4 rounded-xl", color)}>
                                                        <Icon className="size-6" />
                                                    </div>
                                                    <div>
                                                        <CardDescription className="text-sm capitalize">{sub.service} Cluster</CardDescription>
                                                        <div className="text-xl font-semibold">{sub.plan.name || "Custom Plan"}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end gap-2">
                                                    <div className="text-2xl font-bold">${price} <span className="text-sm font-normal text-muted-foreground">/{isAnnual ? 'yr' : 'mo'}</span></div>
                                                    <Button onClick={handleManageBilling} variant="outline" size="sm" className="gap-2">
                                                        <Settings className="size-4" /> Manage Plan
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>


            </main>
            </div>
        </>
    );
}
