"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Turnstile from "react-turnstile"

import { useMutation } from "@apollo/client/react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { LOGIN_MUTATION, SIGN_IN_WITH_GOOGLE } from "@/lib/graphql-mutations"
import { setAuthSession, getAuthRedirectPath } from "@/lib/auth-utils"
import { LoginData, GoogleLoginData } from "@/lib/types"

interface LoginInput {
    email: string;
    password?: string;
}

interface GoogleLoginInput {
    idToken: string;
}

export function LoginForm() {
    const router = useRouter()
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
                router.push(getAuthRedirectPath(data.login.user))
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
                router.push(getAuthRedirectPath(data.signInWithGoogle.user))
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email to sign in to your account
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
                        autoComplete="email"
                    />
                </Field>

                <Field>
                    <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <a
                            id="link-forgot-password"
                            href="/auth/forgot-password"
                            className="text-xs text-primary hover:underline underline-offset-4"
                        >
                            Forgot password?
                        </a>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            className="pr-10"
                        />
                        <button
                            id="btn-toggle-password"
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
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

                <Button id="btn-login-submit" type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </Button>

                <FieldSeparator>Or continue with</FieldSeparator>

                <div className="flex justify-center w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Google Login Failed")}
                        useOneTap
                        theme="outline"
                        width="100%"
                    />
                </div>
            </FieldGroup>

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a id="link-signup" href="/auth/register" className="font-semibold text-primary hover:underline underline-offset-4">
                    Sign up
                </a>
            </p>
        </form>
    )
}
