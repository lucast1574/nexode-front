"use client";

import React, { useState } from "react";
import { X, Globe, Zap, Rocket, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { Subscription } from "@/components/Sidebar";

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-xl bg-[#080808] border border-white/10 rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-red-500 mb-2">
                            <Zap className="w-5 h-5 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Isolated Automation Cluster</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">Provision n8n</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-zinc-500 hover:bg-white/5 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleCreateInstance} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1 block">Instance Identity</label>
                        <input 
                            name="name" 
                            required 
                            placeholder="e.g. Production Automations" 
                            className="w-full bg-white/[0.02] border border-white/10 rounded-[22px] h-16 px-8 text-sm font-bold text-white focus:border-red-500/50 transition-all outline-none" 
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1 block">Custom Domain (Optional)</label>
                        <div className="relative">
                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                            <input 
                                name="custom_domain" 
                                placeholder="n8n.your-domain.com" 
                                className="w-full bg-white/[0.02] border border-white/10 rounded-[22px] h-16 pl-14 pr-8 text-sm font-bold text-white focus:border-red-500/50 transition-all outline-none" 
                            />
                        </div>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-red-400">Environment Specs</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-zinc-400">High-Availability</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-zinc-400">SSD Persistence</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button 
                            type="submit" 
                            disabled={isDeploying}
                            className="w-full h-16 rounded-[24px] bg-red-600 hover:bg-red-500 font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-red-500/20 gap-3"
                        >
                            {isDeploying ? (
                                <><Rocket className="w-5 h-5 animate-bounce" /> Provisioning...</>
                            ) : (
                                <><Rocket className="w-5 h-5" /> Launch Designer <ChevronRight className="w-4 h-4" /></>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
