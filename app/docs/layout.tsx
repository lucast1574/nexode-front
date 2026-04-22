import type { Metadata } from "next"
import { DocsSidebar } from "@/components/docs-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

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
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
