"use client";

import React, { useState, useEffect } from "react";
import { Globe, Rocket, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { Subscription } from "@/app/dashboard/layout";
import { TierPicker } from "@/components/billing/tier-picker";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import type { PricingPlan } from "@/components/billing/pricing-table";

interface ProvisionN8nModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    subscriptions: Subscription[];
    isSuperuser?: boolean;
}

export function ProvisionN8nModal({
    isOpen,
    onClose,
    onSuccess,
    subscriptions,
    isSuperuser = false,
}: ProvisionN8nModalProps) {
    const [customDomain, setCustomDomain] = useState("");
    const [isDeploying, setIsDeploying] = useState(false);
    const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
    const [selectedTier, setSelectedTier] = useState<string>('');
    const [upgradeRequest, setUpgradeRequest] = useState<{ subId: string; toSlug: string } | null>(null);
    const { showAlert } = useModal();

    useEffect(() => {
        if (!isOpen || availablePlans.length > 0) return;
        const load = async () => {
            try {
                const token = getAccessToken();
                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
                const res = await fetch(GQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
                    body: JSON.stringify({ query: `query { availablePlans { id name slug service price_monthly price_annual features } }` }),
                });
                const result = await res.json();
                setAvailablePlans(result.data?.availablePlans || []);
            } catch { /* ignore */ }
        };
        load();
    }, [isOpen, availablePlans.length]);

    useEffect(() => {
        if (selectedTier || availablePlans.length === 0) return;
        const n8nSub = subscriptions.find(s => s.service === 'n8n');
        if (n8nSub?.plan?.slug) {
            setSelectedTier(n8nSub.plan.slug);
        } else {
            const cheapest = availablePlans
                .filter(p => p.service === 'n8n' && p.price_monthly > 0)
                .sort((a, b) => a.price_monthly - b.price_monthly)[0];
            if (cheapest) setSelectedTier(cheapest.slug);
        }
    }, [availablePlans, subscriptions, selectedTier]);

    const handleCreateInstance = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const n8nSub = subscriptions.find(s => s.service === 'n8n');
        if (!n8nSub && !isSuperuser) {
            showAlert({
                title: "Subscription Required",
                message: "No active n8n subscription found. You must subscribe to an n8n plan first.",
                type: "warning"
            });
            return;
        }

        const input = {
            name: formData.get('name') as string,
            plan_slug: selectedTier || n8nSub?.plan?.slug || 'n8n-basic',
            custom_domain: formData.get('custom_domain') as string || undefined,
            username: formData.get('username') as string || undefined,
            password: formData.get('password') as string || undefined,
            env_content: ""
        };

        setIsDeploying(true);
        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";

            const mutation = `
                mutation CreateN8n($input: CreateN8nInput!) {
                    createN8n(input: $input) { _id name status }
                }
            `;

            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { input }
                }),
            });

            const result = await res.json();

            if (result.data?.createN8n) {
                onSuccess();
                onClose();
            } else {
                showAlert({
                    title: "Provisioning Failed",
                    message: result.errors?.[0]?.message || "Failed to provision n8n instance.",
                    type: "error"
                });
            }
        } catch (err) {
            console.error(err);
            showAlert({
                title: "Connection Error",
                message: "A network error occurred. Please try again later.",
                type: "error"
            });
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <>
        <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-lg" showCloseButton>
                <DialogHeader>
                    <DialogTitle>Provision n8n</DialogTitle>
                    <DialogDescription>Deploy a new n8n automation instance.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateInstance}>
                    <FieldGroup>
                        {availablePlans.length > 0 && (
                            <div className="p-4 rounded-lg border border-border bg-muted/20">
                                <TierPicker
                                    service="n8n"
                                    availablePlans={availablePlans}
                                    ownedSlugs={subscriptions.filter(s => s.service === 'n8n').map(s => s.plan?.slug || '')}
                                    isSuperuser={isSuperuser}
                                    value={selectedTier}
                                    onChange={setSelectedTier}
                                    onUpgrade={(fromSlug, toSlug) => {
                                        const sub = subscriptions.find(s => s.service === 'n8n' && s.plan?.slug === fromSlug);
                                        if (sub) setUpgradeRequest({ subId: sub.id, toSlug });
                                    }}
                                    onSubscribe={() => {
                                        window.location.href = '/dashboard/billing#available-plans';
                                    }}
                                    label="n8n tier for this instance"
                                />
                            </div>
                        )}

                        <Field>
                            <FieldLabel htmlFor="n8n-name">Instance Name</FieldLabel>
                            <Input
                                id="n8n-name"
                                name="name"
                                required
                                placeholder="e.g. Production Automations"
                                className="bg-background"
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="n8n-custom-domain">Custom Domain (Optional)</FieldLabel>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="n8n-custom-domain"
                                    name="custom_domain"
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    placeholder="n8n.your-domain.com"
                                    className="pl-11 bg-background"
                                />
                            </div>
                        </Field>

                        {customDomain.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel htmlFor="n8n-username">Gateway User</FieldLabel>
                                    <Input
                                        id="n8n-username"
                                        name="username"
                                        required
                                        placeholder="admin"
                                        className="bg-background"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="n8n-password">Gateway Password</FieldLabel>
                                    <Input
                                        id="n8n-password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="bg-background"
                                    />
                                </Field>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isDeploying}
                            className="w-full h-12 gap-2"
                            variant="destructive"
                        >
                            {isDeploying ? (
                                <><Spinner data-icon="inline-start" /> Provisioning...</>
                            ) : (
                                <><Rocket className="size-4" /> Launch n8n <ChevronRight className="size-4" /></>
                            )}
                        </Button>
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
        {upgradeRequest && (
            <UpgradeDialog
                open={!!upgradeRequest}
                onClose={() => setUpgradeRequest(null)}
                subscriptionId={upgradeRequest.subId}
                newPlanSlug={upgradeRequest.toSlug}
                newCycle="monthly"
                onSuccess={() => {
                    setSelectedTier(upgradeRequest.toSlug);
                    setUpgradeRequest(null);
                }}
            />
        )}
        </>
    );
}
