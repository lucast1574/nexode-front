"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Cpu,
  Database,
  Workflow,
  Rocket,
  FileCode,
  CreditCard,
  Users,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  BookOpen,
} from "lucide-react"

// ══════════════════════════════════════════════════════════
// Documentation Content
// ══════════════════════════════════════════════════════════

interface DocSection {
  id: string
  title: string
  icon: React.ElementType
  description: string
  category: "getting-started" | "services" | "account"
  content: React.ReactNode
}

const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
  <div className="my-4 rounded-lg border border-border overflow-hidden">
    {title && (
      <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
        <FileCode className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">{title}</span>
      </div>
    )}
    <pre className="bg-zinc-950 p-4 overflow-x-auto text-sm">
      <code className="text-zinc-300 font-mono whitespace-pre">{children}</code>
    </pre>
  </div>
)

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="my-4 flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
    <Info className="size-5 text-primary shrink-0 mt-0.5" />
    <div className="text-sm">{children}</div>
  </div>
)

const Warning = ({ children }: { children: React.ReactNode }) => (
  <div className="my-4 flex gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
    <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
    <div className="text-sm">{children}</div>
  </div>
)

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="flex gap-4 mb-6">
    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
      {n}
    </div>
    <div className="flex-1 pt-1">{children}</div>
  </div>
)

