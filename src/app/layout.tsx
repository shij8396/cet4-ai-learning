import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/layout/ThemeProvider";

import type { Metadata, Viewport } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "AI英语四级学习 | 基于AI的CET4智能学习系统",
    template: "%s | AI英语四级",
  },
  description:
    "基于AI词汇约束与动态难度控制的英语四级(CET4)沉浸式学习系统。支持智能词库、阅读理解、默写训练、AI作文批改、学习统计和PWA离线学习。",
  keywords: [
    "英语四级",
    "CET4",
    "AI学习",
    "背单词",
    "英语阅读",
    "英语写作",
    "默写",
    "PWA",
    "四级备考",
    "人工智能英语",
  ],
  authors: [{ name: "AI CET4 Learning" }],
  creator: "AI CET4 Learning",
  publisher: "AI CET4 Learning",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "AI英语四级学习",
    title: "AI英语四级学习 | 基于AI的CET4智能学习系统",
    description:
      "基于AI词汇约束与动态难度控制的英语四级(CET4)沉浸式学习系统。智能词库、阅读理解、默写训练、AI作文批改。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI英语四级学习",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI英语四级学习",
    description: "基于AI的CET4智能学习系统 · 支持PWA离线学习",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "四级英语",
  },
  applicationName: "AI英语四级学习",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              className: "text-sm",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
