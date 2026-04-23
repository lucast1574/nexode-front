"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldSeparator } from "@/components/ui/field"
import { Loader2, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Turnstile from "react-turnstile"
import { useMutation } from "@apollo/client/react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { REGISTER_MUTATION, SIGN_IN_WITH_GOOGLE } from "@/lib/graphql-operations"
import { setAuthSession, getAuthRedirectPath } from "@/lib/auth-utils"
import { RegisterData, GoogleLoginData } from "@/lib/types"

interface GoogleLoginInput {
    idToken: string;
}

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [tsToken, setTsToken] = useState("")
    const [affiliateCode, setAffiliateCode] = useState<string | undefined>()
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const ref = params.get("ref")
        if (ref) setAffiliateCode(ref)
    }, [])

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    })

    const [register] = useMutation<{ register: RegisterData }>(REGISTER_MUTATION)
    const [signInWithGoogle] = useMutation<GoogleLoginData, { input: GoogleLoginInput }>(SIGN_IN_WITH_GOOGLE)

    const [passwordChecks, setPasswordChecks] = useState({
        upper: false,
        lower: false,
        number: false,
        special: false,
        length: false,
    })

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setFormData({ ...formData, password: value })

        setPasswordChecks({
            upper: /[A-Z]/.test(value),
            lower: /[a-z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value),
            length: value.length >= 8,
        })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const allChecksPass = Object.values(passwordChecks).every(Boolean)
        if (!allChecksPass) {
            toast.error("Please meet all password requirements")
            return
        }

        if (siteKey && !tsToken) {
            toast.error("Please complete the security challenge")
            return
        }

        setIsLoading(true)

        try {
            const nameParts = formData.name.trim().split(" ")
            const first_name = nameParts[0]
            const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

            const { data } = await register({
                variables: {
                    input: {
                        email: formData.email.trim().toLowerCase(),
                        password: formData.password,
                        first_name,
                        last_name,
                        ...(affiliateCode ? { affiliateCode } : {})
                    },
                },
            })

            if (data?.register?.success) {
                toast.success("Account created successfully!")

                if (data.register.access_token || data.register.refresh_token) {
                    setAuthSession(data.register.access_token, data.register.refresh_token)
                }

                router.push(`/auth/verify-email?email=${formData.email}`)
            } else {
                toast.error(data?.register?.message || "Registration failed")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Registration failed. Please try again."
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

                toast.success("Google sign up successful!")
                window.location.href = getAuthRedirectPath(data.signInWithGoogle.user)
            } else {
                toast.error(data?.signInWithGoogle?.message || "Google sign up failed")
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
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Enter your details below to create your account
                </p>
            </div>

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handlePasswordChange}
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

                    {formData.password && (
                        <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                            <ul className="grid grid-cols-1 gap-1.5 text-xs">
                                <PasswordRequirement met={passwordChecks.length} text="At least 8 characters" />
                                <PasswordRequirement met={passwordChecks.upper} text="One uppercase letter" />
                                <PasswordRequirement met={passwordChecks.lower} text="One lowercase letter" />
                                <PasswordRequirement met={passwordChecks.number} text="One number" />
                                <PasswordRequirement met={passwordChecks.special} text="One special character" />
                            </ul>
                        </div>
                    )}
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
                    <Button id="btn-register-submit" type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
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
                                onError={() => toast.error("Google Sign Up Failed")}
                                theme="outline"
                                width="100%"
                            />
                        </div>
                    </div>
                </Field>
                )}
            </FieldGroup>

            <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                    Sign in
                </Link>
            </FieldDescription>
        </form>
    )
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
    return (
        <li className="flex items-center gap-2">
            {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={met ? "text-foreground" : "text-muted-foreground"}>{text}</span>
        </li>
    )
}