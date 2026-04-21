"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldSeparator } from "@/components/ui/field"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Turnstile from "react-turnstile"

import { useMutation } from "@apollo/client/react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { LOGIN_MUTATION, SIGN_IN_WITH_GOOGLE } from "@/lib/graphql-operations"
import { setAuthSession, getAuthRedirectPath } from "@/lib/auth-utils"
import { LoginData, GoogleLoginData } from "@/lib/types"

interface LoginInput {
    email: string;
    password?: string;
}

interface GoogleLoginInput {
    idToken: string;
}

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [tsToken, setTsToken] = useState("")
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    const [login] = useMutation<LoginData, { input: LoginInput }>(LOGIN_MUTATION)
    const [signInWithGoogle] = useMutation<GoogleLoginData, { input: GoogleLoginInput }>(SIGN_IN_WITH_GOOGLE)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            if (siteKey && !tsToken) {
                toast.error("Please complete the security challenge")
                setIsLoading(false)
                return
            }

            const { data } = await login({
                variables: {
                    input: {
                        email: email.trim().toLowerCase(),
                        password
                    }
                }
            })

            if (data?.login?.success) {
                setAuthSession(
                    data.login.access_token,
                    data.login.refresh_token,
                    data.login.user
                )

                toast.success("Login successful!")
                window.location.href = getAuthRedirectPath(data.login.user)
            } else {
                toast.error(data?.login?.message || "Login failed")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Invalid credentials. Please try again."
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            toast.error("Google authentication failed: Missing credential")
            return
        }

        setIsLoading(true)
        try {
            const { data } = await signInWithGoogle({
                variables: {
                    input: { idToken: credentialResponse.credential }
                }
            })

            if (data?.signInWithGoogle?.success) {
                setAuthSession(
                    data.signInWithGoogle.access_token,
                    data.signInWithGoogle.refresh_token,
                    data.signInWithGoogle.user
                )

                toast.success("Google login successful!")
                window.location.href = getAuthRedirectPath(data.signInWithGoogle.user)
            } else {
                toast.error(data?.signInWithGoogle?.message || "Google login failed")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Google authentication failed"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Enter your email below to login to your account
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
                    />
                </Field>

                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Link
                            href="/auth/forgot-password"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
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

                {siteKey && (
                    <Field>
                        <Turnstile
                            sitekey={siteKey}
                            onVerify={(token) => setTsToken(token)}
                            onExpire={() => setTsToken("")}
                        />
                    </Field>
                )}

                <Field>
                    <Button id="btn-login-submit" type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Login"
                        )}
                    </Button>
                </Field>

                <FieldSeparator>Or continue with</FieldSeparator>

                <Field>
                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error("Google Login Failed")}
                            theme="outline"
                            width="100%"
                        />
                    </div>
                </Field>

                <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/register" className="underline underline-offset-4">
                        Sign up
                    </Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    )
}