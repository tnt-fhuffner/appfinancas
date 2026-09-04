import { addMonthsISO, monthBounds, todayISO } from "@/lib/finance/format"

export const PERIOD_PRESETS = [
  { id: "this-month", label: "Este mês" },
  { id: "last-month", label: "Mês passado" },
  { id: "last-3-months", label: "3 meses" },
  { id: "this-year", label: "Este ano" },
  { id: "all", label: "Tudo" },
  { id: "custom", label: "Datas" },
] as const

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]["id"]

export type PeriodRange = {
  start: string
  end: string
  preset: PeriodPreset
}

export function periodRange(
  preset: PeriodPreset,
  customStart = "",
  customEnd = "",
  today = todayISO()
): PeriodRange {
  const current = monthBounds(today)

  if (preset === "this-month") {
    return { preset, start: current.start, end: current.end }
  }

  if (preset === "last-month") {
    const previous = monthBounds(addMonthsISO(current.start, -1))
    return { preset, start: previous.start, end: previous.end }
  }

  if (preset === "last-3-months") {
    return {
      preset,
      start: addMonthsISO(current.start, -2),
      end: current.end,
    }
  }

  if (preset === "this-year") {
    return { preset, start: `${current.year}-01-01`, end: today }
  }

  if (preset === "all") {
    return { preset, start: "2000-01-01", end: today }
  }

  const iso = /^\d{4}-\d{2}-\d{2}$/
  let start = iso.test(customStart) ? customStart : current.start
  let end = iso.test(customEnd) ? customEnd : today
  if (end < start) {
    const swap = start
    start = end
    end = swap
  }

  return { preset, start, end }
}

export function monthsCovering(start: string, end: string, max = 36) {
  const first = monthBounds(start)
  const last = monthBounds(end)
  const months: { start: string; end: string; label: string }[] = []
  let cursor = first.start
  let guard = 0

  while (cursor <= last.start && guard < max) {
    const bounds = monthBounds(cursor)
    months.push({
      start: bounds.start,
      end: bounds.end,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
        new Date(bounds.year, bounds.month - 1, 1)
      ),
    })
    cursor = addMonthsISO(bounds.start, 1)
    guard += 1
  }

  return months
}

export function seriesMonths(range: PeriodRange) {
  if (range.preset === "this-month" || range.preset === "last-month") {
    return Array.from({ length: 12 }, (_, index) => {
      const iso = addMonthsISO(range.start, index - 11)
      const bounds = monthBounds(iso)
      return {
        start: bounds.start,
        end: bounds.end,
        label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
          new Date(bounds.year, bounds.month - 1, 1)
        ),
      }
    })
  }

  const covering = monthsCovering(range.start, range.end)
  return covering.length > 0 ? covering : monthsCovering(range.end, range.end)
}

export function isCurrentMonth(range: PeriodRange, today = todayISO()) {
  const current = monthBounds(today)
  return range.start === current.start && range.end === current.end
}

export function isSingleMonth(range: PeriodRange) {
  const bounds = monthBounds(range.start)
  return range.start === bounds.start && range.end === bounds.end
}
