"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth/session"
import {
  DEFAULT_CHECKLIST,
  TRIP_BUDGET_KINDS,
} from "@/lib/trips/types"
import {
  asUuid,
  dbError,
  isoDate,
  money,
  moneyPositive,
  notesField,
  nullableText,
  shortText,
  zodError,
} from "@/lib/safe"

const tripSchema = z.object({
  destination: shortText("Para onde vocês vão?", 120),
  start_on: isoDate,
  end_on: isoDate,
  planned_amount: money,
  status: z.enum(["planning", "confirmed", "completed"]),
  notes: notesField,
  is_shared: z.boolean(),
})

function refreshTrips(tripId?: string) {
  revalidatePath("/")
  revalidatePath("/viagens")
  revalidatePath("/financas")
  if (tripId) revalidatePath(`/viagens/${tripId}`)
}

export async function createTrip(input: z.infer<typeof tripSchema>) {
  const parsed = tripSchema.safeParse(input)
  if (!parsed.success) return { error: zodError(parsed.error).error, id: null }
  if (parsed.data.end_on < parsed.data.start_on) {
    return { error: "A volta não pode ser antes da ida.", id: null }
  }

  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from("trips")
    .insert({
      ...parsed.data,
      owner_id: user.id,
    })
    .select("id")
    .single()

  if (error || !data) return { error: dbError(error?.message), id: null }

  await Promise.all([
    supabase.from("trip_budget_items").insert(
      TRIP_BUDGET_KINDS.map((kind) => ({
        trip_id: data.id,
        kind: kind.value,
        planned_amount: 0,
        owner_id: user.id,
        is_shared: parsed.data.is_shared,
      }))
    ),
    supabase.from("trip_checklist").insert(
      DEFAULT_CHECKLIST.map((title, index) => ({
        trip_id: data.id,
        title,
        done: false,
        sort_order: index,
        owner_id: user.id,
        is_shared: parsed.data.is_shared,
      }))
    ),
  ])

  refreshTrips(data.id)
  return { error: null, id: data.id as string }
}

export async function updateTrip(
  id: string,
  input: z.infer<typeof tripSchema>
) {
  const tripId = asUuid(id)
  if (!tripId) return { error: "Pedido inválido." }
  const parsed = tripSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  if (parsed.data.end_on < parsed.data.start_on) {
    return { error: "A volta não pode ser antes da ida." }
  }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("trips").update(parsed.data).eq("id", tripId)
  if (error) return { error: dbError(error.message) }
  refreshTrips(tripId)
  return { error: null }
}

export async function deleteTrip(id: string) {
  const tripId = asUuid(id)
  if (!tripId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("trips").delete().eq("id", tripId)
  if (error) return { error: dbError(error.message) }
  refreshTrips(tripId)
  return { error: null }
}

export async function saveTripBudget(
  tripId: string,
  items: { id: string; planned_amount: number }[]
) {
  const id = asUuid(tripId)
  if (!id) return { error: "Pedido inválido." }
  const parsed = z
    .array(
      z.object({
        id: z.string().uuid(),
        planned_amount: money,
      })
    )
    .max(20)
    .safeParse(items)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase } = await requireUser()

  const results = await Promise.all(
    parsed.data.map((item) =>
      supabase
        .from("trip_budget_items")
        .update({ planned_amount: item.planned_amount })
        .eq("id", item.id)
        .eq("trip_id", id)
    )
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) return { error: dbError(failed.error.message) }

  refreshTrips(id)
  return { error: null }
}

export async function addChecklistItem(tripId: string, title: string) {
  const id = asUuid(tripId)
  if (!id) return { error: "Pedido inválido." }
  const trimmed = title.trim()
  if (!trimmed) return { error: "Escreva a tarefa." }
  if (trimmed.length > 120) return { error: "Texto longo demais." }
  const { supabase, user } = await requireUser()
  const { data: trip } = await supabase
    .from("trips")
    .select("is_shared")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("trip_checklist").insert({
    trip_id: id,
    title: trimmed,
    done: false,
    sort_order: 99,
    owner_id: user.id,
    is_shared: trip?.is_shared ?? true,
  })
  if (error) return { error: dbError(error.message) }
  refreshTrips(id)
  return { error: null }
}

export async function toggleChecklistItem(id: string, tripId: string, done: boolean) {
  const itemId = asUuid(id)
  const trip = asUuid(tripId)
  if (!itemId || !trip) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("trip_checklist")
    .update({ done })
    .eq("id", itemId)
  if (error) return { error: dbError(error.message) }
  refreshTrips(trip)
  return { error: null }
}

export async function deleteChecklistItem(id: string, tripId: string) {
  const itemId = asUuid(id)
  const trip = asUuid(tripId)
  if (!itemId || !trip) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("trip_checklist").delete().eq("id", itemId)
  if (error) return { error: dbError(error.message) }
  refreshTrips(trip)
  return { error: null }
}

export async function addItineraryItem(input: {
  trip_id: string
  occurs_on: string
  title: string
  place: string | null
  notes: string | null
}) {
  const parsed = z
    .object({
      trip_id: z.string().uuid(),
      occurs_on: isoDate,
      title: shortText("Dê um nome para o passeio.", 120),
      place: nullableText(120),
      notes: notesField,
    })
    .safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase, user } = await requireUser()
  const { data: trip } = await supabase
    .from("trips")
    .select("is_shared")
    .eq("id", parsed.data.trip_id)
    .single()

  const { error } = await supabase.from("trip_itinerary").insert({
    ...parsed.data,
    owner_id: user.id,
    is_shared: trip?.is_shared ?? true,
  })
  if (error) return { error: dbError(error.message) }
  refreshTrips(parsed.data.trip_id)
  return { error: null }
}

export async function deleteItineraryItem(id: string, tripId: string) {
  const itemId = asUuid(id)
  const trip = asUuid(tripId)
  if (!itemId || !trip) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("trip_itinerary").delete().eq("id", itemId)
  if (error) return { error: dbError(error.message) }
  refreshTrips(trip)
  return { error: null }
}

export async function addTripExpense(input: {
  trip_id: string
  trip_budget_item_id: string
  account_id: string
  amount: number
  occurred_on: string
  notes: string | null
}) {
  const parsed = z
    .object({
      trip_id: z.string().uuid(),
      trip_budget_item_id: z.string().uuid(),
      account_id: z.string().uuid(),
      amount: moneyPositive,
      occurred_on: isoDate,
      notes: notesField,
    })
    .safeParse(input)
  if (!parsed.success) return zodError(parsed.error)

  const { supabase, user } = await requireUser()
  const { data: trip } = await supabase
    .from("trips")
    .select("is_shared, destination")
    .eq("id", parsed.data.trip_id)
    .single()

  if (!trip) return { error: "Viagem não encontrada." }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("kind", "expense")

  const travelCategory =
    categories?.find((category) => category.name.toLowerCase() === "viagem") ??
    categories?.[0]

  const { error } = await supabase.from("transactions").insert({
    amount: parsed.data.amount,
    type: "expense",
    account_id: parsed.data.account_id,
    category_id: travelCategory?.id ?? null,
    occurred_on: parsed.data.occurred_on,
    owner_id: user.id,
    is_shared: trip.is_shared,
    notes: parsed.data.notes || `Viagem: ${trip.destination}`,
    recurrence: "once",
    trip_id: parsed.data.trip_id,
    trip_budget_item_id: parsed.data.trip_budget_item_id,
  })
  if (error) return { error: dbError(error.message) }
  refreshTrips(parsed.data.trip_id)
  return { error: null }
}
