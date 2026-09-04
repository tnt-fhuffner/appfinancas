import { cache } from "react"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"
import { isMissingTable } from "@/lib/finance/errors"
import { toNumber } from "@/lib/finance/format"
import { readMigration } from "@/lib/migrations"
import { asUuid } from "@/lib/safe"
import type {
  Trip,
  TripBudgetItem,
  TripChecklistItem,
  TripDetail,
  TripExpense,
  TripItineraryItem,
  TripsBootstrap,
} from "@/lib/trips/types"

export async function getTripsSql() {
  return readMigration("0004_trips.sql")
}

function mapTrip(row: Record<string, unknown>): Trip {
  return {
    id: String(row.id),
    destination: String(row.destination),
    start_on: String(row.start_on).slice(0, 10),
    end_on: String(row.end_on).slice(0, 10),
    planned_amount: toNumber(row.planned_amount),
    status: row.status as Trip["status"],
    notes: (row.notes as string | null) ?? null,
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
    created_at: String(row.created_at),
  }
}

function mapBudgetItem(row: Record<string, unknown>): TripBudgetItem {
  return {
    id: String(row.id),
    trip_id: String(row.trip_id),
    kind: row.kind as TripBudgetItem["kind"],
    planned_amount: toNumber(row.planned_amount),
  }
}

function mapChecklist(row: Record<string, unknown>): TripChecklistItem {
  return {
    id: String(row.id),
    trip_id: String(row.trip_id),
    title: String(row.title),
    done: Boolean(row.done),
    sort_order: Number(row.sort_order ?? 0),
  }
}

function mapItinerary(row: Record<string, unknown>): TripItineraryItem {
  return {
    id: String(row.id),
    trip_id: String(row.trip_id),
    occurs_on: String(row.occurs_on).slice(0, 10),
    title: String(row.title),
    place: (row.place as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  }
}

export const getTripsBootstrap = cache(async (): Promise<TripsBootstrap> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email || !isAllowedEmail(user.email)) {
    return { ready: false, schemaSql: "", userId: "", trips: [] }
  }

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_on", { ascending: true })

  if (isMissingTable(error)) {
    return {
      ready: false,
      schemaSql: await getTripsSql(),
      userId: user.id,
      trips: [],
    }
  }

  return {
    ready: true,
    schemaSql: "",
    userId: user.id,
    trips: (data ?? []).map((row) => mapTrip(row as Record<string, unknown>)),
  }
})

export const getTripDetail = cache(async (id: string): Promise<TripDetail> => {
  const tripId = asUuid(id)
  const empty: TripDetail = {
    ready: false,
    schemaSql: "",
    trip: null,
    budgetItems: [],
    checklist: [],
    itinerary: [],
    expenses: [],
  }

  if (!tripId) {
    return { ...empty, ready: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isAllowedEmail(user.email)) {
    return { ...empty, ready: true }
  }

  const { data: tripRow, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .maybeSingle()

  if (isMissingTable(tripError)) {
    return { ...empty, schemaSql: await getTripsSql() }
  }

  if (!tripRow) return { ...empty, ready: true }

  const [budgetRes, checklistRes, itineraryRes, expensesRes, accountsRes] =
    await Promise.all([
      supabase.from("trip_budget_items").select("*").eq("trip_id", tripId),
      supabase
        .from("trip_checklist")
        .select("*")
        .eq("trip_id", tripId)
        .order("sort_order"),
      supabase
        .from("trip_itinerary")
        .select("*")
        .eq("trip_id", tripId)
        .order("occurs_on"),
      supabase
        .from("transactions")
        .select("id, amount, occurred_on, notes, trip_budget_item_id, account_id")
        .eq("trip_id", tripId)
        .order("occurred_on", { ascending: false }),
      supabase.from("accounts").select("id, name"),
    ])

  const accountsById = new Map(
    (accountsRes.data ?? []).map((account) => [String(account.id), String(account.name)])
  )

  const expenses: TripExpense[] = isMissingTable(expensesRes.error)
    ? []
    : (expensesRes.data ?? []).map((row) => {
        const record = row as Record<string, unknown>
        const accountId = record.account_id ? String(record.account_id) : null
        return {
          id: String(record.id),
          amount: toNumber(record.amount),
          occurred_on: String(record.occurred_on).slice(0, 10),
          notes: (record.notes as string | null) ?? null,
          trip_budget_item_id: (record.trip_budget_item_id as string | null) ?? null,
          account_name: accountId ? (accountsById.get(accountId) ?? null) : null,
        }
      })

  return {
    ready: true,
    schemaSql: "",
    trip: mapTrip(tripRow as Record<string, unknown>),
    budgetItems: (budgetRes.data ?? [])
      .map((row) => mapBudgetItem(row as Record<string, unknown>))
      .sort((a, b) => a.kind.localeCompare(b.kind)),
    checklist: (checklistRes.data ?? []).map((row) =>
      mapChecklist(row as Record<string, unknown>)
    ),
    itinerary: (itineraryRes.data ?? []).map((row) =>
      mapItinerary(row as Record<string, unknown>)
    ),
    expenses,
  }
})
