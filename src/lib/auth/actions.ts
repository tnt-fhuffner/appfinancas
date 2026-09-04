"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(1, "Informe a senha.").max(256),
})

export type AuthState = {
  error: string | null
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "O Supabase ainda não está configurado. Preencha o arquivo .env.local.",
    }
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informe e-mail e senha." }
  }

  const { email, password } = parsed.data

  if (!isAllowedEmail(email)) {
    return { error: "E-mail ou senha inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const code = error.code ?? ""
    const message = error.message.toLowerCase()

    if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
      return {
        error: "Este e-mail ainda não foi confirmado.",
      }
    }

    return { error: "E-mail ou senha inválidos." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isAllowedEmail(user.email)) {
    await supabase.auth.signOut()
    return { error: "Esta conta não está autorizada." }
  }

  redirect("/")
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  redirect("/login")
}
