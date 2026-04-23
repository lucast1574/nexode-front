"use client"

import Link from "next/link"
import Image from "next/image"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { Rocket, Cpu, Database, Workflow, CreditCard, Users, Zap, ExternalLink } from "lucide-react"

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
  const { state } = useSidebar()

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
              className="focus-visible:ring-0 focus:ring-0 hover:bg-transparent active:bg-transparent cursor-default"
            >
              {state === "collapsed" ? (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white">
                  <span className="text-sm font-semibold">N</span>
                </div>
              ) : (
                <Image
                  src="/logo/logo_white.svg"
                  alt="Nexode"
                  width={90}
                  height={24}
                  className="h-6 w-auto"
                  priority
                />
              )}
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
            <SidebarMenuButton render={<a href="/dashboard" target="_blank" rel="noopener noreferrer" />}>
              <span>Dashboard</span>
              <ExternalLink className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
