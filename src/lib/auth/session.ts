import { redirect } from "next/navigation"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isAllowedEmail(user.email)) {
    redirect("/login")
  }

  return { supabase, user }
}
