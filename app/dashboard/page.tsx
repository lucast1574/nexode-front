"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
    Database,
    Cpu,
    Plus,
    Activity,
    Users,
    UserPlus,
    Workflow,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useDashboard } from "./layout"
import { getAccessToken } from "@/lib/auth-utils"

interface WorkspaceMemberLite {
    user_id: string
    role: string
    name?: string
    email?: string
    avatar?: string
}

interface WorkspaceLite {
    _id: string
    name: string
    owner_id: string
    members: WorkspaceMemberLite[]
}

const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql"

export default function DashboardPage() {
    const { user, subscriptions, deployedInstances } = useDashboard()
    // Only superusers bypass subscription checks for showing "create" CTAs.
    const isSuperuser = user?.role?.slug === "superuser"

    const [workspace, setWorkspace] = useState<WorkspaceLite | null>(null)

    const fetchWorkspace = useCallback(async () => {
        try {
            const token = getAccessToken()
            if (!token) return
            const res = await fetch(GQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    query: `query DashWorkspace {
                        getMyWorkspaces {
                            _id name owner_id
                            members { user_id role name email avatar }
                        }
                    }`,
                }),
            })
            const json = await res.json()
            const ws = json?.data?.getMyWorkspaces?.[0] ?? null
            setWorkspace(ws)
        } catch {
            /* silent — workspace is a nice-to-have on this page */
        }
    }, [])

    useEffect(() => { fetchWorkspace() }, [fetchWorkspace])

    // Aggregate stats from the deployed instances we already have in context.
    const totalInstances = deployedInstances.length
    const runningInstances = deployedInstances.filter(i => (i.status || '').toLowerCase() === 'running').length
    const provisioningInstances = deployedInstances.filter(i => {
        const s = (i.status || '').toLowerCase()
        return s === 'provisioning' || s === 'restarting' || s === 'pending'
    }).length
    const failedInstances = deployedInstances.filter(i => {
        const s = (i.status || '').toLowerCase()
        return s === 'failed' || s === 'error'
    }).length

    const computeCount = deployedInstances.filter(i => i.service === 'compute').length
    const databaseCount = deployedInstances.filter(i => i.service === 'database').length
    const n8nCount = deployedInstances.filter(i => i.service === 'n8n').length

    const members = workspace?.members ?? []
    const owner = members.find(m => m.role === 'owner')
    const nonOwnerMembers = members.filter(m => m.role !== 'owner')

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex-1" />
                <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
                    <Plus className="size-4" /> New Service
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
                    <p className="text-muted-foreground">Monitor and manage your active cloud resources.</p>
                </div>

                {/* Stats row: Instances Running headline + service breakdown + workspace members card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Hero: Instances Running */}
                    <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
                        {/* Decorative scanline / pulse — the "rayito bonito" */}
                        <div className="pointer-events-none absolute inset-0 opacity-40">
                            <div className="absolute -inset-1 bg-[radial-gradient(circle_at_top_right,theme(colors.emerald.500/0.25),transparent_60%)]" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                        </div>
                        <CardContent className="relative p-6">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400/80 mb-3">
                                <Activity className="size-3.5" />
                                Instances Running
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <div className="text-5xl font-black tabular-nums text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]">
                                    {runningInstances}
                                </div>
                                <div className="text-sm text-muted-foreground">/ {totalInstances} total</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                {provisioningInstances > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-amber-400">
                                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        {provisioningInstances} provisioning
                                    </span>
                                )}
                                {failedInstances > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-red-400">
                                        <span className="size-1.5 rounded-full bg-red-500" />
                                        {failedInstances} failed
                                    </span>
                                )}
                                {provisioningInstances === 0 && failedInstances === 0 && totalInstances > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                        All systems nominal
                                    </span>
                                )}
                                {totalInstances === 0 && (
                                    <span className="text-muted-foreground">No clusters deployed yet</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service breakdown */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">By Service</div>
                            <div className="space-y-3">
                                <Link href="/dashboard/compute" className="flex items-center justify-between rounded-md p-2 -mx-2 hover:bg-muted/50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <Cpu className="size-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium">Compute</span>
                                    </div>
                                    <span className="text-lg font-black tabular-nums">{computeCount}</span>
                                </Link>
                                <Link href="/dashboard/databases" className="flex items-center justify-between rounded-md p-2 -mx-2 hover:bg-muted/50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                            <Database className="size-4 text-purple-400" />
                                        </div>
                                        <span className="text-sm font-medium">Databases</span>
                                    </div>
                                    <span className="text-lg font-black tabular-nums">{databaseCount}</span>
                                </Link>
                                <Link href="/dashboard/automations" className="flex items-center justify-between rounded-md p-2 -mx-2 hover:bg-muted/50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                            <Workflow className="size-4 text-red-400" />
                                        </div>
                                        <span className="text-sm font-medium">n8n</span>
                                    </div>
                                    <span className="text-lg font-black tabular-nums">{n8nCount}</span>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Workspace members */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                                    <Users className="size-3.5" />
                                    Workspace
                                </div>
                                <Button
                                    render={<Link href="/dashboard/workspace" />}
                                    nativeButton={false}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1 text-xs"
                                >
                                    <UserPlus className="size-3.5" /> Invitar
                                </Button>
                            </div>

                            {workspace ? (
                                <>
                                    <div className="text-sm font-bold mb-3 truncate">{workspace.name}</div>
                                    {members.length > 0 ? (
                                        <div className="space-y-2">
                                            {[owner, ...nonOwnerMembers].filter(Boolean).slice(0, 4).map((m) => (
                                                <div key={m!.user_id} className="flex items-center gap-2.5">
                                                    <div className="size-7 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                                        {m!.avatar ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={m!.avatar} alt={m!.name || ''} className="size-full object-cover" />
                                                        ) : (
                                                            (m!.name || m!.email || '?').charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-medium truncate">{m!.name || m!.email || 'Member'}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{m!.role}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {members.length > 4 && (
                                                <Link href="/dashboard/workspace" className="block pt-2 text-xs text-muted-foreground hover:text-foreground transition">
                                                    +{members.length - 4} more…
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">No members yet.</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground">Loading workspace…</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deployedInstances.length === 0 ? (
                        <div className="col-span-full">
                            <Card className="border-dashed border-muted">
                                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                                    <Link href="/dashboard/services" className="size-16 bg-muted hover:bg-primary/20 hover:text-primary transition-all duration-300 rounded-full flex items-center justify-center mb-6 group/add">
                                        <Plus className="size-8 text-muted-foreground group-hover/add:text-primary transition-colors" />
                                    </Link>
                                    <h3 className="text-xl font-bold mb-2">No deployed clusters</h3>
                                    <p className="text-muted-foreground max-w-sm mb-6">You have active subscriptions but no deployed instances yet. Go to a service console to deploy your first cluster.</p>
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {(isSuperuser || subscriptions.some(s => s.service === 'database')) && (
                                            <Button render={<Link href="/dashboard/databases" />} nativeButton={false} variant="outline">Deploy Database</Button>
                                        )}
                                        {(isSuperuser || subscriptions.some(s => s.service === 'compute')) && (
                                            <Button render={<Link href="/dashboard/compute" />} nativeButton={false} variant="outline">Deploy Compute</Button>
                                        )}
                                        {(isSuperuser || subscriptions.some(s => s.service === 'n8n')) && (
                                            <Button render={<Link href="/dashboard/automations" />} nativeButton={false} variant="outline">Deploy n8n</Button>
                                        )}
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        deployedInstances.map((inst) => {
                            const href = inst.service === "database" ? "/dashboard/databases" : inst.service === "n8n" ? "/dashboard/automations" : "/dashboard/compute"
                            return (
                                <Link key={inst._id} href={href} className="block">
                                    <Card className="group relative transition-all duration-500 flex flex-col bg-card border-border hover:bg-muted/50 hover:border-muted h-full">
                                        <CardHeader className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    {inst.service === "compute" ? (
                                                        <Cpu className="size-6 text-primary" />
                                                    ) : inst.service === "n8n" ? (
                                                        <Image src="/db/n8n.svg" alt="n8n" width={24} height={24} className="size-6 object-contain" />
                                                    ) : inst.service === "database" ? (
                                                        (() => {
                                                            const dbType = inst.type?.toLowerCase() || ''
                                                            if (dbType.includes('postgres')) return <Image src="/db/postgres.svg" alt="PostgreSQL" width={24} height={24} className="size-6 object-contain" />
                                                            if (dbType.includes('mongo')) return <Image src="/db/mongo.svg" alt="MongoDB" width={24} height={24} className="size-6 object-contain" />
                                                            if (dbType.includes('redis')) return <Image src="/db/redis.svg" alt="Redis" width={24} height={24} className="size-6 object-contain" />
                                                            if (dbType.includes('mysql')) return <Image src="/db/mysql.svg" alt="MySQL" width={24} height={24} className="size-6 object-contain" />
                                                            return <Database className="size-6 text-primary" />
                                                        })()
                                                    ) : (
                                                        <Database className="size-6 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className={cn(
                                                        "w-2.5 h-2.5 rounded-full",
                                                        inst.status === 'running' ? "bg-emerald-500" :
                                                            inst.status === 'provisioning' ? "bg-amber-500 animate-pulse" :
                                                                "bg-red-500"
                                                    )} title={inst.status} />
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg font-bold">{inst.name}</CardTitle>
                                            <CardDescription className="text-muted-foreground text-sm">
                                                <span className="capitalize">{inst.service}{inst.type ? ` · ${inst.type}` : ''}</span>
                                                <span className="mx-2">·</span>
                                                <span>{new Date(inst.created_on).toLocaleDateString()}</span>
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            )
                        })
                    )}
                </div>

            </div>
        </>
    )
}
