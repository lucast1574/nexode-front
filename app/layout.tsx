import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ApolloWrapper } from "@/components/apollo-wrapper";
import GoogleAuthProvider from "@/components/google-auth-provider";
import { ModalProvider } from "@/components/ui/modal";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexode - Fast Deploy Center",
  description: "Deploy high-performance servers, databases, and automation workflows in seconds.",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Nexode - Fast Deploy Center",
    description: "Deploy high-performance servers, databases, and automation workflows in seconds.",
    url: "https://dash.nexode.app",
    siteName: "Nexode",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexode",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexode - Fast Deploy Center",
    description: "Deploy high-performance servers, databases, and automation workflows in seconds.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        className="antialiased"
      >
        <GoogleAuthProvider>
          <ApolloWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <ModalProvider>
                  {children}
                  <Toaster 
                    position="top-center" 
                    richColors 
                    theme="dark"
                    toastOptions={{
                      style: {
                        background: '#09090b',
                        border: '1px solid #27272a',
                        color: '#fff',
                      },
                      actionButtonStyle: {
                        background: '#3b82f6',
                        color: '#fff',
                        fontWeight: 'bold',
                        borderRadius: '12px',
                      }
                    }}
                  />
                </ModalProvider>
              </TooltipProvider>
            </ThemeProvider>
          </ApolloWrapper>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}