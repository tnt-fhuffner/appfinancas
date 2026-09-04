"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth/session"
import {
  asUuid,
  dbError,
  isoDate,
  money,
  notesField,
  nullableText,
  shortText,
  zodError,
} from "@/lib/safe"

const eventSchema = z.object({
  title: shortText("Dê um nome para o encontro.", 120),
  occurs_on: isoDate,
  kind: z.enum(["date", "event", "birthday", "anniversary"]),
  status: z.enum(["idea", "planned", "done"]),
  place: nullableText(120),
  planned_amount: money,
  notes: notesField,
  is_surprise: z.boolean(),
  repeats_yearly: z.boolean(),
  is_shared: z.boolean(),
})

function refreshEvents() {
  revalidatePath("/")
  revalidatePath("/eventos")
}

export async function createEvent(input: z.infer<typeof eventSchema>) {
  const parsed = eventSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from("events").insert({
    ...parsed.data,
    is_shared: true,
    owner_id: user.id,
  })
  if (error) return { error: dbError(error.message) }
  refreshEvents()
  return { error: null }
}

export async function updateEvent(
  id: string,
  input: z.infer<typeof eventSchema>
) {
  const eventId = asUuid(id)
  if (!eventId) return { error: "Pedido inválido." }
  const parsed = eventSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("events")
    .update({ ...parsed.data, is_shared: true })
    .eq("id", eventId)
  if (error) return { error: dbError(error.message) }
  refreshEvents()
  return { error: null }
}

export async function setEventStatus(
  id: string,
  status: "idea" | "planned" | "done"
) {
  const eventId = asUuid(id)
  if (!eventId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
  if (error) return { error: dbError(error.message) }
  refreshEvents()
  return { error: null }
}

export async function deleteEvent(id: string) {
  const eventId = asUuid(id)
  if (!eventId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("events").delete().eq("id", eventId)
  if (error) return { error: dbError(error.message) }
  refreshEvents()
  return { error: null }
}
