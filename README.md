# Nexode Frontend

Cloud infrastructure management dashboard built with Next.js 16.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **API:** Apollo Client + GraphQL (NestJS backend)
- **Auth:** JWT via HttpOnly cookies + Google OAuth + Cloudflare Turnstile
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)

## Architecture

```
app/
├── page.tsx                    # Landing (Server Component, SSR)
├── layout.tsx                  # Root layout (ThemeProvider, Apollo, Google OAuth)
├── middleware.ts               # Edge auth guard (protects /dashboard, /checkout)
├── auth/
│   ├── login/                  # Email + Google login
│   ├── register/               # Registration with password strength
│   └── verify-email/           # 6-char code verification (auto-submit from URL)
├── services/                   # Public pricing catalog (n8n, Database, Compute)
├── checkout/                   # Subscription management (Stripe portal)
├── dashboard/
│   ├── layout.tsx              # Shared sidebar, auth context (useDashboard hook)
│   ├── error.tsx               # Error boundary
│   ├── loading.tsx             # Route transition skeleton
│   ├── page.tsx                # System overview (service cards)
│   ├── automations/            # n8n instance management + embedded designer
│   ├── databases/              # DB provisioning + credentials (masked) + terminal
│   ├── compute/                # Git-based deployments via Dokploy
│   ├── billing/                # Usage stats, invoices, Stripe portal
│   └── settings/               # Profile, notifications, security, danger zone
└── api/dns/                    # DNS propagation checker (Node.js dns module)

components/
├── PublicNav.tsx                # Shared nav for public pages
├── Sidebar.tsx                 # Dashboard sidebar (dynamic based on subscriptions)
├── AuthLayout.tsx              # Split-screen auth layout
├── NotificationBell.tsx        # Real-time notification dropdown
├── apollo-wrapper.tsx          # Apollo Client provider (credentials: include)
├── user-nav.tsx                # User dropdown (avatar, settings, logout)
└── modals/                     # ProvisionN8n, ProvisionNode, DeleteDatabase

lib/
├── auth-utils.ts               # Session management (HttpOnly cookie aware)
├── api-client.ts               # gqlFetch() with auto token refresh on 401
├── graphql-operations.ts       # All queries/mutations with fragments
├── graphql-mutations.ts        # Auth mutations (legacy, used by auth forms)
├── use-graphql.ts              # useGraphQL hook (fetch wrapper with auth)
├── use-action-lock.ts          # Debounce hook for destructive actions
├── apollo-client.ts            # Apollo client config
├── types.ts                    # Shared TypeScript interfaces
└── utils.ts                    # cn() classname utility
```

## Security

- **HttpOnly cookies** for access/refresh tokens (immune to XSS)
- `has_session` non-HttpOnly flag for middleware and UI checks
- Edge middleware redirects unauthenticated users before page loads
- Cloudflare Turnstile on login/register forms
- Credentials masked by default on database detail pages (eye toggle to reveal)
- Action lock (5s cooldown) on deploy/restart/delete buttons

## Getting Started

```bash
# Install
npm install

# Development
npm run dev

# Build
npm run build
npm start
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api-v1/graphql
NEXT_PUBLIC_TURNSTILE_SITE_KEY=           # Optional: Cloudflare Turnstile
NEXT_PUBLIC_GOOGLE_CLIENT_ID=             # Google OAuth client ID
```

## User Flows

**New user:** Landing → Services (pricing) → Select plan → Stripe checkout → Dashboard
**Existing user:** Login → Dashboard → Open Console → Manage instances
**Guest checkout:** Stripe → auto-login via session_id → Dashboard
