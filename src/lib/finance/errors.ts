import type { PostgrestError } from "@supabase/supabase-js"

export function isMissingTable(error: PostgrestError | null) {
  if (!error) return false
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message.toLowerCase().includes("schema cache") ||
    error.message.toLowerCase().includes("does not exist")
  )
}
