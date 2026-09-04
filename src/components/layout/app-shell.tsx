"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { QuickAddButton } from "@/components/layout/quick-add-button"
import { Sidebar } from "@/components/layout/sidebar"
import type { AppUser } from "@/lib/auth/user"
import type { Account, Category } from "@/lib/finance/types"
import { primaryNav, settingsNav } from "@/lib/navigation"

function titleForPath(pathname: string) {
  if (pathname === "/") return "Início"
  const match = [...primaryNav, settingsNav].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  return match?.label ?? "Nós"
}

export function AppShell({
  user,
  children,
  financeReady,
  accounts,
  categories,
}: {
  user: AppUser
  children: ReactNode
  financeReady: boolean
  accounts: Account[]
  categories: Category[]
}) {
  const pathname = usePathname()

  return (
    <div className="relative flex min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/4 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-24 size-64 rounded-full bg-accent/40 blur-3xl dark:bg-accent/20" />
      </div>
      <Sidebar user={user} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <AppHeader title={titleForPath(pathname)} user={user} />
        <main className="flex-1 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-8 md:pb-10">
          {children}
        </main>
      </div>
      <QuickAddButton
        ready={financeReady}
        accounts={accounts}
        categories={categories}
      />
      <BottomNav />
    </div>
  )
}
