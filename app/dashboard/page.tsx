"use client"

import React from "react"
import { NotificationBell } from "@/components/NotificationBell"
import Link from "next/link"
import {
    Database,
    Cpu,
    Plus,
    Zap
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export default function DashboardPage() {
    const { user, subscriptions, deployedInstances } = useDashboard()
    const isStaff = user?.role?.slug === "superuser" || user?.role?.slug === "admin"

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
                <div className="mr-2">
                    <NotificationBell badgeColor="bg-primary" iconColor="text-primary" />
                </div>
                <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
                    <Plus className="size-4" /> New Service
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
                    <p className="text-muted-foreground">Monitor and manage your active cloud resources.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deployedInstances.length === 0 ? (
                        <div className="col-span-full">
                            <Card className="border-dashed border-muted">
                                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                                    <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-6">
                                        <Plus className="size-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No deployed clusters</h3>
                                    <p className="text-muted-foreground max-w-sm mb-6">You have active subscriptions but no deployed instances yet. Go to a service console to deploy your first cluster.</p>
                                    <div className="flex gap-3">
                                        {(isStaff || subscriptions.some(s => s.service === 'database')) && (
                                            <Button render={<Link href="/dashboard/databases" />} nativeButton={false} variant="outline">Deploy Database</Button>
                                        )}
                                        {(isStaff || subscriptions.some(s => s.service === 'compute')) && (
                                            <Button render={<Link href="/dashboard/compute" />} nativeButton={false} variant="outline">Deploy Compute</Button>
                                        )}
                                        {(isStaff || subscriptions.some(s => s.service === 'n8n')) && (
                                            <Button render={<Link href="/dashboard/automations" />} nativeButton={false} variant="outline">Deploy n8n</Button>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
                                            <Plus className="size-4" /> New Service
                                        </Button>
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
                                                <div className="p-3 rounded-lg bg-primary/10">
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

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 relative overflow-hidden group">
                        <CardContent className="p-6 relative z-10">
                            <h3 className="text-lg font-bold mb-2">Upgrade Performance</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mb-6">Need more compute power? Upscale your instances with zero downtime.</p>
                            <Button variant="outline" size="sm" render={<Link href="/dashboard/services" />} nativeButton={false}>
                                View Tiers
                            </Button>
                        </CardContent>
                        <Zap className="absolute -bottom-4 -right-4 size-32 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    </Card>
                    <Card className="border">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">System Status</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Services</span>
                                    <span className="font-bold text-primary">{deployedInstances.length} Active</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: '100%' }} />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Infrastructure</span>
                                    <Badge variant="outline" className="text-primary font-bold">Operational</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}