# 🌐 Nexode Frontend

> **The Cockpit for Your Cloud.** A premium, high-performance dashboard built with Next.js 15+ to manage your Nexode infrastructure, n8n instances, and cloud services.

[![Next.js](https://img.shields.io/badge/framework-Next.js%2015-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/styling-Tailwind%204.0-38BDB8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Aesthetic](https://img.shields.io/badge/aesthetic-premium-FFD700?style=for-the-badge)](https://nexode.app)

---

## ✨ Features

Nexode Front is designed to provide a world-class user experience for managing complex cloud workflows.

- 🎨 **Modern UI/UX**: Built with a "premium-first" approach using high-end glassmorphism and subtle animations.
- ⚡ **Next.js 15+ Core**: Leveraging the latest App Router, Server Components, and Streaming for lightning-fast speeds.
- 🔐 **Secure Access**: Integrated flows for Login, Registration (with password strength check), and Social Auth.
- 📊 **Real-time Dashboards**: Visual insight into your running n8n nodes, DB status, and resource usage.
- 🌑 **Adaptive Dark Mode**: Native support for light/dark themes via `next-themes`.
- 📱 **Fully Responsive**: Optimized for every device, from mobile to ultra-wide displays.

---

## 🏗 Technology

- **Framework**: [Next.js 15.1+](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Components**: Radix UI & Lucide Icons
- **State Management**: SWR & React Context
- **Transitions**: Framer Motion
- **Notifications**: Sonner

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/nexode-org/nexode-front.git
   cd nexode-front
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Update variables in .env
   ```

4. **Launch Development Server**

   ```bash
   npm run dev
   ```

---

## 📁 Key Directories

```text
app/        # App router (Pages and API routes)
components/ # Shared UI and functional components
lib/        # Utility functions and shared logic
public/     # Static assets (logos, illustrations)
styles/     # Gloabl CSS and Tailwind configuration
```

---

## 🎨 Design Philosophy

Nexode Front follows a "Minimalist-Industrial" design language:

- **Depth**: Using subtle shadows and border gradients.
- **Micro-interactions**: Every button and link feels alive through Framer Motion.
- **Contrast**: High legibility in both light and dark modes.

---

## 🤝 Community & Support

Join us in building the future of cloud automation.

- **Author**: Nexode Engineering
- **Website**: [nexode.app](https://nexode.app)

## 📄 License

Nexode Front is proprietary software. All rights reserved.
