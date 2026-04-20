"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Loader2, Eye, EyeOff, Lock } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@apollo/client/react"
import { RESET_PASSWORD_MUTATION } from "@/lib/graphql-mutations"

interface ResetPasswordData {
    resetPassword: {
        success: boolean
        message: string
    }
}

export function ResetPasswordForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token") || ""

    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [resetPassword] = useMutation<ResetPasswordData>(RESET_PASSWORD_MUTATION)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!token) {
            toast.error("Invalid or expired reset token")
            return
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        setIsLoading(true)

        try {
            const { data } = await resetPassword({
                variables: { token, password },
            })

            if (data?.resetPassword?.success) {
                toast.success("Password updated successfully")
                router.push("/auth/login")
            } else {
                toast.error(data?.resetPassword?.message || "Failed to reset password")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Something went wrong. Please try again."
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                        <Lock className="size-5 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold">Invalid link</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        This password reset link is invalid or has expired.
                    </p>
                </div>
                <FieldDescription className="text-center">
                    <a href="/auth/forgot-password" className="underline underline-offset-4">
                        Request a new link
                    </a>
                </FieldDescription>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Reset password</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Enter your new password below
                </p>
            </div>

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="password">New Password</FieldLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-9"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center justify-center w-9 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>
                </Field>

                <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input
                        id="confirm-password"
                        name="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </Field>

                <Field>
                    <Button id="btn-reset-submit" type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Reset password"
                        )}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
