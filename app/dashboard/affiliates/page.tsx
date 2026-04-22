"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useDashboard } from "@/app/dashboard/layout"
import { NotificationBell } from "@/components/NotificationBell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
    UsersIcon,
    DollarSignIcon,
    LinkIcon,
    CopyIcon,
    CheckIcon,
    Loader2Icon,
    TrendingUpIcon,
    WalletIcon,
    ArrowDownToLineIcon,
    SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"
import { getAccessToken } from "@/lib/auth-utils"

const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql"

async function gql(query: string, variables?: Record<string, unknown>) {
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

interface AffiliateStats {
    is_affiliate: boolean
    affiliate_code: string | null
    affiliate_link: string | null
    total_referrals: number
    total_converted: number
    total_commission: number
    available_balance: number
    pending_withdrawals: number
    min_withdrawal: number
    can_withdraw: boolean
}

interface Referral {
    id: string
    referred_email: string
    referred_name: string
    status: string
    first_payment: number
    commission: number
    created_at: string
    converted_at: string | null
}

interface Withdrawal {
    id: string
    amount: number
    payment_method: string
    payment_details: string
    status: string
    admin_notes?: string
    created_at: string
    paid_at?: string
}

export default function AffiliatesPage() {
    const { user } = useDashboard()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<AffiliateStats | null>(null)
    const [referrals, setReferrals] = useState<Referral[]>([])
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
    const [copied, setCopied] = useState(false)
    const [activating, setActivating] = useState(false)
    const [requesting, setRequesting] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<"cci" | "binance">("binance")
    const [paymentDetails, setPaymentDetails] = useState("")

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [statsRes, referralsRes, withdrawalsRes] = await Promise.all([
                gql(`query { myAffiliateStats { is_affiliate affiliate_code affiliate_link total_referrals total_converted total_commission available_balance pending_withdrawals min_withdrawal can_withdraw } }`),
                gql(`query { myReferrals { id referred_email referred_name status first_payment commission created_at converted_at } }`),
                gql(`query { myWithdrawals { id amount payment_method payment_details status admin_notes created_at paid_at } }`),
            ])

            if (statsRes.data?.myAffiliateStats) setStats(statsRes.data.myAffiliateStats)
            if (referralsRes.data?.myReferrals) setReferrals(referralsRes.data.myReferrals)
            if (withdrawalsRes.data?.myWithdrawals) setWithdrawals(withdrawalsRes.data.myWithdrawals)
        } catch {
            toast.error("Failed to load affiliate data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleActivate = async () => {
        setActivating(true)
        try {
            const res = await gql(`mutation { generateMyAffiliateLink { id is_affiliate affiliate_code } }`)
            if (res.errors) {
                toast.error(res.errors[0]?.message || "Failed to activate")
                return
            }
            toast.success("Affiliate program activated!")
            await fetchData()
        } finally {
            setActivating(false)
        }
    }

    const handleCopy = () => {
        if (stats?.affiliate_link) {
            navigator.clipboard.writeText(stats.affiliate_link)
            setCopied(true)
            toast.success("Link copied!")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!paymentDetails.trim()) {
            toast.error("Please enter your payment details")
            return
        }
        setRequesting(true)
        try {
            const res = await gql(`
                mutation RequestWithdrawal($input: RequestWithdrawalInput!) {
                    requestWithdrawal(input: $input) { id amount status }
                }
            `, { input: { payment_method: paymentMethod, payment_details: paymentDetails.trim() } })

            if (res.errors) {
                toast.error(res.errors[0]?.message || "Failed to request withdrawal")
                return
            }
            toast.success(`Withdrawal of $${res.data.requestWithdrawal.amount.toFixed(2)} requested!`)
            setPaymentDetails("")
            await fetchData()
        } finally {
            setRequesting(false)
        }
    }

    if (!user) return null

    if (loading) {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Affiliates</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex-1" />
                    <div className="mr-2">
                        <NotificationBell badgeColor="bg-primary" iconColor="text-primary" />
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2Icon className="size-8 animate-spin text-primary" />
                </div>
            </>
        )
    }

    // Not an affiliate yet — show activation CTA
    if (!stats?.is_affiliate) {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Affiliates</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex-1" />
                    <div className="mr-2">
                        <NotificationBell badgeColor="bg-primary" iconColor="text-primary" />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
                    <Card className="max-w-lg w-full">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 size-14 bg-primary/10 rounded-full flex items-center justify-center">
                                <SparklesIcon className="size-7 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Become an Affiliate</CardTitle>
                            <CardDescription className="mt-2">
                                Earn <span className="text-primary font-bold">10% commission</span> on every new subscriber you refer.
                                Share your unique link, and when someone subscribes, you earn money.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                                <p className="flex items-center gap-2"><CheckIcon className="size-4 text-emerald-600" /> 10% of the first payment from each referral</p>
                                <p className="flex items-center gap-2"><CheckIcon className="size-4 text-emerald-600" /> Withdraw once you reach $50</p>
                                <p className="flex items-center gap-2"><CheckIcon className="size-4 text-emerald-600" /> Pay via CCI or Binance</p>
                                <p className="flex items-center gap-2"><CheckIcon className="size-4 text-emerald-600" /> Full transparency — see who converted</p>
                            </div>
                            <Button className="w-full" size="lg" onClick={handleActivate} disabled={activating}>
                                {activating ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <LinkIcon className="size-4 mr-2" />}
                                Activate Affiliate Program
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    // Affiliate dashboard
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Affiliates</BreadcrumbPage>
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
                    <h1 className="text-2xl font-bold tracking-tight">Affiliate Dashboard</h1>
                    <p className="text-muted-foreground">Track your referrals, commissions, and withdrawals.</p>
                </div>

                {/* Affiliate Link */}
                <Card className="mb-6">
                    <CardContent className="py-4 flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                            <LinkIcon className="size-5 text-primary" />
                        </div>
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded border truncate">
                            {stats.affiliate_link}
                        </code>
                        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-2">
                            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <UsersIcon className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_referrals}</p>
                                    <p className="text-xs text-muted-foreground">Total Referrals</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <TrendingUpIcon className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_converted}</p>
                                    <p className="text-xs text-muted-foreground">Converted (Paid)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <DollarSignIcon className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">${stats.total_commission.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Total Earned</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <WalletIcon className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">${stats.available_balance.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Available Balance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Withdrawal Form */}
                    <Card className="lg:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowDownToLineIcon className="size-5 text-primary" />
                                Request Withdrawal
                            </CardTitle>
                            <CardDescription>
                                Minimum: ${stats.min_withdrawal.toFixed(2)} USD
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!stats.can_withdraw ? (
                                <div className="bg-muted p-4 rounded-lg text-center text-sm text-muted-foreground">
                                    <p className="font-medium">Balance too low</p>
                                    <p className="mt-1">You need at least ${stats.min_withdrawal.toFixed(2)} to withdraw. Current: ${stats.available_balance.toFixed(2)}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleWithdraw} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                type="button"
                                                variant={paymentMethod === "binance" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPaymentMethod("binance")}
                                            >
                                                Binance
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={paymentMethod === "cci" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPaymentMethod("cci")}
                                            >
                                                CCI
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-details">
                                            {paymentMethod === "binance" ? "Binance Pay ID / Wallet" : "CCI Number"}
                                        </Label>
                                        <Input
                                            id="payment-details"
                                            placeholder={paymentMethod === "binance" ? "Enter your Binance ID or wallet address" : "Enter your CCI number"}
                                            value={paymentDetails}
                                            onChange={(e) => setPaymentDetails(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg text-center">
                                        <p className="text-sm text-muted-foreground">Amount to withdraw</p>
                                        <p className="text-2xl font-bold text-emerald-600">${stats.available_balance.toFixed(2)}</p>
                                    </div>
                                    <Button className="w-full" type="submit" disabled={requesting}>
                                        {requesting ? <Loader2Icon className="size-4 animate-spin mr-2" /> : null}
                                        Request Withdrawal
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Referrals Table */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Your Referrals</CardTitle>
                            <CardDescription>{referrals.length} people signed up with your link</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Your Commission</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referrals.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{r.referred_name}</p>
                                                    <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {r.status === "converted" ? (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400">Paid</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Registered</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {r.first_payment > 0 ? `$${r.first_payment.toFixed(2)}` : "—"}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm font-bold text-emerald-600">
                                                {r.commission > 0 ? `+$${r.commission.toFixed(2)}` : "—"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {referrals.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                No referrals yet. Share your link to start earning!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Withdrawals History */}
                {withdrawals.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Withdrawal History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map((w) => (
                                        <TableRow key={w.id}>
                                            <TableCell className="font-bold">${w.amount.toFixed(2)}</TableCell>
                                            <TableCell className="uppercase text-xs font-medium">{w.payment_method}</TableCell>
                                            <TableCell className="font-mono text-xs">{w.payment_details}</TableCell>
                                            <TableCell>
                                                {w.status === "paid" && <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400">Paid</Badge>}
                                                {w.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                                                {w.status === "approved" && <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400">Approved</Badge>}
                                                {w.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(w.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}
