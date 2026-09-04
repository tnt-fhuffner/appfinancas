import type { User } from "@supabase/supabase-js"

export type AppUser = {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  initials: string
}

export function getDisplayName(user: Pick<User, "email" | "user_metadata">) {
  const metadataName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined)

  if (metadataName?.trim()) return metadataName.trim()

  const local = user.email?.split("@")[0]
  if (!local) return "Você"

  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "N"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function toAppUser(user: User): AppUser {
  const name = getDisplayName(user)
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatarUrl,
    initials: getInitials(name),
  }
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}
