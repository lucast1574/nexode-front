"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@apollo/client/react"
import { VERIFY_EMAIL_MUTATION } from "@/lib/graphql-mutations"
import { setAuthSession } from "@/lib/auth-utils"
import { VerifyEmailData } from "@/lib/types"

export function VerifyForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")

    const [verifyEmail] = useMutation<VerifyEmailData>(VERIFY_EMAIL_MUTATION)

    const handleAutoSubmit = useCallback(async (autoEmail: string, autoCode: string) => {
        setIsLoading(true)
        try {
            const { data } = await verifyEmail({
                variables: { email: autoEmail, code: autoCode },
            })
            if (data?.verifyEmail?.success) {
                toast.success("Email verified successfully!")
                setAuthSession(data.verifyEmail.access_token, data.verifyEmail.refresh_token, data.verifyEmail.user)
                router.push("/checkout")
            } else {
                toast.error(data?.verifyEmail?.message || "Verification failed")
            }
        } catch (error: unknown) {
            console.error("Auto-verification error:", error)
            toast.error("Auto-verification failed. Please check the code and try manually.")
        } finally {
            setIsLoading(false)
        }
    }, [verifyEmail, router])

    useEffect(() => {
        const emailFromQuery = searchParams.get("email")
        const codeFromQuery = searchParams.get("code")

        if (emailFromQuery) {
            setEmail(emailFromQuery)
        }

        if (codeFromQuery) {
            const upCode = codeFromQuery.toUpperCase()
            setCode(upCode)

            // Auto-submit if both are present and we haven't submitted yet
            if (emailFromQuery && upCode.length === 6 && !isLoading) {
                // Use a small timeout to ensure states are updated
                const timer = setTimeout(() => {
                    handleAutoSubmit(emailFromQuery, upCode)
                }, 500)
                return () => clearTimeout(timer)
            }
        }
    }, [searchParams, isLoading, handleAutoSubmit])

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault()

        if (!email) {
            toast.error("Please provide your email address")
            return
        }

        if (code.length !== 6) {
            toast.error("Verification code must be 6 characters")
            return
        }

        setIsLoading(true)

        try {
            const { data } = await verifyEmail({
                variables: {
                    email,
                    code,
                },
            })

            if (data?.verifyEmail?.success) {
                toast.success("Email verified successfully!")

                setAuthSession(
                    data.verifyEmail.access_token,
                    data.verifyEmail.refresh_token,
                    data.verifyEmail.user
                )

                router.push("/checkout")
            } else {
                toast.error(data?.verifyEmail?.message || "Verification failed")
            }
        } catch (error: unknown) {
            console.error("Verification error:", error)
            const message = error instanceof Error ? error.message : "Verification failed. Please try again."
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Verify your email</h1>
                <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a 6-digit verification code to your email
                </p>
            </div>

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="email">Email address</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="code">Verification Code</FieldLabel>
                    <Input
                        id="code"
                        name="code"
                        type="text"
                        placeholder="ABCXYZ"
                        required
                        maxLength={6}
                        className="text-center text-2xl tracking-[0.5em] font-bold uppercase"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                </Field>

                <Button id="btn-verify-submit" type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify Email"
                    )}
                </Button>
            </FieldGroup>

            <p className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                <button
                    id="btn-resend-code"
                    type="button"
                    className="font-semibold text-primary hover:underline underline-offset-4"
                    onClick={() => toast.info("Resend logic coming soon!")}
                >
                    Resend
                </button>
            </p>
        </form>
    )
}
