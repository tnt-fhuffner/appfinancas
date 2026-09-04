export type TripStatus = "planning" | "confirmed" | "completed"
export type TripBudgetKind =
  | "flight"
  | "lodging"
  | "food"
  | "tours"
  | "shopping"
  | "other"

export type Trip = {
  id: string
  destination: string
  start_on: string
  end_on: string
  planned_amount: number
  status: TripStatus
  notes: string | null
  owner_id: string
  is_shared: boolean
  created_at: string
}

export type TripBudgetItem = {
  id: string
  trip_id: string
  kind: TripBudgetKind
  planned_amount: number
}

export type TripChecklistItem = {
  id: string
  trip_id: string
  title: string
  done: boolean
  sort_order: number
}

export type TripItineraryItem = {
  id: string
  trip_id: string
  occurs_on: string
  title: string
  place: string | null
  notes: string | null
}

export type TripExpense = {
  id: string
  amount: number
  occurred_on: string
  notes: string | null
  trip_budget_item_id: string | null
  account_name: string | null
}

export type TripsBootstrap = {
  ready: boolean
  schemaSql: string
  userId: string
  trips: Trip[]
}

export type TripDetail = {
  ready: boolean
  schemaSql: string
  trip: Trip | null
  budgetItems: TripBudgetItem[]
  checklist: TripChecklistItem[]
  itinerary: TripItineraryItem[]
  expenses: TripExpense[]
}

export const TRIP_STATUSES: { value: TripStatus; label: string }[] = [
  { value: "planning", label: "Planejando" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Concluída" },
]

export const TRIP_BUDGET_KINDS: { value: TripBudgetKind; label: string }[] = [
  { value: "flight", label: "Passagem" },
  { value: "lodging", label: "Hospedagem" },
  { value: "food", label: "Alimentação" },
  { value: "tours", label: "Passeios" },
  { value: "shopping", label: "Compras" },
  { value: "other", label: "Outros" },
]

export const DEFAULT_CHECKLIST = [
  "Documentos",
  "Reservas (passagem e hotel)",
  "Malas",
  "Seguro viagem",
  "Câmbio ou cartão internacional",
]
