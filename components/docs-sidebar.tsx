"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Rocket, Cpu, Database, Workflow, CreditCard, Users, Zap } from "lucide-react"

const docGroups = [
  {
    label: "Getting Started",
    items: [{ title: "Quick Start Guide", id: "quickstart", icon: Rocket }],
  },
  {
    label: "Services",
    items: [
      { title: "Compute Instances", id: "compute", icon: Cpu },
      { title: "Databases", id: "databases", icon: Database },
      { title: "n8n Automations", id: "n8n", icon: Workflow },
    ],
  },
  {
    label: "Account & Billing",
    items: [
      { title: "Billing & Plans", id: "billing", icon: CreditCard },
      { title: "Workspaces & Teams", id: "workspace", icon: Users },
      { title: "Affiliate Program", id: "affiliates", icon: Zap },
    ],
  },
]

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeId, setActiveId] = useState("quickstart")

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash && docGroups.some((g) => g.items.some((i) => i.id === hash))) {
      setActiveId(hash)
    }
    const handleHashChange = () => {
      const newHash = window.location.hash.replace("#", "")
      if (newHash && docGroups.some((g) => g.items.some((i) => i.id === newHash))) {
        setActiveId(newHash)
      }
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleClick = (id: string) => {
    window.location.hash = id
    setActiveId(id)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              className="focus-visible:ring-0 focus:ring-0"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white">
                <span className="text-sm font-semibold">N</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Nexode</span>
                <span className="truncate text-xs">Documentation</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {docGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeId === item.id}
                    onClick={() => handleClick(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />}>
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
