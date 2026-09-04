import { Palette, Shield, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ThemePicker } from "@/components/layout/theme-picker"
import { toAppUser } from "@/lib/auth/user"
import { initialsFromName } from "@/lib/finance/format"
import { getFinanceBootstrap } from "@/lib/finance/queries"
import { createClient } from "@/lib/supabase/server"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const [{ data: { user } }, finance] = await Promise.all([
    supabase.auth.getUser(),
    getFinanceBootstrap(),
  ])
  const appUser = user ? toAppUser(user) : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <CardTitle>Vocês dois</CardTitle>
          <CardDescription>
            {appUser
              ? `Você entra como ${appUser.name} · ${appUser.email}`
              : "Sessão não encontrada."}
          </CardDescription>
        </CardHeader>
        {finance.profiles.length > 0 ? (
          <CardContent className="flex flex-wrap gap-3">
            {finance.profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-2 rounded-2xl bg-muted/70 px-3 py-2"
              >
                <Avatar size="sm">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {initialsFromName(profile.full_name || "Nós")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {profile.full_name || "Sem nome"}
                </span>
              </div>
            ))}
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Palette className="size-5" />
          </span>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Claro, escuro ou o mesmo modo do celular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePicker />
        </CardContent>
      </Card>

      <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="size-5" />
          </span>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>
            Não há cadastro público. Os dois usuários entram só com contas
            criadas no painel do Supabase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
