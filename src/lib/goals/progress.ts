import { toNumber, todayISO } from "@/lib/finance/format"
import type { Goal, GoalContribution, GoalProgress } from "@/lib/goals/types"

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

export function monthsBetween(fromISO: string, toISO: string) {
  const [fromYear, fromMonth] = fromISO.split("-").map(Number)
  const [toYear, toMonth] = toISO.split("-").map(Number)
  return (toYear - fromYear) * 12 + (toMonth - fromMonth)
}

export function goalProgress(
  goal: Goal,
  contributions: GoalContribution[],
  today = todayISO()
): GoalProgress {
  const related = contributions.filter((item) => item.goal_id === goal.id)
  const saved =
    toNumber(goal.initial_amount) +
    related.reduce((sum, item) => sum + toNumber(item.amount), 0)
  const remaining = Math.max(0, toNumber(goal.target_amount) - saved)
  const percent =
    goal.target_amount > 0 ? Math.min(999, (saved / goal.target_amount) * 100) : 0
  const reached = remaining <= 0 && goal.target_amount > 0

  let monthsLeft: number | null = null
  let monthlyNeeded: number | null = null
  let overdue = false

  if (goal.target_date) {
    const delta = monthsBetween(today, goal.target_date)
    overdue = delta < 0 && !reached
    monthsLeft = Math.max(1, delta)
    monthlyNeeded = reached ? 0 : remaining / monthsLeft
  }

  return {
    goal,
    contributions: related.sort((a, b) =>
      a.contributed_on < b.contributed_on ? 1 : -1
    ),
    saved,
    remaining,
    percent,
    monthsLeft,
    monthlyNeeded,
    overdue,
    reached,
  }
}

export function progressForGoals(
  goals: Goal[],
  contributions: GoalContribution[]
): GoalProgress[] {
  return goals
    .map((goal) => goalProgress(goal, contributions))
    .sort((a, b) => {
      if (a.goal.status !== b.goal.status) {
        if (a.goal.status === "active") return -1
        if (b.goal.status === "active") return 1
        if (a.goal.status === "paused") return -1
        if (b.goal.status === "paused") return 1
      }
      const rank =
        PRIORITY_RANK[a.goal.priority] - PRIORITY_RANK[b.goal.priority]
      if (rank !== 0) return rank
      return (a.goal.target_date ?? "9999") < (b.goal.target_date ?? "9999")
        ? -1
        : 1
    })
}
