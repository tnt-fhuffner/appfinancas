export type EventKind = "date" | "event" | "birthday" | "anniversary"
export type EventStatus = "idea" | "planned" | "done"

export type CoupleEvent = {
  id: string
  title: string
  occurs_on: string
  kind: EventKind
  status: EventStatus
  place: string | null
  planned_amount: number
  notes: string | null
  is_surprise: boolean
  repeats_yearly: boolean
  owner_id: string
  is_shared: boolean
  created_at: string
}

export type EventOccurrence = CoupleEvent & {
  occurrence_on: string
}

export type EventsBootstrap = {
  ready: boolean
  schemaSql: string
  userId: string
  events: CoupleEvent[]
}

export const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "event", label: "Evento" },
  { value: "birthday", label: "Aniversário" },
  { value: "anniversary", label: "Data especial" },
]

export const EVENT_STATUSES: { value: EventStatus; label: string }[] = [
  { value: "idea", label: "Ideia" },
  { value: "planned", label: "Planejado" },
  { value: "done", label: "Realizado" },
]
