"use client"

import React from "react"
import { NotificationBell } from "@/components/NotificationBell"
import Link from "next/link"
import {
    Database,
    Cpu,
    Plus,
    ExternalLink,
    ChevronRight,
    Zap,
    Workflow
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
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
    const { subscriptions } = useDashboard()

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
                <div className="mr-2"><NotificationBell /></div>
                <Button render={<Link href="/services" />} nativeButton={false} className="gap-2">
                    <Plus className="size-4" /> New Service
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
                    <p className="text-muted-foreground">Monitor and manage your active cloud resources.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptions.map((sub) => {
                        const isHighestTier =
                            sub.plan.name.toLowerCase().includes("ultra") ||
                            sub.plan.name.toLowerCase().includes("tier 4") ||
                            (sub.service === "compute" && sub.plan.name.toLowerCase().includes("pro"))

                        return (
                            <Card key={sub.id} className={cn(
                                "group relative transition-all duration-500 flex flex-col",
                                sub.service === "n8n"
                                    ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:bg-primary/15"
                                    : sub.service === "compute"
                                        ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:bg-primary/15"
                                        : sub.service === "database"
                                            ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:bg-primary/15"
                                            : "bg-card border-border"
                            )}>
                                <Link
                                    href={sub.service === "database" ? "/dashboard/databases" : sub.service === "n8n" ? "/dashboard/automations" : sub.service === "compute" ? "/dashboard/compute" : "#"}
                                    className="flex-1"
                                >
                                    <CardHeader className="p-6 pb-0">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-primary/10 text-primary">
                                                {sub.service === "database" ? <Database className="size-6" /> :
                                                    sub.service === "n8n" ? <Workflow className="size-6" /> :
                                                        <Cpu className="size-6" />}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                    {sub.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg font-bold capitalize">{sub.service} {sub.service === 'n8n' ? 'Flow' : 'Cluster'}</CardTitle>
                                        <CardDescription className="text-muted-foreground text-sm">{sub.plan.name} Instance</CardDescription>
                                    </CardHeader>

                                    <CardContent className="p-6 pt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(sub.plan.features).slice(0, 4).map(([key, val]: [string, string]) => (
                                                <div key={key} className="flex flex-col gap-1 bg-muted/50 p-2 border">
                                                    <div className="text-xs text-muted-foreground font-medium">{key}</div>
                                                    <div className="text-sm font-semibold">{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Link>

                                <CardFooter className="p-6 pt-0 flex flex-col gap-3">
                                    <div className="flex items-center gap-3 w-full">
                                        <Button render={<Link href={
                                                    sub.service === "database" ? "/dashboard/databases" :
                                                        sub.service === "n8n" ? "/dashboard/automations" :
                                                            sub.service === "compute" ? "/dashboard/compute" : "#"
                                                } />} nativeButton={false} className="flex-1 gap-2">
                                                Open Console <ExternalLink className="size-4" />
                                            </Button>
                                        <Button variant="outline" size="icon" className="shrink-0">
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    </div>

                                    {!isHighestTier && (
                                        <Button variant="ghost" render={<Link href="/services" />} nativeButton={false} className="w-full gap-2 text-primary hover:bg-primary/10 hover:text-primary">
                                            <Zap className="size-4" /> Upgrade Plan
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}

                    {(() => {
                        const hasService = (id: string) => subscriptions.some(s => s.service === id)
                        const missing = []
                        if (!hasService('n8n')) missing.push({ id: 'n8n', title: 'n8n Automation' })
                        if (!hasService('database')) missing.push({ id: 'database', title: 'Database Cluster' })
                        if (!hasService('compute')) missing.push({ id: 'compute', title: 'Compute Instance' })

                        return missing.map(svc => (
                            <Card key={svc.id} className="relative group border border-dashed flex flex-col items-center justify-center text-center transition-all">
                                <CardContent className="p-8 flex flex-col items-center">
                                    <div className="size-12 bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="size-6 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="text-lg font-bold mb-2">Add {svc.title}</CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground mb-6 max-w-[200px]">Provision this resource to expand your infrastructure.</CardDescription>
<Button variant="outline" size="sm" render={<Link href="/services" />} nativeButton={false}>
                                        Provision Now
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    })()}
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 relative overflow-hidden group">
                        <CardContent className="p-6 relative z-10">
                            <h3 className="text-lg font-bold mb-2">Upgrade Performance</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mb-6">Need more compute power? Upscale your instances with zero downtime.</p>
                            <Button variant="outline" size="sm" render={<Link href="/services" />} nativeButton={false}>
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
                                    <span className="font-bold text-primary">{subscriptions.length} Active</span>
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