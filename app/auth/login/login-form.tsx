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

                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <Field>
                    <div className="relative w-full">
                        <Button variant="outline" className="w-full gap-2 pointer-events-none">
                            <svg className="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </Button>
                        <div className="absolute inset-0 opacity-0">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error("Google Login Failed")}
                                theme="outline"
                                width="100%"
                            />
                        </div>
                    </div>
                </Field>
                )}

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