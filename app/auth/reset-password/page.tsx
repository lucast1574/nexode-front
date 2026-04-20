import AuthLayout from "@/components/AuthLayout"
import { ResetPasswordForm } from "./reset-password-form"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
    title: "Reset Password | Nexode",
    description: "Set a new password for your Nexode account",
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout>
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthLayout>
    )
}
