import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export const metadata = {
  title: "Entrar",
}

export default function LoginPage() {
  const supabaseReady = isSupabaseConfigured()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[-4rem] bottom-24 size-64 rounded-full bg-accent/70 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-end p-4">
        <ThemeToggle />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm rounded-3xl bg-card/80 p-6 shadow-xl shadow-primary/5 ring-1 ring-foreground/8 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
              nós
            </span>
            <h1 className="font-heading text-3xl tracking-tight">Nós</h1>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              O diário financeiro e de sonhos de vocês dois.
            </p>
          </div>
          <LoginForm supabaseReady={supabaseReady} />
        </div>
      </main>
    </div>
  )
}
