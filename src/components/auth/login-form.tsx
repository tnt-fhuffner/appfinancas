"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Eye, EyeOff, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, type AuthState } from "@/lib/auth/actions"

const initialState: AuthState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="h-11 w-full rounded-xl text-sm" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  )
}

export function LoginForm({ supabaseReady }: { supabaseReady: boolean }) {
  const [state, formAction] = useActionState(signIn, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="voce@email.com"
          className="h-11 rounded-xl px-3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={256}
            placeholder="Sua senha"
            className="h-11 rounded-xl px-3 pr-11"
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {!supabaseReady ? (
        <p className="rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">
          Configure o `.env.local` com as chaves do Supabase para entrar.
        </p>
      ) : null}

      <SubmitButton />

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Heart className="size-3 fill-primary/70 text-primary" />
        Acesso só para vocês dois. Sem cadastro público.
      </p>
    </form>
  )
}
