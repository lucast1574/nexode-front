import AuthLayout from "@/components/AuthLayout"
import { VerifyForm } from "./verify-form"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
    title: "Verify Email | Nexode",
    description: "Verify your Nexode account email",
}

export default function VerifyEmailPage() {
    return (
        <AuthLayout>
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyForm />
            </Suspense>
        </AuthLayout>
    )
}
