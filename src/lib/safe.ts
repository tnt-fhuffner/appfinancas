import { z } from "zod"

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")

export const isoDateOrNull = z
  .union([isoDate, z.literal(""), z.null()])
  .transform((value) => (value ? value : null))

export const isoMonthStart = z
  .string()
  .regex(/^\d{4}-\d{2}-01$/, "Mês inválido.")

export const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida.")

export const money = z
  .number({ error: "Informe um valor válido." })
  .finite()
  .min(0)
  .max(99_999_999.99)

export const moneyPositive = z
  .number({ error: "Informe um valor maior que zero." })
  .finite()
  .positive("Informe um valor maior que zero.")
  .max(99_999_999.99)

export function nullableText(max: number) {
  return z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value == null) return null
      const trimmed = value.trim()
      return trimmed.length === 0 ? null : trimmed
    })
    .pipe(z.string().max(max, "Texto longo demais.").nullable())
}

export const notesField = nullableText(500)

export function shortText(message: string, max = 80) {
  return z.string().trim().min(1, message).max(max, "Texto longo demais.")
}

export function asUuid(id: string) {
  const parsed = z.string().uuid().safeParse(id)
  return parsed.success ? parsed.data : null
}

export function dbError(message: string | undefined) {
  if (!message) return "Não foi possível concluir. Tente de novo."
  const lower = message.toLowerCase()
  if (lower.includes("duplicate") || lower.includes("unique")) {
    return "Esse registro já existe."
  }
  if (lower.includes("foreign key") || lower.includes("violates")) {
    return "Há um vínculo que impede essa ação."
  }
  if (
    lower.includes("row-level") ||
    lower.includes("permission") ||
    lower.includes("policy")
  ) {
    return "Sem permissão para isso."
  }
  return "Não foi possível concluir. Tente de novo."
}

export function zodError(error: z.ZodError) {
  return { error: error.issues[0]?.message ?? "Dados inválidos." }
}

export function safeNextPath(next: string | null) {
  if (!next) return "/"
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/"
  }
  if (next.includes("://") || next.includes("\0") || /[\s]/.test(next)) {
    return "/"
  }
  return next
}
