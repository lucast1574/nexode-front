"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Loader2, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Turnstile from "react-turnstile"
import { useMutation } from "@apollo/client/react"
import { REGISTER_MUTATION } from "@/lib/graphql-mutations"
import { setAuthSession } from "@/lib/auth-utils"
import { RegisterData } from "@/lib/types"

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