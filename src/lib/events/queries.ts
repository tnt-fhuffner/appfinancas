import { cache } from "react"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"
import { isMissingTable } from "@/lib/finance/errors"
import { toNumber } from "@/lib/finance/format"
import { readMigration } from "@/lib/migrations"
import type { CoupleEvent, EventsBootstrap } from "@/lib/events/types"

export async function getEventsSql() {
  return readMigration("0005_events.sql")
}

function mapEvent(row: Record<string, unknown>): CoupleEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    occurs_on: String(row.occurs_on).slice(0, 10),
    kind: row.kind as CoupleEvent["kind"],
    status: row.status as CoupleEvent["status"],
    place: (row.place as string | null) ?? null,
    planned_amount: toNumber(row.planned_amount),
    notes: (row.notes as string | null) ?? null,
    is_surprise: Boolean(row.is_surprise),
    repeats_yearly: Boolean(row.repeats_yearly),
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
    created_at: String(row.created_at),
  }
}

export const getEventsBootstrap = cache(async (): Promise<EventsBootstrap> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email || !isAllowedEmail(user.email)) {
    return { ready: false, schemaSql: "", userId: "", events: [] }
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("occurs_on", { ascending: true })

  if (isMissingTable(error)) {
    return {
      ready: false,
      schemaSql: await getEventsSql(),
      userId: user.id,
      events: [],
    }
  }

  return {
    ready: true,
    schemaSql: "",
    userId: user.id,
    events: (data ?? []).map((row) => mapEvent(row as Record<string, unknown>)),
  }
})
