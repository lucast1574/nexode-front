import AuthLayout from "@/components/AuthLayout"
import { ForgotPasswordForm } from "./forgot-password-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Forgot Password | Nexode",
    description: "Reset your Nexode account password",
}

export default function ForgotPasswordPage() {
    return (
        <AuthLayout>
            <ForgotPasswordForm />
        </AuthLayout>
    )
}
