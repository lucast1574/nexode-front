"use client";

import React, { useState } from "react";
import { Globe, Zap, Rocket, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { Subscription } from "@/app/dashboard/layout";

interface ProvisionN8nModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    subscriptions: Subscription[];
}

export function ProvisionN8nModal({
    isOpen,
    onClose,
    onSuccess,
    subscriptions,
}: ProvisionN8nModalProps) {
    const [customDomain, setCustomDomain] = useState("");
    const [isDeploying, setIsDeploying] = useState(false);
    const { showAlert } = useModal();

    const handleCreateInstance = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const n8nSub = subscriptions.find(s => s.service === 'n8n');
        if (!n8nSub) {
            showAlert({
                title: "Subscription Required",
                message: "No active n8n subscription found. You must subscribe to an n8n Plan first.",
                type: "warning"
            });
            return;
        }

        const input = {
            name: formData.get('name') as string,
            plan_slug: n8nSub.plan.slug,
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
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-lg" showCloseButton>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                            <Zap className="w-5 h-5 text-red-500 fill-current" />
                        </div>
                        <div>
                            <DialogTitle>Provision n8n</DialogTitle>
                            <DialogDescription>Deploy a new n8n automation instance.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleCreateInstance} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Instance Name</label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. Production Automations"
                            className="w-full bg-transparent border border-input rounded-lg h-12 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Custom Domain (Optional)</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                name="custom_domain"
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                placeholder="n8n.your-domain.com"
                                className="w-full bg-transparent border border-input rounded-lg h-12 pl-11 pr-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    {customDomain.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Gateway User</label>
                                <input
                                    name="username"
                                    required
                                    placeholder="admin"
                                    className="w-full bg-transparent border border-input rounded-lg h-12 px-4 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Gateway Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-transparent border border-input rounded-lg h-12 px-4 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl border bg-muted/50 p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Environment Specs</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-muted-foreground">Isolated Execution</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-muted-foreground">SSD Persistence</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isDeploying}
                        className="w-full h-12 gap-2"
                    >
                        {isDeploying ? (
                            <><Rocket className="w-4 h-4 animate-bounce" /> Provisioning...</>
                        ) : (
                            <><Rocket className="w-4 h-4" /> Launch Designer <ChevronRight className="w-4 h-4" /></>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}