"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Turnstile from "react-turnstile"

export function LoginForm() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [tsToken, setTsToken] = useState("")
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        // In a real app, you would call your auth API here
        // For now, let's simulate a login
        try {
            if (siteKey && !tsToken) {
                toast.error("Please complete the security challenge")
                setIsLoading(false)
                return
            }

            console.log("Logging in with:", { email, password })

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500))

            toast.success("Login successful!")
            router.push("/dashboard")
        } catch {
            toast.error("Invalid credentials. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        setIsLoading(true)
        // Simulate Google Sign In
        setTimeout(() => {
            setIsLoading(false)
            toast.info("Google sign-in is not configured yet.")
        }, 1000)
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

                <Button type="submit" className="w-full" disabled={isLoading}>
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

                <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Google
                </Button>
            </FieldGroup>

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="/auth/register" className="font-semibold text-primary hover:underline underline-offset-4">
                    Sign up
                </a>
            </p>
        </form>
    )
}
