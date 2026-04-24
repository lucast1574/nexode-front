"use client"

import React, { useEffect, useState, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getAccessToken, setAuthSession } from "@/lib/auth-utils"

interface DashboardUser {
    first_name: string
    last_name?: string
    email: string
    avatar?: string
    role: {
        slug: string
    }
    github_profile?: {
        username: string
        avatar_url?: string
    }
    gitlab_profile?: {
        username: string
        avatar_url?: string
    }
}

export interface Subscription {
    id: string
    service: string
    status: string
    /**
     * End-of-period timestamp. During a trial this is the trial end date;
     * otherwise it's the current Stripe billing period end.
     */
    expired_at?: string
    plan: {
        name: string
        slug: string
        features: Record<string, string>
    }
}

export interface DeployedInstance {
    _id: string
    name: string
    type: string
    status: string
    service: 'database' | 'compute' | 'n8n'
    created_on: string
    domain?: string
}

interface DashboardContextType {
    user: DashboardUser | null
    subscriptions: Subscription[]
    loading: boolean
    refetch: () => Promise<void>
    deployedCounts: Record<string, number>
    deployedInstances: DeployedInstance[]
}

const DashboardContext = createContext<DashboardContextType>({
    user: null,
    subscriptions: [],
    loading: true,
    refetch: async () => {},
    deployedCounts: {},
    deployedInstances: [],
})

export const useDashboard = () => useContext(DashboardContext)

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [loading, setLoading] = useState(true)
    const [statusMessage, setStatusMessage] = useState("Authenticating System...")
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [user, setUser] = useState<DashboardUser | null>(null)
    const [deployedCounts, setDeployedCounts] = useState<Record<string, number>>({})
    const [deployedInstances, setDeployedInstances] = useState<DeployedInstance[]>([])
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const router = useRouter()

    const fetchData = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search)
            const sessionId = urlParams.get("session_id")
            let token = getAccessToken()
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql"

            if (sessionId) {
                setStatusMessage("Initializing Secure Session...")

                const stripeMutation = `
                    mutation StripeLogin($sessionId: String!) {
                        stripeLogin(sessionId: $sessionId) {
                            success
                            access_token
                            refresh_token
                            user {
                                first_name
                                last_name
                                email
                                avatar
                                role { slug }
                                subscription {
                                    status
                                    plan {
                                        slug
                                    }
                                }
                            }
                        }
                    }
                `

                try {
                    const stripeRes = await fetch(GQL_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            query: stripeMutation,
                            variables: { sessionId },
                        }),
                    })
                    const stripeResult = await stripeRes.json()

                    if (stripeResult.data?.stripeLogin?.success) {
                        const { access_token, refresh_token, user } = stripeResult.data.stripeLogin
                        setAuthSession(access_token, refresh_token, user)
                        token = access_token
                        window.history.replaceState({}, document.title, "/dashboard")
                    }
                } catch (err) {
                    console.error("[Dashboard] Stripe login mutation error:", err)
                }
            }

            if (!token) {
                setIsAuthorized(false)
                router.push("/auth/login")
                return
            }

            setStatusMessage("Loading Infrastructure...")
            const query = `
                query GetDashboardData {
                    me {
                        first_name
                        last_name
                        email
                        avatar
                        role { slug }
                        trial_used
                        github_profile { username avatar_url }
                        gitlab_profile { username avatar_url }
                    }
                    mySubscriptions {
                        id
                        service
                        status
                        expired_at
                        plan {
                            name
                            slug
                            features
                        }
                    }
                    myDatabases { _id name type status created_on }
                    myComputeInstances { _id name type status generated_domain created_on }
                    n8nInstances { _id name status generated_domain created_on }
                }
            `

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ query }),
            })

            const result = await response.json()

            if (result.data) {
                setUser(result.data.me)
                const allSubs = result.data.mySubscriptions || []
                // We now allow all active subscriptions, including 'nexus' (the platform base plan)
                // to ensure users can access the dashboard overview even if they don't have paid services yet.
                const validSubs = allSubs.filter(
                    (s: Subscription) => s && s.status === "ACTIVE"
                )

                const userRole = result.data.me?.role?.slug;
                const isStaff = userRole === "superuser" || userRole === "admin";

                if (validSubs.length === 0 && !isStaff) {
                    setIsAuthorized(false)
                    router.push("/dashboard/services")
                    return
                }

                const sortedSubs = [...validSubs].sort((a, b) => {
                    if (a.service === "n8n") return -1
                    if (b.service === "n8n") return 1
                    return 0
                })

                setSubscriptions(sortedSubs)

                const dbs: DeployedInstance[] = (result.data.myDatabases || []).map((d: { _id: string, name: string, type: string, status: string, created_on: string }) => ({ ...d, service: 'database' as const }))
                const computes: DeployedInstance[] = (result.data.myComputeInstances || []).map((c: { _id: string, name: string, type: string, status: string, created_on: string, generated_domain?: string }) => ({ ...c, service: 'compute' as const, domain: c.generated_domain }))
                const n8ns: DeployedInstance[] = (result.data.n8nInstances || []).map((n: { _id: string, name: string, status: string, created_on: string, generated_domain?: string }) => ({ ...n, service: 'n8n' as const, domain: n.generated_domain, type: 'automation' }))
                const allDeployed = [...dbs, ...computes, ...n8ns]

                setDeployedInstances(allDeployed)
                setDeployedCounts({
                    database: dbs.length,
                    compute: computes.length,
                    n8n: n8ns.length,
                })
                setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
                router.push("/auth/login")
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error)
            setIsAuthorized(false)
            router.push("/auth/login")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        
        // Auto-sync dashboard data every 15 seconds for real-time consistency
        const interval = setInterval(() => {
            // Only re-fetch if we are already authorized and not currently loading via another call
            if (isAuthorized) fetchData()
        }, 15000)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthorized])

    if (loading || isAuthorized === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm animate-pulse">
                        {statusMessage}
                    </p>
                </div>
            </div>
        )
    }

    if (!isAuthorized) return null

    return (
        <DashboardContext.Provider value={{ user, subscriptions, loading, refetch: fetchData, deployedCounts, deployedInstances }}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </DashboardContext.Provider>
    )
}