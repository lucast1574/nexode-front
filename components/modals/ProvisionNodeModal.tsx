"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Globe,
    Server,
    Github,
    Gitlab,
    Check,
    Lock,
    ChevronDown,
    Search,
    Rocket,
    ArrowRight,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { Subscription } from "@/app/dashboard/layout";

interface User {
    first_name: string;
    email: string;
    avatar?: string;
    github_profile?: {
        username: string;
    };
    gitlab_profile?: {
        username: string;
    };
}

interface GithubRepository {
    id: number;
    name: string;
    full_name: string;
    url: string;
    description: string | null;
    private: boolean;
    language: string | null;
    default_branch: string;
}

interface ProvisionNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
    subscriptions: Subscription[];
    initialProvider?: string;
    isSuperuser?: boolean;
}

export function ProvisionNodeModal({
    isOpen,
    onClose,
    onSuccess,
    user,
    subscriptions,
    initialProvider = 'GITHUB',
    isSuperuser = false
}: ProvisionNodeModalProps) {
    const [step, setStep] = useState(1);
    const [formProvider, setFormProvider] = useState(initialProvider);
    const [customDomainInput, setCustomDomainInput] = useState('');
    const [githubRepos, setGithubRepos] = useState<GithubRepository[]>([]);
    const [gitlabRepos, setGitlabRepos] = useState<GithubRepository[]>([]);
    const [fetchingRepos, setFetchingRepos] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<GithubRepository | null>(null);
    const [branches, setBranches] = useState<string[]>([]);
    const [fetchingBranches, setFetchingBranches] = useState(false);
    const [repoSearch, setRepoSearch] = useState('');
    const [isRepoMenuOpen, setIsRepoMenuOpen] = useState(false);
    const [instanceName, setInstanceName] = useState('');
    const [instanceType, setInstanceType] = useState('FRONTEND');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [runtime, setRuntime] = useState('node');
    const [port, setPort] = useState<number | ''>('');
    const [healthPath, setHealthPath] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { showAlert } = useModal();

    const handleClose = () => {
        setIsRepoMenuOpen(false);
        setRepoSearch('');
        setStep(1);
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isRepoMenuOpen && !(event.target as Element).closest('.repo-selector-container')) {
                setIsRepoMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isRepoMenuOpen]);

    const fetchGithubRepos = useCallback(async () => {
        if (!user?.github_profile) return;
        setFetchingRepos(true);
        try {
            const token = getAccessToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || "https://backend.nexode.app/api-v1";
            const res = await fetch(`${API_URL}/github/repositories`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setGithubRepos(data);
            }
        } catch (error) {
            console.error("Error fetching repos:", error);
        } finally {
            setFetchingRepos(false);
        }
    }, [user?.github_profile]);

    const fetchGitlabRepos = useCallback(async () => {
        if (!user?.gitlab_profile) return;
        setFetchingRepos(true);
        try {
            const token = getAccessToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || "https://backend.nexode.app/api-v1";
            const res = await fetch(`${API_URL}/gitlab/repositories`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setGitlabRepos(data);
            }
        } catch (error) {
            console.error("Error fetching GitLab repos:", error);
        } finally {
            setFetchingRepos(false);
        }
    }, [user?.gitlab_profile]);

    const fetchRepoBranches = useCallback(async () => {
        if (!selectedRepo) return;
        setFetchingBranches(true);
        try {
            const token = getAccessToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || "https://backend.nexode.app/api-v1";

            let url = "";
            if (formProvider === 'GITHUB') {
                const parts = selectedRepo.full_name.split('/');
                url = `${API_URL}/github/branches?owner=${parts[0]}&repo=${parts[1]}`;
            } else {
                url = `${API_URL}/gitlab/branches?projectId=${selectedRepo.id}`;
            }

            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setBranches(data);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        } finally {
            setFetchingBranches(false);
        }
    }, [selectedRepo, formProvider]);

    useEffect(() => {
        fetchRepoBranches();
    }, [selectedRepo, fetchRepoBranches]);

    useEffect(() => {
        if (isOpen && formProvider === 'GITHUB' && user?.github_profile && githubRepos.length === 0) {
            fetchGithubRepos();
        }
    }, [isOpen, formProvider, user?.github_profile, githubRepos.length, fetchGithubRepos]);

    useEffect(() => {
        if (isOpen && formProvider === 'GITLAB' && user?.gitlab_profile && gitlabRepos.length === 0) {
            fetchGitlabRepos();
        }
    }, [isOpen, formProvider, user?.gitlab_profile, gitlabRepos.length, fetchGitlabRepos]);

    const handleConnectProvider = async (provider: string) => {
        if (provider !== 'GITHUB' && provider !== 'GITLAB') {
            showAlert({
                title: "Not Supported Yet",
                message: `${provider} integration is coming soon.`,
                type: "warning"
            });
            return;
        }

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
                showAlert({
                    title: "Connection Error",
                    message: result.message || "Failed to initiate connection. Please try again.",
                    type: "error"
                });
            }
        } catch (error) {
            console.error(error);
            showAlert({
                title: "Connection Error",
                message: "A network error occurred. Please try again later.",
                type: "error"
            });
        }
    };

    const handleNext = () => {
        if (!selectedRepo) {
            showAlert({
                title: "Repository Required",
                message: "Please select a repository before continuing.",
                type: "warning"
            });
            return;
        }
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleCreateInstance = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("[ProvisionNode] Submitting form...", { instanceName, instanceType, formProvider, selectedRepo });

        const computeSub = subscriptions.find(s => s.service === 'compute');
        if (!computeSub && !isSuperuser) {
            showAlert({
                title: "Subscription Required",
                message: "No active compute subscription found. You must subscribe to a Compute plan first.",
                type: "warning"
            });
            return;
        }

        const input = {
            name: instanceName,
            type: instanceType,
            provider: formProvider,
            repository_url: selectedRepo?.url || '',
            branch: selectedBranch || selectedRepo?.default_branch || 'main',
            plan_slug: computeSub?.plan?.slug || 'compute-basic',
            custom_domain: customDomainInput || undefined,
            runtime,
            port: port === '' ? undefined : Number(port),
            health_check_path: healthPath || undefined
        };

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            console.log("[ProvisionNode] API URL:", GQL_URL);

            const mutation = `
                mutation CreateCompute($input: CreateComputeInput!) {
                    createComputeInstance(input: $input) { _id name status }
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
            console.log("[ProvisionNode] API Result:", result);

            if (result.data?.createComputeInstance) {
                console.log("[ProvisionNode] Success!");
                onSuccess();
                handleClose();
            } else {
                showAlert({
                    title: "Provisioning Failed",
                    message: result.errors?.[0]?.message || "Failed to provision instance. Check your account limits.",
                    type: "error"
                });
            }
        } catch (err) {
            console.error(err);
            showAlert({
                title: "Connection Error",
                message: "Connection error. Please try again later.",
                type: "error"
            });
        }
    };

    const isProviderConnected = (formProvider === 'GITHUB' && !!user?.github_profile) ||
                                 (formProvider === 'GITLAB' && !!user?.gitlab_profile);

    const canProceedStep1 = selectedRepo !== null;
    const canSubmit = instanceName.trim().length > 0 && selectedRepo !== null;

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) handleClose(); }}>
            <DialogContent className="sm:max-w-lg" showCloseButton>
                <DialogHeader>
                    <DialogTitle>Provision Node</DialogTitle>
                    <DialogDescription>Deploy a new compute instance from your repository.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateInstance}>
                    <FieldGroup>
                        {step === 1 && (
                            <div className="space-y-4 ">
                                <Field>
                                    <FieldLabel htmlFor="git-provider">Git Provider</FieldLabel>
                                    <Select value={formProvider} onValueChange={(value: string | null) => setFormProvider(value ?? 'GITHUB')}>
                                        <SelectTrigger id="git-provider" className="w-full h-12">
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="GITHUB">
                                                    <div className="flex items-center gap-2">
                                                        <Github className="w-4 h-4" />
                                                        GitHub
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="GITLAB">
                                                    <div className="flex items-center gap-2">
                                                        <Gitlab className="w-4 h-4" />
                                                        GitLab
                                                    </div>
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                {((formProvider === 'GITHUB' && !user?.github_profile) ||
                                  (formProvider === 'GITLAB' && !user?.gitlab_profile)) ? (
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30">
                                                {formProvider === 'GITHUB' ? <Github className="w-5 h-5 text-primary" /> :
                                                  <Gitlab className="w-5 h-5 text-orange-500" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold">Authorization Required</div>
                                                <div className="text-xs text-muted-foreground">Connect {formProvider.toLowerCase()} to access repositories.</div>
                                            </div>
                                        </div>
                                        <Button type="button" size="sm" onClick={() => handleConnectProvider(formProvider)} className="shrink-0">
                                            Authorize
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <Check className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-emerald-400">Account Verified</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Connected as <span className="font-semibold text-foreground">@{
                                                        formProvider === 'GITHUB' ? user?.github_profile?.username : user?.gitlab_profile?.username
                                                    }</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button type="button" size="sm" variant="outline" onClick={() => handleConnectProvider(formProvider)} className="shrink-0">
                                            Switch
                                        </Button>
                                    </div>
                                )}

                                <Field>
                                    <FieldLabel htmlFor="repository">Repository</FieldLabel>
                                    {isProviderConnected ? (
                                        <div className="relative repo-selector-container">
                                            <button
                                                type="button"
                                                id="repository"
                                                onClick={() => setIsRepoMenuOpen(!isRepoMenuOpen)}
                                                className={cn(
                                                    "w-full bg-transparent border border-input rounded-lg h-12 px-4 font-medium flex items-center justify-between transition-all outline-none",
                                                    isRepoMenuOpen ? "border-primary/50 ring-2 ring-primary/10" : ""
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {selectedRepo ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center border",
                                                                selectedRepo.private ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-primary/10 border-primary/20 text-primary"
                                                            )}>
                                                                {selectedRepo.private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                                            </div>
                                                            <span className="text-sm font-medium truncate max-w-[250px]">{selectedRepo.full_name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">Select repository...</span>
                                                    )}
                                                </div>
                                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-all", isRepoMenuOpen && "rotate-180")} />
                                            </button>

                                            {isRepoMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[110]" onClick={() => setIsRepoMenuOpen(false)} />
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg overflow-hidden z-[120] shadow-lg">
                                                        <div className="p-3 border-b border-border">
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                                <Input
                                                                    autoFocus
                                                                    id="repo-search"
                                                                    placeholder="Filter repositories..."
                                                                    className="h-9 pl-9 pr-4"
                                                                    value={repoSearch}
                                                                    onChange={(e) => setRepoSearch(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[250px] overflow-y-auto">
                                                            {fetchingRepos ? (
                                                                <div className="flex flex-col items-center justify-center py-6 gap-2">
                                                                    <Spinner className="w-5 h-5 text-primary" />
                                                                    <span className="text-xs text-muted-foreground">Loading repositories...</span>
                                                                </div>
                                                            ) : (
                                                                (formProvider === 'GITHUB' ? githubRepos : gitlabRepos)
                                                                    .filter(repo => repo.full_name.toLowerCase().includes(repoSearch.toLowerCase()))
                                                                    .map(repo => (
                                                                        <button
                                                                            key={repo.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedRepo(repo);
                                                                                setIsRepoMenuOpen(false);
                                                                                setRepoSearch('');
                                                                            }}
                                                                            className={cn(
                                                                                "w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors",
                                                                                selectedRepo?.id === repo.id && "bg-primary/10"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={cn(
                                                                                    "w-7 h-7 rounded-md flex items-center justify-center border",
                                                                                    repo.private ? "bg-amber-500/5 border-amber-500/10 text-amber-500" : "bg-primary/5 border-primary/10 text-primary"
                                                                                )}>
                                                                                    {repo.private ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                                                                                </div>
                                                                                <div className="text-left">
                                                                                    <div className="text-sm font-medium">{repo.full_name}</div>
                                                                                    <div className="text-xs text-muted-foreground">{repo.language || 'Code'} &middot; {repo.default_branch}</div>
                                                                                </div>
                                                                            </div>
                                                                            {selectedRepo?.id === repo.id && (
                                                                                <Check className="w-4 h-4 text-primary" />
                                                                            )}
                                                                        </button>
                                                                    ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <input type="hidden" name="repository_url" value={selectedRepo?.url || ''} required />
                                        </div>
                                    ) : (
                                        <Input
                                            id="repository-url"
                                            name="repository_url"
                                            required
                                            placeholder={`https://${formProvider.toLowerCase()}.com/user/repo`}
                                        />
                                    )}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="deployment-branch">Deployment Branch</FieldLabel>
                                    {branches.length > 0 ? (
                                        <Select value={selectedBranch || selectedRepo?.default_branch || 'main'} onValueChange={(value: string | null) => setSelectedBranch(value ?? 'main')}>
                                            <SelectTrigger id="deployment-branch" className="w-full h-12">
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {branches.map(b => (
                                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="deployment-branch"
                                            name="branch"
                                            value={selectedBranch || selectedRepo?.default_branch || 'main'}
                                            onChange={(e) => setSelectedBranch(e.target.value)}
                                        />
                                    )}
                                    <input type="hidden" name="branch" value={selectedBranch || selectedRepo?.default_branch || 'main'} />
                                </Field>

                                <Button
                                    type="button"
                                    disabled={!canProceedStep1 || fetchingBranches || fetchingRepos}
                                    onClick={handleNext}
                                    className="w-full h-12 gap-2"
                                >
                                    {fetchingBranches || fetchingRepos ? (
                                        <><Spinner data-icon="inline-start" /> Fetching...</>
                                    ) : (
                                        <><span>Continue</span> <ArrowRight className="size-4" /></>
                                    )}
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 ">
                                <Field>
                                    <FieldLabel htmlFor="instance-name">Instance Name</FieldLabel>
                                    <Input
                                        id="instance-name"
                                        name="name"
                                        required
                                        value={instanceName}
                                        onChange={(e) => setInstanceName(e.target.value)}
                                        placeholder="Project Name (e.g. My Awesome API)"
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="service-type">Service Type</FieldLabel>
                                        <Select value={instanceType} onValueChange={(value: string | null) => setInstanceType(value ?? 'FRONTEND')}>
                                            <SelectTrigger id="service-type" className="w-full h-12">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="FRONTEND">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="w-4 h-4" />
                                                            Frontend Web
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="BACKEND">
                                                        <div className="flex items-center gap-2">
                                                            <Server className="w-4 h-4" />
                                                            Backend API
                                                        </div>
                                                    </SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="runtime">Runtime / Language</FieldLabel>
                                        <Select value={runtime} onValueChange={(value: string | null) => {
                                            setRuntime(value ?? 'node');
                                            if (value === 'node') {
                                                setPort(instanceType === 'FRONTEND' ? 3000 : 4000);
                                                setHealthPath(instanceType === 'FRONTEND' ? '/' : '/health');
                                            } else if (value === 'python') {
                                                setPort(8000);
                                                setHealthPath('/health');
                                            } else if (value === 'go') {
                                                setPort(8080);
                                                setHealthPath('/health');
                                            }
                                        }}>
                                            <SelectTrigger id="runtime" className="w-full h-12">
                                                <SelectValue placeholder="Select runtime" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="node">Node.js (NestJS, Next.js, Express)</SelectItem>
                                                    <SelectItem value="python">Python (FastAPI, Flask, Django)</SelectItem>
                                                    <SelectItem value="go">Go (Gin, Echo, Fiber)</SelectItem>
                                                    <SelectItem value="docker">Generic Dockerfile</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                <input type="hidden" name="type" value={instanceType} />
                                <input type="hidden" name="provider" value={formProvider} />

                                <Field>
                                    <FieldLabel htmlFor="custom-domain">Custom Domain</FieldLabel>
                                    <Input
                                        id="custom-domain"
                                        name="custom_domain"
                                        placeholder="app.example.com"
                                        value={customDomainInput}
                                        onChange={(e) => setCustomDomainInput(e.target.value)}
                                    />
                                </Field>

                                <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={() => setShowAdvanced(!showAdvanced)}>
                                    <span className="text-xs font-bold text-muted-foreground uppercase group-hover:text-primary transition-colors">Advanced Infrastructure Options</span>
                                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-all", showAdvanced && "rotate-180")} />
                                </div>

                                {showAdvanced && (
                                    <div className="space-y-4 ">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field>
                                                <FieldLabel htmlFor="port">Internal Port</FieldLabel>
                                                <Input
                                                    id="port"
                                                    type="number"
                                                    placeholder={instanceType === 'FRONTEND' ? '3000' : '4000'}
                                                    value={port}
                                                    onChange={(e) => setPort(e.target.value === '' ? '' : Number(e.target.value))}
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="health-path">Health Check Path</FieldLabel>
                                                <Input
                                                    id="health-path"
                                                    placeholder="/health"
                                                    value={healthPath}
                                                    onChange={(e) => setHealthPath(e.target.value)}
                                                />
                                            </Field>
                                        </div>
                                        {customDomainInput.trim().length > 0 && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field>
                                                    <FieldLabel htmlFor="auth-user">Basic Auth Username</FieldLabel>
                                                    <Input id="auth-user" name="auth_user" placeholder="admin" />
                                                </Field>
                                                <Field>
                                                    <FieldLabel htmlFor="auth-pass">Access Key</FieldLabel>
                                                    <Input id="auth-pass" name="auth_pass" type="password" placeholder="••••••••" />
                                                </Field>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        className="h-12 gap-2"
                                    >
                                        <ArrowLeft className="size-4" />
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className="h-12 gap-2"
                                    >
                                        <Rocket className="size-4" />
                                        Launch Virtual Node
                                    </Button>
                                </div>
                            </div>
                        )}
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    );
}