const docs: DocSection[] = [
  {
    id: "quickstart",
    title: "Quick Start Guide",
    icon: Rocket,
    description: "Get up and running with Nexode in 5 minutes",
    category: "getting-started",
    content: (
      <div>
        <p className="text-muted-foreground mb-6">
          Welcome to Nexode! This guide will help you deploy your first service in minutes.
        </p>

        <h3 className="text-lg font-bold mb-4">What is Nexode?</h3>
        <p className="mb-4">
          Nexode is a Platform as a Service (PaaS) that lets you deploy databases, compute
          instances, and n8n automation workflows with zero infrastructure management. We handle
          the servers, networking, SSL, and scaling — you focus on building.
        </p>

        <h3 className="text-lg font-bold mb-4">Getting Started</h3>
        <Step n={1}>
          <p className="font-medium">Create an Account</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sign up with your email or Google account. You&apos;ll get a free tier automatically.
          </p>
        </Step>
        <Step n={2}>
          <p className="font-medium">Choose a Service</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to <strong>Services</strong> in the sidebar and pick what you need: Databases,
            Compute, or n8n Automations.
          </p>
        </Step>
        <Step n={3}>
          <p className="font-medium">Subscribe to a Plan</p>
          <p className="text-sm text-muted-foreground mt-1">
            Select a plan that fits your needs. Payment is handled securely via Stripe.
          </p>
        </Step>
        <Step n={4}>
          <p className="font-medium">Deploy</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click &quot;Deploy&quot; on any service page. Your instance will be provisioned in seconds with a
            public HTTPS URL.
          </p>
        </Step>

        <Tip>
          All services come with automatic SSL certificates, health monitoring, and can be managed
          from the dashboard.
        </Tip>
      </div>
    ),
  },
  {
    id: "compute",
    title: "Compute Instances",
    icon: Cpu,
    description: "Deploy backend and frontend applications from Git",
    category: "services",
    content: (
      <div>
        <p className="text-muted-foreground mb-6">
          Compute lets you deploy any application from a Git repository. Your code is built and
          deployed automatically with a public HTTPS domain.
        </p>

        <h3 className="text-lg font-bold mb-4">Requirements</h3>
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 mt-1 shrink-0" />
            <div>
              <p className="font-medium">A Dockerfile in your repository root</p>
              <p className="text-sm text-muted-foreground">
                Nexode builds your app using Docker. You must have a{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Dockerfile</code> in the
                root of your repository.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 mt-1 shrink-0" />
            <div>
              <p className="font-medium">A public Git repository (or authenticated URL)</p>
              <p className="text-sm text-muted-foreground">
                Public repos work out of the box. For private repos, include your token in the URL
                or connect your GitHub/GitLab account.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 mt-1 shrink-0" />
            <div>
              <p className="font-medium">Your app must listen on a port</p>
              <p className="text-sm text-muted-foreground">
                Nexode routes traffic to port{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">3000</code> (frontend) or{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">4000</code> (backend) by
                default. You can change this after deployment.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4">Example Dockerfiles</h3>

        <h4 className="font-medium mb-2">Node.js / Next.js Frontend</h4>
        <CodeBlock title="Dockerfile">{`FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`}</CodeBlock>

        <h4 className="font-medium mb-2 mt-6">Node.js / NestJS Backend</h4>
        <CodeBlock title="Dockerfile">{`FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/main"]`}</CodeBlock>

        <h4 className="font-medium mb-2 mt-6">Python / FastAPI</h4>
        <CodeBlock title="Dockerfile">{`FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`}</CodeBlock>

        <h3 className="text-lg font-bold mb-4 mt-8">Deploying</h3>
        <Step n={1}>
          <p className="font-medium">Go to Compute page</p>
          <p className="text-sm text-muted-foreground mt-1">
            Navigate to <strong>Dashboard → Compute</strong>
          </p>
        </Step>
        <Step n={2}>
          <p className="font-medium">Click &quot;Deploy New Instance&quot;</p>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in: instance name, Git repository URL, branch (default:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">main</code>), and select
            Frontend or Backend type.
          </p>
        </Step>
        <Step n={3}>
          <p className="font-medium">Wait for build</p>
          <p className="text-sm text-muted-foreground mt-1">
            Nexode clones your repo, builds the Docker image, and deploys it. This usually takes
            1-3 minutes.
          </p>
        </Step>
        <Step n={4}>
          <p className="font-medium">Access your app</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your app is live at{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              https://your-app.nexode.app
            </code>{" "}
            with automatic SSL.
          </p>
        </Step>

        <h3 className="text-lg font-bold mb-4 mt-8">Environment Variables</h3>
        <p className="mb-4">
          You can set environment variables for your compute instance during or after deployment.
          These are injected into your container at runtime.
        </p>
        <Warning>
          <p>
            <strong>Never hardcode secrets</strong> in your Dockerfile or repository. Use
            environment variables for API keys, database URLs, and other sensitive data.
          </p>
        </Warning>

        <h3 className="text-lg font-bold mb-4 mt-8">Custom Domains</h3>
        <p className="mb-4">
          Each instance gets a free{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.nexode.app</code> subdomain. You
          can also add your own custom domain:
        </p>
        <Step n={1}>
          <p className="text-sm">
            Add a CNAME record pointing your domain to your Nexode subdomain
          </p>
        </Step>
        <Step n={2}>
          <p className="text-sm">Enter your custom domain in the instance settings</p>
        </Step>
        <Step n={3}>
          <p className="text-sm">SSL is provisioned automatically via Let&apos;s Encrypt</p>
        </Step>

        <Tip>
          For best performance, use multi-stage Docker builds to keep your final image small.
          Smaller images = faster deploys.
        </Tip>
      </div>
    ),
  },
  {
    id: "databases",
    title: "Databases",
    icon: Database,
    description: "Managed PostgreSQL, MongoDB, and Redis",
    category: "services",
    content: (
      <div>
        <p className="text-muted-foreground mb-6">
          Deploy fully managed database instances in seconds. We handle provisioning, backups, and
          networking — you get a connection string.
        </p>

        <h3 className="text-lg font-bold mb-4">Supported Databases</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { name: "PostgreSQL", desc: "Relational DB", icon: "/db/postgres.svg" },
            { name: "MongoDB", desc: "Document DB", icon: "/db/mongo.svg" },
            { name: "Redis", desc: "Cache / KV Store", icon: "/db/redis.svg" },
          ].map((db) => (
            <Card key={db.name} className="text-center">
              <CardContent className="pt-6 pb-4">
                <Image
                  src={db.icon}
                  alt={db.name}
                  width={32}
                  height={32}
                  className="size-8 mx-auto mb-2 object-contain"
                />
                <p className="font-bold text-sm">{db.name}</p>
                <p className="text-xs text-muted-foreground">{db.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="text-lg font-bold mb-4">How to Deploy</h3>
        <Step n={1}>
          <p className="font-medium">Go to Databases page</p>
          <p className="text-sm text-muted-foreground mt-1">
            Navigate to <strong>Dashboard → Databases</strong>
          </p>
        </Step>
        <Step n={2}>
          <p className="font-medium">Click &quot;Deploy&quot; and select your database type</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose PostgreSQL, MongoDB, or Redis. Give it a name.
          </p>
        </Step>
        <Step n={3}>
          <p className="font-medium">Get your credentials</p>
          <p className="text-sm text-muted-foreground mt-1">
            Once provisioned, you&apos;ll see your connection string, host, port, username, and
            password.
          </p>
        </Step>

        <h3 className="text-lg font-bold mb-4 mt-8">Connecting to Your Database</h3>
        <p className="mb-4">Use the connection string provided in your dashboard. Examples:</p>

        <h4 className="font-medium mb-2">PostgreSQL</h4>
        <CodeBlock title="Connection String">{`postgresql://username:password@pg-xxxxx.db.nexode.app:443/db_name?sslmode=require`}</CodeBlock>

        <h4 className="font-medium mb-2 mt-4">MongoDB</h4>
        <CodeBlock title="Connection String">{`mongodb://username:password@mongo-xxxxx.db.nexode.app:443/db_name?ssl=true`}</CodeBlock>

        <h4 className="font-medium mb-2 mt-4">Redis</h4>
        <CodeBlock title="Connection String">{`rediss://:password@redis-xxxxx.db.nexode.app:443`}</CodeBlock>

        <Tip>All database connections use TLS encryption. Your data is secure in transit.</Tip>

        <Warning>
          <p>
            <strong>Keep your credentials safe.</strong> Never commit database passwords to Git. Use
            environment variables in your application.
          </p>
        </Warning>

        <h3 className="text-lg font-bold mb-4 mt-8">Database Limits</h3>
        <p className="mb-2">
          The number of databases you can deploy depends on your subscription plan. Each
          subscription allows one database instance. Subscribe to multiple plans for more
          instances.
        </p>
      </div>
    ),
  },
  {
    id: "n8n",
    title: "n8n Automations",
    icon: Workflow,
    description: "Deploy private n8n instances for workflow automation",
    category: "services",
    content: (
      <div>
        <p className="text-muted-foreground mb-6">
          n8n is a powerful workflow automation tool. Nexode deploys a private, managed n8n
          instance with its own subdomain — no setup required.
        </p>

        <h3 className="text-lg font-bold mb-4">What is n8n?</h3>
        <p className="mb-4">
          n8n is an open-source workflow automation platform similar to Zapier or Make, but
          self-hosted. With Nexode, you get a dedicated n8n instance running in the cloud with full
          privacy and no execution limits from the vendor.
        </p>

        <h3 className="text-lg font-bold mb-4">Deploying n8n</h3>
        <Step n={1}>
          <p className="font-medium">Go to Automations page</p>
          <p className="text-sm text-muted-foreground mt-1">
            Navigate to <strong>Dashboard → Automations</strong>
          </p>
        </Step>
        <Step n={2}>
          <p className="font-medium">Click &quot;Deploy New Instance&quot;</p>
          <p className="text-sm text-muted-foreground mt-1">
            Give your instance a name. Optionally set a custom domain.
          </p>
        </Step>
        <Step n={3}>
          <p className="font-medium">Access your n8n</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your n8n is live at{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              https://your-instance.nexode.app
            </code>
            . Create your first workflow!
          </p>
        </Step>

        <h3 className="text-lg font-bold mb-4 mt-8">Features</h3>
        <div className="space-y-3 mb-6">
          {[
            "Private instance — your data stays yours",
            "400+ integrations (Slack, Gmail, Notion, databases, APIs...)",
            "Webhook triggers — receive events from external services",
            "Persistent storage — workflows and credentials survive restarts",
            "Automatic HTTPS with your subdomain",
            "No execution limits from n8n vendor",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <p className="text-sm">{f}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-bold mb-4 mt-8">Instance Limits by Plan</h3>
        <div className="overflow-x-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pr-4">Plan</TableHead>
                <TableHead className="pr-4">Max Instances</TableHead>
                <TableHead className="pr-4">Executions</TableHead>
                <TableHead>RAM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Basic", "1", "1,000/mo", "Shared"],
                ["Standard", "1", "5,000/mo", "1GB Dedicated"],
                ["Pro", "2", "20,000/mo", "2GB Dedicated"],
                ["Ultra", "3", "50,000/mo", "4GB Dedicated"],
              ].map(([plan, inst, exec, ram]) => (
                <TableRow key={plan}>
                  <TableCell className="pr-4 font-medium">{plan}</TableCell>
                  <TableCell className="pr-4">{inst}</TableCell>
                  <TableCell className="pr-4">{exec}</TableCell>
                  <TableCell>{ram}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Tip>
          You can restart your n8n instance anytime from the dashboard if you need to apply
          configuration changes.
        </Tip>
      </div>
    ),
  },
  {
    id: "billing",
    title: "Billing & Plans",
    icon: CreditCard,
    description: "Subscriptions, payments, and plan management",
    category: "account",
    content: (
      <div>
        <p className="text-muted-foreground mb-6">
          Nexode uses Stripe for secure payment processing. You can subscribe to multiple services
          and manage everything from the Billing page.
        </p>

        <h3 className="text-lg font-bold mb-4">How Billing Works</h3>
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 mt-1 shrink-0" />
            <p className="text-sm">
              <strong>Per-service subscriptions</strong> — subscribe to Database, Compute, and/or
              n8n plans independently
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 mt-1 shrink-0" />
            <p className="text-sm">
              <strong>Monthly or Annual</strong> — annual plans save ~17%
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 mt-1 shrink-0" />
            <p className="text-sm">
              <strong>Stripe Customer Portal</strong> — manage payment methods, view invoices,
              cancel anytime
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 mt-1 shrink-0" />
            <p className="text-sm">
              <strong>Multiple subscriptions</strong> — subscribe to the same plan twice for double
              the instance limits
            </p>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4">Managing Your Subscription</h3>
        <p className="mb-4">
          Go to <strong>Dashboard → Billing</strong> to see your active plans, usage stats, and
          access the Stripe portal for invoices and payment method changes.
        </p>

        <Tip>
          If you need more instances of a service, subscribe to an additional plan of the same
          type. Each subscription adds to your instance limit.
        </Tip>
      </div>
    ),
  },
  {
    id: "workspace",
    title: "Workspaces & Teams",
    icon: Users,
    description: "Invite team members and manage access",
    category: "account",
    content: (
      <div>
        <p className="text-muted-foreground mb-6">
          Workspaces let you collaborate with your team. Invite members by email and manage access
          from the Workspace page.
        </p>

        <h3 className="text-lg font-bold mb-4">How Workspaces Work</h3>
        <p className="mb-4">
          When you subscribe to a paid plan, a workspace is automatically created for you. You can
          invite team members to share access to your services.
        </p>

        <Step n={1}>
          <p className="font-medium">Go to Workspace</p>
          <p className="text-sm text-muted-foreground mt-1">
            Navigate to <strong>Dashboard → Workspace</strong>
          </p>
        </Step>
        <Step n={2}>
          <p className="font-medium">Invite by email</p>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the email address of your teammate. They&apos;ll receive an invitation email with a
            link to register.
          </p>
        </Step>
        <Step n={3}>
          <p className="font-medium">Manage members</p>
          <p className="text-sm text-muted-foreground mt-1">
            You can remove members anytime. Only the workspace owner can invite or remove members.
          </p>
        </Step>

        <Warning>
          <p>Team member limits depend on your subscription plan. Upgrade your plan to invite more members.</p>
        </Warning>
      </div>
    ),
  },
  {
    id: "affiliates",
    title: "Affiliate Program",
    icon: Zap,
    description: "Earn 10% commission referring new subscribers",
    category: "account",
    content: (
      <div>
        <p className="text-muted-foreground mb-6">
          Earn money by referring new users to Nexode. Get 10% of their first payment as
          commission.
        </p>

        <h3 className="text-lg font-bold mb-4">How It Works</h3>
        <Step n={1}>
          <p className="font-medium">Activate the program</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to <strong>Dashboard → Affiliates</strong> and click &quot;Activate Affiliate Program&quot;.
          </p>
        </Step>
        <Step n={2}>
          <p className="font-medium">Share your unique link</p>
          <p className="text-sm text-muted-foreground mt-1">
            Copy your referral link and share it with friends, social media, or your audience.
          </p>
        </Step>
        <Step n={3}>
          <p className="font-medium">Earn commissions</p>
          <p className="text-sm text-muted-foreground mt-1">
            When someone signs up with your link and subscribes, you earn{" "}
            <strong>10% of their first payment</strong> (all services combined).
          </p>
        </Step>
        <Step n={4}>
          <p className="font-medium">Request a withdrawal</p>
          <p className="text-sm text-muted-foreground mt-1">
            Once your balance reaches <strong>$50</strong>, you can request a withdrawal via CCI or
            Binance.
          </p>
        </Step>

        <h3 className="text-lg font-bold mb-4 mt-8">Commission Rules</h3>
        <div className="space-y-2 mb-6">
          <p className="text-sm">
            • <strong>10%</strong> commission on the first payment only (not recurring)
          </p>
          <p className="text-sm">
            • If they subscribe to multiple services at once, commission is on the total
          </p>
          <p className="text-sm">
            • Minimum withdrawal: <strong>$50 USD</strong>
          </p>
          <p className="text-sm">
            • Payment via <strong>CCI bank transfer</strong> or <strong>Binance</strong>
          </p>
          <p className="text-sm">
            • Withdrawals are processed manually within 1-3 business days
          </p>
        </div>

        <Tip>
          You can see exactly who signed up and who converted (paid) in your affiliate dashboard.
          Full transparency.
        </Tip>
      </div>
    ),
  },
]

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════

export default function DocsPage() {
  const [activeDocId, setActiveDocId] = useState<string>("quickstart")

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash && docs.some((d) => d.id === hash)) {
      setActiveDocId(hash)
    }
    const handleHashChange = () => {
      const newHash = window.location.hash.replace("#", "")
      if (newHash && docs.some((d) => d.id === newHash)) {
        setActiveDocId(newHash)
      }
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const activeDoc = docs.find((d) => d.id === activeDocId)
  if (!activeDoc) return null

  const idx = docs.findIndex((d) => d.id === activeDocId)
  const prev = docs[idx - 1]
  const next = docs[idx + 1]

  return (
    <>
      {/* Mobile header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <span className="text-sm font-medium">{activeDoc.title}</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <BookOpen className="size-4" />
            <span>Docs</span>
            <ChevronRight className="size-3" />
            <span className="capitalize">{activeDoc.category.replace("-", " ")}</span>
          </div>

          {/* Title */}
          <div className="flex items-start gap-4 mb-8">
            <div className={cn("p-3 rounded-xl bg-primary/10")}>
              <activeDoc.icon className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{activeDoc.title}</h1>
              <p className="text-muted-foreground mt-1">{activeDoc.description}</p>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Content */}
          <article className="prose-sm max-w-none">{activeDoc.content}</article>

          {/* Footer nav */}
          <Separator className="my-10" />
          <div className="flex items-center justify-between">
            <div>
              {prev && (
                <button
                  onClick={() => {
                    window.location.hash = prev.id
                    setActiveDocId(prev.id)
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="size-4 rotate-180" />
                  <span>{prev.title}</span>
                </button>
              )}
            </div>
            <div>
              {next && (
                <button
                  onClick={() => {
                    window.location.hash = next.id
                    setActiveDocId(next.id)
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{next.title}</span>
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
