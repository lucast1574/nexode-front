"use client"

import React, { useState, useEffect } from "react"
import { useDashboard } from "@/app/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UsersIcon, MailIcon, StarIcon, Trash2Icon, Loader2Icon, UserCircle } from "lucide-react"

interface WorkspaceMember {
    id: string
    email: string
    role: string
    status: string // "PENDING" | "ACTIVE"
    joinedAt?: string
}

export default function WorkspacePage() {
    const { user, subscriptions } = useDashboard()
    const [loading, setLoading] = useState(false)
    const [emailInput, setEmailInput] = useState("")
    const [members, setMembers] = useState<WorkspaceMember[]>([])
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const hasActivePlan = subscriptions.some(sub => sub.status === "ACTIVE")
    const isOwner = user?.role?.slug === "superuser" || user?.role?.slug === "admin" || hasActivePlan

    const fetchMembers = React.useCallback(async () => {
        try {
            setLoading(true)
            setTimeout(() => {
                setMembers([
                    {
                        id: "1",
                        email: user?.email || "owner@example.com",
                        role: "owner",
                        status: "ACTIVE",
                        joinedAt: "2026-04-01T12:00:00Z"
                    }
                ])
                setLoading(false)
            }, 800)
        } catch (error) {
            console.error("Failed to fetch members", error)
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        // eslint-disable-next-line
        fetchMembers()
    }, [fetchMembers])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage("")
        setSuccessMessage("")

        if (!emailInput || !emailInput.includes("@")) {
            setErrorMessage("Please enter a valid email address.")
            return
        }

        const pendingOrActiveMembersCount = members.filter(m => m.role !== "owner").length
        if (pendingOrActiveMembersCount >= 3) {
            setErrorMessage("You have reached the maximum limit of 3 invited members.")
            return
        }

        try {
            setLoading(true)
            setTimeout(() => {
                setMembers(prev => [...prev, {
                    id: Math.random().toString(),
                    email: emailInput,
                    role: "user",
                    status: "PENDING",
                    joinedAt: new Date().toISOString()
                }])
                setSuccessMessage(`Invitation successfully sent to ${emailInput}.`)
                setEmailInput("")
                setLoading(false)
            }, 1000)
        } catch (error) {
            console.error(error)
            setErrorMessage("An error occurred while sending the invitation.")
            setLoading(false)
        }
    }

    const handleRemoveMember = (id: string) => {
         setMembers(prev => prev.filter(m => m.id !== id))
    }

    const allowedInvites = 3
    const usedInvites = members.filter(m => m.role !== "owner").length
    const isInviteDisabled = loading || usedInvites >= allowedInvites || !isOwner

    if (!user) return null

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Workspace</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
                    <p className="text-muted-foreground">
                        Manage your team members and their access to your Nexode resources.
                        As a PaaS subscriber, you can invite up to 3 members to collaborate.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Invite Card */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MailIcon className="size-5 text-primary" />
                                Invite Member
                            </CardTitle>
                            <CardDescription>
                                Send an email invitation. They will be added as a &apos;user&apos;.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!isOwner ? (
                                <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20 text-sm text-destructive font-medium text-center">
                                    You must have an active subscription to invite members.
                                </div>
                            ) : (
                                <form onSubmit={handleInvite} className="space-y-4">
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="colleague@example.com"
                                            type="email"
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            disabled={isInviteDisabled}
                                        />
                                        {errorMessage && (
                                            <p className="text-destructive text-xs font-medium">{errorMessage}</p>
                                        )}
                                        {successMessage && (
                                            <p className="text-emerald-600 text-xs font-medium">{successMessage}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2 mb-4 text-xs text-muted-foreground">
                                        <span>Invites unused: {allowedInvites - usedInvites} / {allowedInvites}</span>
                                        <div className="flex gap-1">
                                            {Array.from({ length: allowedInvites }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`size-2 rounded-full ${i < usedInvites ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        type="submit"
                                        disabled={isInviteDisabled || !emailInput}
                                    >
                                        {loading ? <Loader2Icon className="size-4 animate-spin mr-2" /> : null}
                                        Send Invitation
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Members List */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UsersIcon className="size-5 text-muted-foreground" />
                                Current Members
                            </CardTitle>
                            <CardDescription>
                                Users lose access if the workspace owner&apos;s subscription becomes inactive.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-muted size-8 rounded-full flex items-center justify-center border">
                                                        <UserCircle className="size-5 text-muted-foreground" />
                                                    </div>
                                                    <span className="font-medium">{member.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {member.role === "owner" ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <StarIcon className="size-3" />
                                                        Owner
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">User</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {member.status === "PENDING" ? (
                                                    <Badge variant="secondary" className="text-orange-600 dark:text-orange-400">Pending</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400">Active</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {member.role !== "owner" && isOwner && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                    >
                                                        <Trash2Icon className="size-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {members.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                No members found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
