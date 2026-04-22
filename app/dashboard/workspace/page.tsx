"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useDashboard } from "@/app/dashboard/layout"
import { NotificationBell } from "@/components/NotificationBell"
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
import { toast } from "sonner"
import { getAccessToken } from "@/lib/auth-utils"

const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql"

interface WorkspaceMember {
    user_id: string
    role: string
    added_at: string
}

interface Workspace {
    id: string
    _id: string
    name: string
    slug: string
    description?: string
    owner_id: string
    members: WorkspaceMember[]
}

async function gqlRequest(query: string, variables?: Record<string, unknown>) {
    const token = getAccessToken()
    const res = await fetch(GQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ query, variables }),
    })
    return res.json()
}

export default function WorkspacePage() {
    const { user, subscriptions } = useDashboard()
    const [loading, setLoading] = useState(true)
    const [inviting, setInviting] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [emailInput, setEmailInput] = useState("")
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const hasActivePlan = subscriptions.some(sub => sub.status === "ACTIVE")
    const isOwner = user?.role?.slug === "superuser" || user?.role?.slug === "admin" || hasActivePlan

    // Get max team members from subscription plan
    const maxMembers = (() => {
        const activeSub = subscriptions.find(s => s.status === "ACTIVE")
        const features = (activeSub as any)?.plan?.features
        if (!features) return 0
        return typeof features === 'object' ? (features.max_team_members || features.team_members || 0) : 0
    })()

    const fetchWorkspace = useCallback(async () => {
        try {
            setLoading(true)
            const result = await gqlRequest(`
                query GetMyWorkspaces {
                    getMyWorkspaces {
                        id
                        _id
                        name
                        slug
                        owner_id
                        members {
                            user_id
                            role
                            added_at
                        }
                    }
                }
            `)

            if (result.data?.getMyWorkspaces?.length > 0) {
                setWorkspace(result.data.getMyWorkspaces[0])
            }
        } catch (error) {
            console.error("Failed to fetch workspace", error)
            toast.error("Failed to load workspace")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWorkspace()
    }, [fetchWorkspace])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage("")
        setSuccessMessage("")

        if (!emailInput || !emailInput.includes("@")) {
            setErrorMessage("Please enter a valid email address.")
            return
        }

        if (!workspace) {
            setErrorMessage("No workspace found.")
            return
        }

        try {
            setInviting(true)
            const result = await gqlRequest(`
                mutation InviteWorkspaceMember($input: InviteWorkspaceMemberInput!) {
                    inviteWorkspaceMember(input: $input) {
                        id
                        members {
                            user_id
                            role
                            added_at
                        }
                    }
                }
            `, {
                input: {
                    workspaceId: workspace._id,
                    email: emailInput.trim().toLowerCase(),
                }
            })

            if (result.errors) {
                const msg = result.errors[0]?.message || "Failed to send invitation"
                setErrorMessage(msg)
                return
            }

            if (result.data?.inviteWorkspaceMember) {
                setWorkspace(prev => prev ? {
                    ...prev,
                    members: result.data.inviteWorkspaceMember.members
                } : null)
                setSuccessMessage(`Invitation sent to ${emailInput}`)
                setEmailInput("")
                toast.success(`Invitation sent to ${emailInput}`)
            }
        } catch (error) {
            console.error(error)
            setErrorMessage("An error occurred while sending the invitation.")
        } finally {
            setInviting(false)
        }
    }

    const handleRemoveMember = async (memberUserId: string) => {
        if (!workspace) return

        try {
            setRemovingId(memberUserId)
            const result = await gqlRequest(`
                mutation RemoveWorkspaceMember($workspaceId: ID!, $memberUserId: ID!) {
                    removeWorkspaceMember(workspaceId: $workspaceId, memberUserId: $memberUserId) {
                        id
                        members {
                            user_id
                            role
                            added_at
                        }
                    }
                }
            `, {
                workspaceId: workspace._id,
                memberUserId,
            })

            if (result.errors) {
                toast.error(result.errors[0]?.message || "Failed to remove member")
                return
            }

            if (result.data?.removeWorkspaceMember) {
                setWorkspace(prev => prev ? {
                    ...prev,
                    members: result.data.removeWorkspaceMember.members
                } : null)
                toast.success("Member removed")
            }
        } catch (error) {
            toast.error("Failed to remove member")
        } finally {
            setRemovingId(null)
        }
    }

    const members = workspace?.members || []
    const nonOwnerMembers = members.filter(m => m.role !== "owner")
    const usedInvites = nonOwnerMembers.length
    const allowedInvites = maxMembers || 3
    const isInviteDisabled = inviting || usedInvites >= allowedInvites || !isOwner || !workspace

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
                <div className="flex-1" />
                <div className="mr-2">
                    <NotificationBell badgeColor="bg-primary" iconColor="text-primary" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
                    <p className="text-muted-foreground">
                        Manage your team members and their access to your Nexode resources.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2Icon className="size-8 animate-spin text-primary" />
                    </div>
                ) : !workspace ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No workspace found. Subscribe to a plan to get started.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Invite Card */}
                        <Card className="md:col-span-1 h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MailIcon className="size-5 text-primary" />
                                    Invite Member
                                </CardTitle>
                                <CardDescription>
                                    Send an email invitation to add a team member.
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
                                            <span>Slots used: {usedInvites} / {allowedInvites}</span>
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
                                            {inviting ? <Loader2Icon className="size-4 animate-spin mr-2" /> : null}
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
                                    Members — {workspace.name}
                                </CardTitle>
                                <CardDescription>
                                    {members.length} member{members.length !== 1 ? 's' : ''} in this workspace.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.map((member) => (
                                            <TableRow key={member.user_id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-muted size-8 rounded-full flex items-center justify-center border">
                                                            <UserCircle className="size-5 text-muted-foreground" />
                                                        </div>
                                                        <span className="font-medium font-mono text-xs">{member.user_id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {member.role === "owner" ? (
                                                        <Badge variant="default" className="gap-1">
                                                            <StarIcon className="size-3" />
                                                            Owner
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">Member</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {member.added_at ? new Date(member.added_at).toLocaleDateString() : '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {member.role !== "owner" && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveMember(member.user_id)}
                                                            disabled={removingId === member.user_id}
                                                        >
                                                            {removingId === member.user_id ? (
                                                                <Loader2Icon className="size-4 animate-spin" />
                                                            ) : (
                                                                <Trash2Icon className="size-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {members.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    No members yet. Invite someone to get started.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    )
}
