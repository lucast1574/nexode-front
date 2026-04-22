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
import { LayoutDashboard, Workflow, Cpu, Database, BarChart3, BookOpen, HelpCircle, TrendingUp, Shield } from "lucide-react"

import { useDashboard } from "@/app/dashboard/layout"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, subscriptions } = useDashboard()

  const isSuperuser = user?.role?.slug === "superuser"
  // Admins see the Admin Panel link but DO NOT get bypass access to services
  // they haven't paid for. Database/Compute still require a real subscription.
  // n8n appears because admins receive a free Ultra-tier n8n subscription from
  // the backend seed (admin-n8n-free plan), so subscriptions.some(...) will match.
  const isStaff = isSuperuser || user?.role?.slug === "admin"
  const hasDatabase = isSuperuser || subscriptions.some((s) => s.service === "database")
  const hasN8n = isSuperuser || subscriptions.some((s) => s.service === "n8n")
  const hasCompute = isSuperuser || subscriptions.some((s) => s.service === "compute")

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
  ].filter((item) => item !== undefined)

  const userName = user ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}` : "User"
  const userEmail = user?.email || "user@nexode.com"
  const userAvatar = user?.avatar || ""

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} className="focus-visible:ring-0 focus:ring-0">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white">
                <span className="text-sm font-semibold">N</span>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard/affiliates" />}>
              <TrendingUp />
              <span>Affiliates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/docs" />}>
              <BookOpen />
              <span>Documentation</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard/help" />}>
              <HelpCircle />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isStaff && (
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/dashboard/admin" />}>
                <Shield />
                <span>Admin Panel</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
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