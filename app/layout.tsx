import type { Metadata, Viewport } from "next"
import { GeistProvider, geistFontClasses } from "@vercel/geistcn/core"
import "./globals.css"

export const metadata: Metadata = {
  title: "Environment Inspector",
  description:
    "A secure internal dashboard for inspecting environment variables assigned to Vercel projects.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={geistFontClasses}>
      <body>
        <GeistProvider defaultTheme="system">{children}</GeistProvider>
      </body>
    </html>
  )
}
