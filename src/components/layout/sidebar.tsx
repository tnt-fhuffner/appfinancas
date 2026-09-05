"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isNavActive, primaryNav, settingsNav } from "@/lib/navigation"
import type { AppUser } from "@/lib/auth/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Sidebar({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const items = [...primaryNav, settingsNav]

  return (
    <aside className="relative z-10 sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border/70 bg-sidebar px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 lg:w-64 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
          nós
        </span>
        <span className="flex flex-col">
          <span className="font-heading text-lg leading-none tracking-tight">Nós</span>
          <span className="mt-1 text-xs text-muted-foreground">finanças e sonhos</span>
        </span>
      </Link>

      <nav aria-label="Módulos" className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
              )}
            >
              <Icon className="size-4" strokeWidth={active ? 2.4 : 1.8} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-sidebar-accent/60 px-3 py-3">
        <Avatar>
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary/15 font-medium text-primary">
            {user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </aside>
  )
}
