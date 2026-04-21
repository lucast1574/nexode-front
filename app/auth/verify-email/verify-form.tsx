"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@apollo/client/react"
import { VERIFY_EMAIL_MUTATION } from "@/lib/graphql-operations"
import { setAuthSession, getAuthRedirectPath } from "@/lib/auth-utils"
import { VerifyEmailData } from "@/lib/types"

export function VerifyForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
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
                window.location.href = getAuthRedirectPath(data.verifyEmail.user)
            } else {
                toast.error(data?.verifyEmail?.message || "Verification failed")
            }
        } catch (error: unknown) {
            console.error("Auto-verification error:", error)
            toast.error("Auto-verification failed. Please check the code and try manually.")
        } finally {
            setIsLoading(false)
        }
    }, [verifyEmail])

    useEffect(() => {
        const emailFromQuery = searchParams.get("email")
        const codeFromQuery = searchParams.get("code")

        if (emailFromQuery) {
            setEmail(emailFromQuery)
        }

        if (codeFromQuery) {
            const upCode = codeFromQuery.trim().toUpperCase()
            setCode(upCode)

            if (emailFromQuery && upCode.length === 6 && !isLoading) {
                const cleanEmail = emailFromQuery.trim().toLowerCase()
                const timer = setTimeout(() => {
                    handleAutoSubmit(cleanEmail, upCode)
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
            const cleanEmail = email.trim().toLowerCase()
            const cleanCode = code.trim().toUpperCase()

            const { data } = await verifyEmail({
                variables: {
                    email: cleanEmail,
                    code: cleanCode,
                },
            })

            if (data?.verifyEmail?.success) {
                toast.success("Email verified successfully!")

                setAuthSession(
                    data.verifyEmail.access_token,
                    data.verifyEmail.refresh_token,
                    data.verifyEmail.user
                )

                window.location.href = getAuthRedirectPath(data.verifyEmail.user)
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
        <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-1 text-center">
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="size-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Verify your email</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    We&apos;ve sent a 6-character verification code to your email
                </p>
            </div>

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
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
                        className="text-center text-2xl font-bold"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
                    />
                </Field>

                <Field>
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
                </Field>
            </FieldGroup>

            <FieldDescription className="text-center">
                Didn&apos;t receive the code?{" "}
                <button
                    id="btn-resend-code"
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => toast.info("A new verification code has been sent to your email.")}
                >
                    Resend
                </button>
            </FieldDescription>
        </form>
    )
}