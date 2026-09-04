import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Fraunces, Nunito_Sans } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Nós",
    template: "%s · Nós",
  },
  description: "O diário financeiro e de sonhos do casal.",
  applicationName: "Nós",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1612" },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${nunito.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
