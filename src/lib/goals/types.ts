export type GoalKind = "travel" | "home" | "vehicle" | "emergency" | "other"
export type GoalPriority = "low" | "medium" | "high"
export type GoalStatus = "active" | "paused" | "completed"

export type Goal = {
  id: string
  name: string
  target_amount: number
  initial_amount: number
  target_date: string | null
  priority: GoalPriority
  kind: GoalKind
  color: string
  monthly_plan: number
  notes: string | null
  status: GoalStatus
  owner_id: string
  is_shared: boolean
  created_at: string
}

export type GoalContribution = {
  id: string
  goal_id: string
  amount: number
  contributed_on: string
  notes: string | null
  owner_id: string
  is_shared: boolean
}

export type GoalProgress = {
  goal: Goal
  contributions: GoalContribution[]
  saved: number
  remaining: number
  percent: number
  monthsLeft: number | null
  monthlyNeeded: number | null
  overdue: boolean
  reached: boolean
}

export type GoalsBootstrap = {
  ready: boolean
  schemaSql: string
  userId: string
  goals: Goal[]
  contributions: GoalContribution[]
}

export const GOAL_KINDS: { value: GoalKind; label: string }[] = [
  { value: "home", label: "Casa" },
  { value: "travel", label: "Viagem" },
  { value: "vehicle", label: "Carro" },
  { value: "emergency", label: "Reserva" },
  { value: "other", label: "Outro" },
]

export const GOAL_PRIORITIES: { value: GoalPriority; label: string }[] = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
]

export const GOAL_COLORS = ["#c4785a", "#5c8a6a", "#5b7c99", "#c46b84", "#c4a35a", "#8a7e72"]
