"use client"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import type { AppUser } from "@/lib/auth/user"

export function AppHeader({
  title,
  user,
}: {
  title: string
  user: AppUser
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:h-16 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-[11px] font-semibold text-primary-foreground md:hidden">
          nós
        </span>
        <h1 className="truncate font-heading text-lg tracking-tight md:text-xl">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
