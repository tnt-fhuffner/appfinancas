import { todayISO } from "@/lib/finance/format"
import type { Trip, TripBudgetItem, TripExpense } from "@/lib/trips/types"

export function daysUntil(isoDate: string, today = todayISO()) {
  return Math.round(
    (Date.parse(`${isoDate}T12:00:00`) - Date.parse(`${today}T12:00:00`)) /
      86_400_000
  )
}

export function tripPhase(trip: Trip, today = todayISO()) {
  if (today < trip.start_on) return "upcoming" as const
  if (today <= trip.end_on) return "now" as const
  return "past" as const
}

export function countdownLabel(trip: Trip, today = todayISO()) {
  const phase = tripPhase(trip, today)
  if (phase === "now") return "Vocês estão lá"
  if (phase === "upcoming") {
    const days = daysUntil(trip.start_on, today)
    if (days === 0) return "É hoje"
    if (days === 1) return "Amanhã"
    return `Faltam ${days} dias`
  }
  const ago = -daysUntil(trip.end_on, today)
  if (ago <= 0) return "Acabou hoje"
  if (ago === 1) return "Foi ontem"
  return `Foi há ${ago} dias`
}

export function sortTrips(trips: Trip[], today = todayISO()) {
  const rank = { now: 0, upcoming: 1, past: 2 }
  return [...trips].sort((a, b) => {
    const aPhase = tripPhase(a, today)
    const bPhase = tripPhase(b, today)
    if (rank[aPhase] !== rank[bPhase]) return rank[aPhase] - rank[bPhase]
    if (aPhase === "past") return a.start_on < b.start_on ? 1 : -1
    return a.start_on < b.start_on ? -1 : 1
  })
}

export function nextTrip(trips: Trip[], today = todayISO()) {
  return (
    sortTrips(trips, today).find((trip) => tripPhase(trip, today) !== "past") ??
    null
  )
}

export function tripSpent(
  budgetItems: TripBudgetItem[],
  expenses: TripExpense[]
) {
  const spentByItem = new Map<string, number>()
  let total = 0
  for (const expense of expenses) {
    total += expense.amount
    if (expense.trip_budget_item_id) {
      spentByItem.set(
        expense.trip_budget_item_id,
        (spentByItem.get(expense.trip_budget_item_id) ?? 0) + expense.amount
      )
    }
  }
  return {
    total,
    rows: budgetItems.map((item) => ({
      item,
      spent: spentByItem.get(item.id) ?? 0,
    })),
  }
}
