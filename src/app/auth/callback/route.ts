import { NextResponse } from "next/server"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { safeNextPath } from "@/lib/safe"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL("/login", origin))
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email || !isAllowedEmail(user.email)) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/login", origin))
    }
  }

  return NextResponse.redirect(new URL(next, origin))
}
