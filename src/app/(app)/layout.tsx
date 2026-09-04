import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { toAppUser } from "@/lib/auth/user"
import { getFinanceBootstrap } from "@/lib/finance/queries"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login")
  }

  const supabase = await createClient()
  const [{ data: { user } }, finance] = await Promise.all([
    supabase.auth.getUser(),
    getFinanceBootstrap(),
  ])

  if (!user?.email || !isAllowedEmail(user.email)) {
    redirect("/login")
  }

  return (
    <AppShell
      user={toAppUser(user)}
      financeReady={finance.ready}
      accounts={finance.accounts}
      categories={finance.categories}
    >
      {children}
    </AppShell>
  )
}
