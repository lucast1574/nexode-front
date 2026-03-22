"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
    X, 
    Globe, 
    Server, 
    Github, 
    Gitlab, 
    Check, 
    Lock, 
    ChevronDown, 
    Search, 
    RefreshCw, 
    Rocket 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth-utils";
import { useModal } from "@/components/ui/modal";
import { Subscription } from "@/components/Sidebar";

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
}

export function ProvisionNodeModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    user, 
    subscriptions,
    initialProvider = 'GITHUB'
}: ProvisionNodeModalProps) {
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
    
    const { showAlert } = useModal();

    // Reset when closing
    const handleClose = () => {
        setIsRepoMenuOpen(false);
        setRepoSearch('');
        onClose();
    };

    // Close repo menu on click outside
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
                headers: {
                    "Authorization": `Bearer ${token}`
                }
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

    const handleCreateInstance = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const computeSub = subscriptions.find(s => s.service === 'compute');
        if (!computeSub) {
            showAlert({
                title: "Subscription Required",
                message: "No active compute subscription found. You must subscribe to a Compute plan first.",
                type: "warning"
            });
            return;
        }

        const input = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            provider: formData.get('provider') as string,
            repository_url: formData.get('repository_url') as string,
            branch: formData.get('branch') as string || 'main',
            plan_slug: computeSub.plan.slug,
            custom_domain: formData.get('custom_domain') as string || undefined
        };

        try {
            const token = getAccessToken();
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";

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

            if (result.data?.createComputeInstance) {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm animate-in fade-in duration-700 overflow-y-auto overflow-x-hidden transition-all">
            {/* Background Blobs for depth */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-600/20 blur-[150px] rounded-full animate-pulse duration-[10s]" />
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse duration-[8s] delay-1000" />
            </div>

            <div className="w-full max-w-lg bg-black border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_120px_rgba(0,0,0,0.9)] relative group transition-all duration-700 hover:border-white/20 my-4 md:my-8">
                {/* Internal Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600/[0.02] to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-[calc(-0.05em)] uppercase leading-none text-white">Provision Node</h2>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-3 bg-white/[0.03] border border-white/[0.05] rounded-full px-4 py-1.5 w-fit">Nano-Seconds Deployment</p>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/[0.05] hover:text-white transition-all transform hover:rotate-90 active:scale-90 shadow-2xl"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCreateInstance} className="space-y-4 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1 block leading-none">Instance Identity</label>
                        <div className="relative group/input">
                            <input 
                                name="name" 
                                required 
                                placeholder="Project Name (e.g. My Awesome API)" 
                                className="w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 rounded-2xl h-11 px-6 text-sm font-black tracking-tight text-white placeholder:text-zinc-800 focus:border-blue-500/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1 block leading-none">Service Type</label>
                            <CustomDropdown
                                name="type"
                                options={[
                                    { value: 'FRONTEND', label: 'Frontend Web', icon: Globe },
                                    { value: 'BACKEND', label: 'Backend API', icon: Server }
                                ]}
                                defaultValue="FRONTEND"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1 block leading-none">Git Provider</label>
                            <CustomDropdown
                                name="provider"
                                options={[
                                    { value: 'GITHUB', label: 'GitHub', icon: Github },
                                    { value: 'GITLAB', label: 'GitLab', icon: Gitlab }
                                ]}
                                defaultValue={formProvider}
                                onChange={(v) => {
                                    setFormProvider(v);
                                }}
                            />
                        </div>
                    </div>

                    {((formProvider === 'GITHUB' && !user?.github_profile) || 
                      (formProvider === 'GITLAB' && !user?.gitlab_profile)) ? (
                        <div className="p-4 rounded-3xl bg-blue-600/5 border border-blue-500/20 flex items-center justify-between group/verify animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/30 group-hover/verify:rotate-6 transition-transform shadow-lg shadow-blue-500/5">
                                    {formProvider === 'GITHUB' ? <Github className="w-6 h-6 text-blue-500" /> : 
                                      formProvider === 'GITLAB' ? <Gitlab className="w-6 h-6 text-orange-500" /> : 
                                      <Github className="w-6 h-6 text-blue-500" />}
                                </div>
                                <div>
                                    <div className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Authorization Required</div>
                                    <div className="text-xs text-zinc-500 font-bold leading-none tracking-tight">Connect {formProvider.toLowerCase()} to access clusters.</div>
                                </div>
                            </div>
                            <Button type="button" size="sm" onClick={() => handleConnectProvider(formProvider)} className="rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 px-6 h-10 shrink-0 transform active:scale-95 transition-all">
                                Authorize
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 rounded-3xl bg-emerald-600/[0.03] border border-emerald-500/10 flex items-center justify-between group/verify animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                    <Check className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Account Verified</div>
                                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-tight">
                                        Connected as <span className="text-white ml-1">@{
                                            formProvider === 'GITHUB' ? user?.github_profile?.username :
                                            user?.gitlab_profile?.username
                                        }</span>
                                    </div>
                                </div>
                            </div>
                            <Button type="button" size="sm" onClick={() => handleConnectProvider(formProvider)} className="rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white px-6 h-10 shrink-0 transition-all">
                                Switch
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1 block leading-none">Repository Target</label>
                        {((formProvider === 'GITHUB' && user?.github_profile) || (formProvider === 'GITLAB' && user?.gitlab_profile)) ? (
                            <div className="relative repo-selector-container group/repo">
                                <button
                                    type="button"
                                    onClick={() => setIsRepoMenuOpen(!isRepoMenuOpen)}
                                    className={cn(
                                        "w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 rounded-2xl h-11 px-6 font-bold flex items-center justify-between transition-all outline-none",
                                        isRepoMenuOpen ? "border-blue-500/50 bg-white/[0.05]" : ""
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        {selectedRepo ? (
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center border transition-all",
                                                    selectedRepo.private ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                                )}>
                                                    {selectedRepo.private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                                </div>
                                                <span className="text-sm font-black text-white truncate max-w-[240px] uppercase tracking-tight">{selectedRepo.full_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600 text-sm font-black uppercase tracking-widest">Select Repository ...</span>
                                        )}
                                    </div>
                                    <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform duration-500", isRepoMenuOpen && "rotate-180 text-blue-500")} />
                                </button>

                                {isRepoMenuOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-4 bg-[#080808]/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden z-[110] shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-6 duration-500 border-t-white/20">
                                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                                            <div className="relative group/search">
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/search:text-blue-500 transition-colors" />
                                                <input 
                                                    autoFocus
                                                    placeholder="Filter your sources..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl h-11 pl-12 pr-4 text-xs font-black uppercase tracking-widest focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                    value={repoSearch}
                                                    onChange={(e) => setRepoSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="max-h-[280px] overflow-y-auto scrollbar-hide py-2 px-2">
                                            {fetchingRepos ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                                    <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                    <span className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em]">Querying {formProvider}...</span>
                                                </div>
                                            ) : (
                                                <div className="grid gap-1">
                                                    {(formProvider === 'GITHUB' ? githubRepos : gitlabRepos)
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
                                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] rounded-xl group/item transition-all"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                                                                        repo.private ? "bg-amber-500/5 border-amber-500/10 text-amber-500 group-hover/item:border-amber-500/30" : "bg-blue-500/5 border-blue-500/10 text-blue-500 group-hover/item:border-blue-500/30"
                                                                    )}>
                                                                        {repo.private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <div className="text-xs font-black text-white group-hover/item:text-blue-400 transition-colors uppercase tracking-tight">{repo.full_name}</div>
                                                                        <div className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-600 mt-0.5">{repo.language || 'Code'} • {repo.default_branch}</div>
                                                                    </div>
                                                                </div>
                                                                {selectedRepo?.id === repo.id && (
                                                                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                                        <Check className="w-3 h-3 text-blue-500" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <input type="hidden" name="repository_url" value={selectedRepo?.url || ''} required />
                            </div>
                        ) : (
                            <input 
                                name="repository_url" 
                                required 
                                placeholder={`https://${formProvider.toLowerCase()}.com/user/repo`} 
                                className="w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 rounded-2xl h-11 px-6 text-sm font-black text-white focus:border-blue-500/50 transition-all outline-none" 
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1 block leading-none">Deployment Branch</label>
                            <CustomDropdown
                                key={`branch-${selectedRepo?.id || 'none'}`}
                                name="branch"
                                searchable={branches.length > 5}
                                options={fetchingBranches ? [{ value: 'loading', label: 'Fetching Branches...', icon: RefreshCw }] : (branches.length > 0 ? branches.map(b => ({ value: b, label: b, icon: Check })) : [{ value: selectedRepo?.default_branch || 'main', label: selectedRepo?.default_branch || 'main', icon: Check }])}
                                defaultValue={selectedRepo?.default_branch || 'main'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1 block leading-none">Custom Domain</label>
                            <input 
                                name="custom_domain" 
                                placeholder="app.example.com" 
                                onChange={(e) => setCustomDomainInput(e.target.value)}
                                className="w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 rounded-2xl h-11 px-6 text-sm font-black text-white focus:border-blue-500/50 transition-all outline-none" 
                            />
                        </div>
                    </div>

                    {customDomainInput.trim().length > 0 && (
                        <div className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-6 duration-500 pt-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500/80 ml-1 block leading-none">Basic Auth Identity</label>
                                <input name="auth_user" placeholder="admin" className="w-full bg-blue-500/[0.03] border border-blue-500/20 rounded-2xl h-11 px-6 text-sm font-black text-blue-400 placeholder:text-blue-900/40 focus:border-blue-500/50 transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500/80 ml-1 block leading-none">Access Key</label>
                                <input name="auth_pass" type="password" placeholder="••••••••" className="w-full bg-blue-500/[0.03] border border-blue-500/20 rounded-2xl h-11 px-6 text-sm font-black text-blue-400 placeholder:text-blue-900/40 focus:border-blue-500/50 transition-all outline-none" />
                            </div>
                        </div>
                    )}

                    <div className="pt-6">
                        <Button type="submit" className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_10px_40px_rgba(59,130,246,0.2)] transform transition-all active:scale-[0.98] active:shadow-none group/submit overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/submit:translate-x-full transition-transform duration-1000" />
                            <Rocket className="w-6 h-6 mr-4 group-hover:-translate-y-2 group-hover:translate-x-2 transition-transform duration-500" />
                            Launch Virtual Node
                        </Button>
                        <p className="text-[10px] text-zinc-700 text-center mt-6 font-black uppercase tracking-[0.25em]">Automated SSL & Hybrid Load Balancing Active</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
