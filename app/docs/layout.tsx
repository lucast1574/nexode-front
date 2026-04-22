import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Documentation — Nexode",
  description: "Learn how to deploy and manage your infrastructure with Nexode.",
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo/logo_white.svg"
              alt="Nexode"
              width={90}
              height={24}
              className="h-6 w-auto"
              priority
            />
          </Link>
          <div className="flex-1" />
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard/services"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Services
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {children}
      </div>
    </div>
  )
}
