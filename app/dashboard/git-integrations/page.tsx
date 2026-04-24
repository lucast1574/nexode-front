"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
    Github, 
    Plus, 
    Trash2, 
    ExternalLink, 
    CheckCircle2, 
    AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { toast } from "sonner";
import { useDashboard } from "@/app/dashboard/layout";
import Image from "next/image";

export default function GitIntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const { user, refetch } = useDashboard();
    const { showAlert, showConfirm } = useModal();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const githubStatus = searchParams.get('github');
        const gitlabStatus = searchParams.get('gitlab');

        if (githubStatus || gitlabStatus) {
            const providerName = githubStatus ? 'GitHub' : 'GitLab';
            const status = (githubStatus || gitlabStatus) === 'success' ? 'success' : 'error';

            if (status === 'success') {
                toast.success(`${providerName} Connected`, {
                    description: `Your ${providerName} account has been successfully linked.`,
                });
                refetch();
            } else {
                toast.error(`Connection Failed`, {
                    description: `Failed to link ${providerName} account. Please try again.`,
                });
            }

            // Clean up URL
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('github');
            newParams.delete('gitlab');
            const newPath = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
            window.history.replaceState({}, '', newPath);
        }
        setLoading(false);
    }, [searchParams, refetch]);

    const handleConnectProvider = async (provider: 'GITHUB' | 'GITLAB') => {
        try {
            const token = getAccessToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || "https://backend.nexode.app/api-v1";
            const endpoint = provider === 'GITHUB' ? '/github/connect' : '/gitlab/connect';

            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const result = await res.json();

            if (res.ok && result.url) {
                window.location.href = result.url;
            } else {
                toast.error("Connection Error", {
                    description: result.message || "Failed to initiate connection. Please try again."
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error", {
                description: "A network error occurred. Please try again later."
            });
        }
    };

    const handleDisconnect = async (provider: 'GITHUB' | 'GITLAB') => {
        showConfirm({
            title: `Disconnect ${provider === 'GITHUB' ? 'GitHub' : 'GitLab'}?`,
            message: `Are you sure you want to disconnect your ${provider === 'GITHUB' ? 'GitHub' : 'GitLab'} account? Any active services using this integration may be affected.`,
            confirmText: "Disconnect",
            variant: "destructive",
            onConfirm: async () => {
                try {
                    const token = getAccessToken();
                    const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || "https://backend.nexode.app/api-v1";
                    const endpoint = provider === 'GITHUB' ? '/github/disconnect' : '/gitlab/disconnect';

                    const res = await fetch(`${API_URL}${endpoint}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (res.ok) {
                        toast.success("Account Disconnected", {
                            description: `Successfully disconnected your ${provider === 'GITHUB' ? 'GitHub' : 'GitLab'} account.`
                        });
                        refetch();
                    } else {
                        const result = await res.json();
                        toast.error("Error", {
                            description: result.message || "Failed to disconnect account."
                        });
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Network Error", {
                        description: "A network error occurred."
                    });
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm animate-pulse">Loading integrations...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Git Integrations</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex-1" />
                <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
                    <Plus className="size-4" /> New Service
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Git Integrations</h1>
                        <p className="text-muted-foreground text-sm">Manage your Git providers to enable automated deployments and repository synchronization.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* GitHub Integration */}
                        <Card className={`relative overflow-hidden transition-all duration-300 ${user?.github_profile ? 'border-primary/20 bg-primary/[0.02]' : 'hover:border-primary/30'}`}>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <Github className="size-8" />
                                    {user?.github_profile ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1">
                                            <CheckCircle2 className="size-3" /> Connected
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground py-1">
                                            Not Connected
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="mt-4">GitHub</CardTitle>
                                <CardDescription>
                                    Connect to your GitHub account to deploy repositories directly to Nexode.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user?.github_profile ? (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                                        <div className="relative size-10 rounded-full overflow-hidden border border-border">
                                            {user.github_profile.avatar_url ? (
                                                <Image 
                                                    src={user.github_profile.avatar_url} 
                                                    alt={user.github_profile.username}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                                    <Github className="size-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold truncate">@{user.github_profile.username}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Linked Account</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-border rounded-xl">
                                        <div className="p-2 rounded-full bg-muted">
                                            <AlertCircle className="size-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs text-muted-foreground px-4">
                                            No GitHub account linked. Link your account to access your repositories.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-2">
                                {user?.github_profile ? (
                                    <Button 
                                        variant="outline" 
                                        className="w-full gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                                        onClick={() => handleDisconnect('GITHUB')}
                                    >
                                        <Trash2 className="size-4" /> Disconnect GitHub
                                    </Button>
                                ) : (
                                    <Button 
                                        className="w-full gap-2"
                                        onClick={() => handleConnectProvider('GITHUB')}
                                    >
                                        <Plus className="size-4" /> Connect GitHub
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>

                        {/* GitLab Integration */}
                        <Card className={`relative overflow-hidden transition-all duration-300 ${user?.gitlab_profile ? 'border-[#E24329]/20 bg-[#E24329]/[0.02]' : 'hover:border-[#E24329]/30'}`}>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <Image src="/db/gitlab.svg" alt="GitLab" width={32} height={32} className="size-8 object-contain" />
                                    {user?.gitlab_profile ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1">
                                            <CheckCircle2 className="size-3" /> Connected
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground py-1">
                                            Not Connected
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="mt-4">GitLab</CardTitle>
                                <CardDescription>
                                    Use your GitLab projects to power your Nexode cloud infrastructure.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user?.gitlab_profile ? (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                                        <div className="relative size-10 rounded-full overflow-hidden border border-border">
                                            {user.gitlab_profile.avatar_url ? (
                                                <Image 
                                                    src={user.gitlab_profile.avatar_url} 
                                                    alt={user.gitlab_profile.username}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-muted flex items-center justify-center p-2">
                                                    <Image src="/db/gitlab.svg" alt="GitLab" width={20} height={20} className="size-5 object-contain grayscale opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold truncate">@{user.gitlab_profile.username}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Linked Account</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-border rounded-xl">
                                        <div className="p-2 rounded-full bg-muted">
                                            <AlertCircle className="size-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs text-muted-foreground px-4">
                                            No GitLab account linked. Link your account to access your repositories.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-2">
                                {user?.gitlab_profile ? (
                                    <Button 
                                        variant="outline" 
                                        className="w-full gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                                        onClick={() => handleDisconnect('GITLAB')}
                                    >
                                        <Trash2 className="size-4" /> Disconnect GitLab
                                    </Button>
                                ) : (
                                    <Button 
                                        className="w-full gap-2 bg-[#E24329] hover:bg-[#E24329]/90 text-white border-none"
                                        onClick={() => handleConnectProvider('GITLAB')}
                                    >
                                        <Plus className="size-4" /> Connect GitLab
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </div>

                </div>
            </div>
        </>
    );
}
