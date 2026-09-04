export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
}

export function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  )
}

export function isSupabaseConfigured() {
  const url = getSupabaseUrl()
  const key = getSupabaseKey()

  if (!url || !key) return false
  if (url.includes("YOUR_PROJECT") || url.includes("your_project")) return false
  if (key.startsWith("YOUR_") || key.includes("YOUR_PUBLISHABLE")) return false

  try {
    const parsed = new URL(url)
    const local =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
    if (parsed.protocol === "http:") return local
    if (parsed.protocol !== "https:") return false
  } catch {
    return false
  }

  return true
}
