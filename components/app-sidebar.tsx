"use client"

import * as React from "react"
import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Workflow, Cpu, Database, BarChart3, CreditCard, Settings } from "lucide-react"

import { useDashboard } from "@/app/dashboard/layout"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, subscriptions } = useDashboard()

  const hasDatabase = subscriptions.some((s) => s.service === "database")
  const hasN8n = subscriptions.some((s) => s.service === "n8n")
  const hasCompute = subscriptions.some((s) => s.service === "compute")

  const navItems = [
    {
      title: "Overview",
      url: "/dashboard",
      icon: <LayoutDashboard />,
      items: undefined,
    },
    ...(hasN8n
      ? [{
          title: "Automations",
          url: "/dashboard/automations",
          icon: <Workflow />,
          items: undefined,
        }]
      : []),
    ...(hasCompute
      ? [{
          title: "Compute",
          url: "/dashboard/compute",
          icon: <Cpu />,
          items: undefined,
        }]
      : []),
    ...(hasDatabase
      ? [{
          title: "Databases",
          url: "/dashboard/databases",
          icon: <Database />,
          items: undefined,
        }]
      : []),
    {
      title: "Metrics",
      url: "/dashboard/metrics",
      icon: <BarChart3 />,
      items: undefined,
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: <CreditCard />,
      items: undefined,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings />,
      items: undefined,
    },
  ].filter((item) => item !== undefined)

  const userName = user ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}` : "User"
  const userEmail = user?.email || "user@nexode.com"
  const userAvatar = user?.avatar || ""

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-black">N</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Nexode</span>
                <span className="truncate text-xs">Cloud Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userName,
            email: userEmail,
            avatar: userAvatar,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}