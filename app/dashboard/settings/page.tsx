"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    CreditCard,
    Plus,
    User,
    Shield,
    Bell,
    Save,
    ChevronRight,
    Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAccessToken, getAuthUser, setAuthSession } from "@/lib/auth-utils"
import { User as UserType } from "@/lib/types"
import { Subscription } from "@/app/dashboard/layout"
import { Switch } from "@/components/ui/switch"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isTogglingNotifications, setIsTogglingNotifications] = useState(false)
    const [user, setUser] = useState<UserType | null>(null)
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        notifications_enabled: true,
        avatar: "",
    })
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getAccessToken()
                const u = getAuthUser()

                if (!token || !u) {
                    router.push("/auth/login")
                    return
                }

                setUser(u)
                setFormData({
                    first_name: u.first_name || "",
                    last_name: u.last_name || "",
                    email: u.email || "",
                    notifications_enabled: u.notifications_enabled ?? true,
                    avatar: u.avatar || "",
                })

                const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql"
                const query = `
                    query GetSettingsData {
                        me {
                           first_name
                           last_name
                           email
                           avatar
                           notifications_enabled
                        }
                        mySubscriptions {
                            id
                            service
                            status
                            plan {
                                name
                                slug
                                features
                            }
                        }
                    }
                `

                const response = await fetch(GQL_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ query }),
                })

                const result = await response.json()
                if (result.data) {
                    if (result.data.me) {
                        const uFull = result.data.me
                        setUser(uFull)
                        setFormData({
                            first_name: uFull.first_name || "",
                            last_name: uFull.last_name || "",
                            email: uFull.email || "",
                            notifications_enabled: uFull.notifications_enabled ?? true,
                            avatar: uFull.avatar || "",
                        })
                        setAuthSession(undefined, undefined, uFull)
                    }
                    if (result.data.mySubscriptions) {
                        const allSubs = result.data.mySubscriptions || []
                        setSubscriptions(allSubs.filter((s: Subscription) => s && s.status === 'ACTIVE'))
                    }
                }

                setLoading(false)
            } catch (error) {
                console.error("Settings fetch error:", error)
                router.push("/auth/login")
            }
        }

        fetchData()
    }, [router])

    const handleSave = async (e?: React.FormEvent, overrideData?: Partial<typeof formData>) => {
        if (e) {
            e.preventDefault()
            setIsSaving(true)
        } else {
            setIsTogglingNotifications(true)
        }

        const token = getAccessToken()
        if (!token) return

        try {
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql"
            const currentData = { ...formData, ...overrideData }

            const query = `
                mutation UpdateMe($input: UpdateUserInput!) {
                    updateMe(input: $input) {
                        id
                        first_name
                        last_name
                        email
                        notifications_enabled
                        avatar
                    }
                }
            `

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query,
                    variables: {
                        input: {
                            first_name: currentData.first_name,
                            last_name: currentData.last_name,
                            notifications_enabled: currentData.notifications_enabled,
                            avatar: currentData.avatar
                        }
                    }
                }),
            })

            const result = await response.json()
            if (result.data?.updateMe) {
                const updated = result.data.updateMe
                setAuthSession(undefined, undefined, updated)
                setUser(updated)
                setFormData(prev => ({ ...prev, ...updated }))
                toast.success("Identity synchronized", {
                    description: "User preferences updated on Nexode Core",
                    style: { background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }
                })
            } else {
                const errMsg = result.errors?.[0]?.message || "Identity update rejected by gateway"
                toast.error("Protocol Error", { description: errMsg })
            }
        } catch (error) {
            console.error("Save error:", error)
            const message = error instanceof Error ? error.message : "Could not reach Nexode API"
            toast.error("Internal Server Error", { description: message })
        } finally {
            setIsSaving(false)
            setIsTogglingNotifications(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("Invalid File", { description: "You must provide an image file" })
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File oversized", { description: "Maximum avatar size is 2MB" })
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = reader.result as string
            setFormData(prev => ({ ...prev, avatar: base64 }))
            handleSave(undefined, { avatar: base64 })
        }
        reader.readAsDataURL(file)
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-16 border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs animate-pulse">Loading Settings...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Settings</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex-1" />
                <Button render={<Link href="/services" />} nativeButton={false} className="gap-2">
                    <Plus className="size-4" /> New Service
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your system preferences and account data.</p>
                </div>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className={cn(
                                        "size-20 overflow-hidden border-2 border-border transition-all duration-500 group-hover:border-primary/50 relative",
                                        !formData.avatar && "bg-primary/10 flex items-center justify-center text-primary"
                                    )}>
                                        {formData.avatar ? (
                                            <Image
                                                src={formData.avatar}
                                                alt="Avatar"
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <User className="size-8" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <Camera className="size-6 text-white" />
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                    />
                                    {isTogglingNotifications && (
                                        <div className="absolute -bottom-1 -right-1 size-5 bg-background border border-border flex items-center justify-center">
                                            <div className="size-3 border-2 border-primary/20 border-t-primary animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center sm:text-left">
                                    <CardTitle>Identity & Profile</CardTitle>
                                    <CardDescription>Coordinate your digital credentials and profile metadata.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave}>
                                <FieldGroup>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field>
                                            <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                                            <Input
                                                id="first_name"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                placeholder="John"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                                            <Input
                                                id="last_name"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                placeholder="Doe"
                                            />
                                        </Field>
                                    </div>
                                    <Field>
                                        <FieldLabel htmlFor="email">Email Address</FieldLabel>
                                        <Input
                                            id="email"
                                            value={formData.email}
                                            readOnly
                                            className="cursor-not-allowed"
                                        />
                                        <FieldDescription>Managed via Identity Provider. Contact support to change.</FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="gap-2"
                                onClick={() => handleSave()}
                            >
                                {isSaving ? "Syncing..." : <><Save className="size-4" /> Update Identity</>}
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className={cn(
                            "transition-all duration-700",
                            formData.notifications_enabled && "border-primary/20 bg-primary/[0.02]"
                        )}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn(
                                        "p-3 transition-all duration-700",
                                        formData.notifications_enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Bell className="size-5" />
                                    </div>
                                    <Switch
                                        checked={formData.notifications_enabled}
                                        disabled={isTogglingNotifications}
                                        className={cn(
                                            "data-[checked]:bg-primary data-[checked]:hover:bg-primary",
                                            isTogglingNotifications && "opacity-50 cursor-not-allowed"
                                        )}
                                        onCheckedChange={(checked) => {
                                            const newData = { ...formData, notifications_enabled: checked }
                                            setFormData(newData)
                                            handleSave(undefined, newData)
                                        }}
                                    />
                                </div>
                                <h4 className={cn("font-bold text-lg mb-1 transition-colors", formData.notifications_enabled ? "text-primary" : "text-foreground")}>Notification Protocol</h4>
                                <p className="text-sm text-muted-foreground">Configure how the system alerts you regarding instance health, scaling events, and billing protocol.</p>
                            </CardContent>
                        </Card>

                        <Card className="hover:bg-muted/50 transition-all cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                        <Shield className="size-5" />
                                    </div>
                                    <Badge variant="outline" className="text-muted-foreground">Standard</Badge>
                                </div>
                                <h4 className="font-bold text-lg mb-1">Security & Access</h4>
                                <p className="text-sm text-muted-foreground">Manage your authentication methods, session timeout settings, and 2FA status.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Once you delete your account, there is no going back. Please be certain.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive">
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>

                    <Card
                        className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 cursor-pointer group"
                        onClick={() => router.push("/dashboard/billing")}
                    >
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="size-14 bg-primary/20 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform duration-500">
                                    <CreditCard className="size-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Billing Architecture</h3>
                                    <p className="text-sm text-muted-foreground">Manage payment methods, invoices, and cloud usage costs.</p>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}