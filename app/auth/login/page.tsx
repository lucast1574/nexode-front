import AuthLayout from "@/components/AuthLayout"
import { LoginForm } from "./login-form"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
    title: "Login | Nexode",
    description: "Login to your Nexode account",
}

export default function LoginPage() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    )
}
