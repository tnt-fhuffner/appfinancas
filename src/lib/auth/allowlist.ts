function parseEmails(value: string | undefined) {
  return (value ?? "")
    .replace(/^\uFEFF/, "")
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase().replace(/^["']|["']$/g, ""))
    .filter((email) => email.includes("@"))
}

export function getAllowedEmails() {
  return parseEmails(process.env.ALLOWED_EMAILS)
}

export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false

  const allowed = getAllowedEmails()
  if (allowed.length === 0) return false

  return allowed.includes(email.toLowerCase())
}
