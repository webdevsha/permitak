import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "sonner"

const _geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const _playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })

export const metadata: Metadata = {
  title: "Permit Akaun - Sistem Pengurusan Pasar Malam",
  description: "Sistem pengurusan permit, sewa, dan akaun bersepadu untuk peniaga pasar malam dan Uptown.",
  icons: {
    icon: "https://ik.imagekit.io/cbctech/977ab6e6-c7d7-44cf-961d-b926ace8d43e.png",
    shortcut: "https://ik.imagekit.io/cbctech/977ab6e6-c7d7-44cf-961d-b926ace8d43e.png",
    apple: "https://ik.imagekit.io/cbctech/977ab6e6-c7d7-44cf-961d-b926ace8d43e.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ms">
      <body className={`${_geist.variable} ${_geistMono.variable} ${_playfair.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
