"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Loader2, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@apollo/client/react"
import { FORGOT_PASSWORD_MUTATION } from "@/lib/graphql-mutations"

interface ForgotPasswordData {
    forgotPassword: {
        success: boolean
        message: string
    }
}

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [email, setEmail] = useState("")

    const [forgotPassword] = useMutation<ForgotPasswordData>(FORGOT_PASSWORD_MUTATION)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { data } = await forgotPassword({
                variables: { email: email.trim().toLowerCase() },
            })

            if (data?.forgotPassword?.success) {
                toast.success("Check your email for reset instructions")
                setSent(true)
            } else {
                toast.error(data?.forgotPassword?.message || "Failed to send reset email")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Something went wrong. Please try again."
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    if (sent) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <KeyRound className="size-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Check your email</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        We&apos;ve sent a password reset link to <strong>{email}</strong>
                    </p>
                </div>
                <FieldDescription className="text-center">
                    <Link href="/auth/login" className="underline underline-offset-4">
                        Back to login
                    </Link>
                </FieldDescription>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Forgot password?</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Enter your email and we&apos;ll send you a reset link
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
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Field>

                <Field>
                    <Button id="btn-forgot-submit" type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send reset link"
                        )}
                    </Button>
                </Field>
            </FieldGroup>

            <FieldDescription className="text-center">
                Remember your password?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                    Sign in
                </Link>
            </FieldDescription>
        </form>
    )
}
