"use client"

import Link from "next/link"
import { NotificationBell } from "@/components/NotificationBell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { MessageCircle, ArrowRight, Plus } from "lucide-react"

export default function HelpPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Help</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1" />
        <div className="mr-2">
          <NotificationBell badgeColor="bg-primary" iconColor="text-primary" />
        </div>
        <Button render={<Link href="/dashboard/services" />} nativeButton={false} className="gap-2">
          <Plus className="size-4" /> New Service
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground">Get in touch with our support team.</p>
        </div>

        <div className="max-w-md">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <MessageCircle className="text-primary size-5" />
                </div>
                <div>
                  <CardTitle>WhatsApp Support</CardTitle>
                  <CardDescription>Chat with us directly for quick assistance.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                render={
                  <Link
                    href="https://wa.me/51920789569"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                nativeButton={false}
                className="w-full h-12 gap-2"
              >
                <MessageCircle className="size-4" />
                Open WhatsApp
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
