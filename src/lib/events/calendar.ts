import { addMonthsISO, todayISO } from "@/lib/finance/format"
import type { CoupleEvent, EventOccurrence } from "@/lib/events/types"

export function daysUntil(isoDate: string, today = todayISO()) {
  return Math.round(
    (Date.parse(`${isoDate}T12:00:00`) - Date.parse(`${today}T12:00:00`)) /
      86_400_000
  )
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function dateFromParts(year: number, month: number, day: number) {
  const lastDay = new Date(year, month, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  return `${year}-${pad(month)}-${pad(safeDay)}`
}

export function nextOccurrenceOn(event: CoupleEvent, today = todayISO()) {
  if (!event.repeats_yearly) return event.occurs_on
  const [, month, day] = event.occurs_on.split("-").map(Number)
  const year = Number(today.slice(0, 4))
  const thisYear = dateFromParts(year, month, day)
  if (thisYear >= today) return thisYear
  return dateFromParts(year + 1, month, day)
}

export function occurrenceInMonth(
  event: CoupleEvent,
  year: number,
  month: number
): string | null {
  if (!event.repeats_yearly) {
    const [eventYear, eventMonth] = event.occurs_on.split("-").map(Number)
    return eventYear === year && eventMonth === month ? event.occurs_on : null
  }
  const [, eventMonth, day] = event.occurs_on.split("-").map(Number)
  if (eventMonth !== month) return null
  return dateFromParts(year, month, day)
}

export function upcomingOccurrences(
  events: CoupleEvent[],
  days = 60,
  today = todayISO()
): EventOccurrence[] {
  const horizon = addMonthsISO(today, 3)
  return events
    .map((event) => {
      const occurrence_on = nextOccurrenceOn(event, today)
      return { ...event, occurrence_on }
    })
    .filter(
      (event) =>
        event.status !== "done" &&
        event.occurrence_on >= today &&
        event.occurrence_on <= horizon &&
        daysUntil(event.occurrence_on, today) <= days
    )
    .sort((a, b) =>
      a.occurrence_on === b.occurrence_on
        ? a.title.localeCompare(b.title, "pt-BR")
        : a.occurrence_on < b.occurrence_on
          ? -1
          : 1
    )
}

export function nextEvent(events: CoupleEvent[], today = todayISO()) {
  return upcomingOccurrences(events, 90, today)[0] ?? null
}

export function monthCells(year: number, month: number) {
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (string | null)[] = []
  for (let index = 0; index < firstWeekday; index += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(dateFromParts(year, month, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function eventsOnDay(
  events: CoupleEvent[],
  isoDate: string
): EventOccurrence[] {
  const [year, month] = isoDate.split("-").map(Number)
  return events
    .map((event) => {
      const occurrence_on = occurrenceInMonth(event, year, month)
      return occurrence_on ? { ...event, occurrence_on } : null
    })
    .filter((event): event is EventOccurrence => event?.occurrence_on === isoDate)
}

export function reminderLabel(isoDate: string, today = todayISO()) {
  const days = daysUntil(isoDate, today)
  if (days === 0) return "Hoje"
  if (days === 1) return "Amanhã"
  if (days < 0) return "Já passou"
  return `Em ${days} dias`
}
