const TIME_ZONE = "America/Sao_Paulo"

export function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function todayISO(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE })
}

export function monthBounds(isoDate = todayISO()) {
  const [year, month] = isoDate.split("-").map(Number)
  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return { start, end, year, month }
}

export function addMonthsISO(isoDate: string, delta: number) {
  return addMonthsClamped(isoDate, delta)
}

export function addMonthsClamped(isoDate: string, delta: number) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const firstOfMonth = new Date(year, month - 1 + delta, 1)
  const lastDay = new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth() + 1,
    0
  ).getDate()
  const safeDay = Math.min(day, lastDay)
  const y = firstOfMonth.getFullYear()
  const m = String(firstOfMonth.getMonth() + 1).padStart(2, "0")
  const d = String(safeDay).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function addDaysISO(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(year, month - 1, day + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function formatDay(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(year, month - 1, day))
}

export function formatMonthLabel(isoDate: string) {
  const [year, month] = isoDate.split("-").map(Number)
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1))
}

export function formatDateRange(start: string, end: string) {
  if (start === end) return formatDay(start)
  return `${formatDay(start)} — ${formatDay(end)}`
}

export function moneyToInput(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseMoneyInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return NaN
  const hasComma = trimmed.includes(",")
  const normalized = hasComma
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed
  return Number(normalized)
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
