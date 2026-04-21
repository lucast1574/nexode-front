import AuthLayout from "@/components/AuthLayout"
import { RegisterForm } from "./register-form"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
    title: "Register | Nexode",
    description: "Create your Nexode account",
}

export default function RegisterPage() {
    return (
        <AuthLayout>
            <RegisterForm />
        </AuthLayout>
    )
}
