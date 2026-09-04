import { cache } from "react"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"
import { isMissingTable } from "@/lib/finance/errors"
import { toNumber } from "@/lib/finance/format"
import { readMigration } from "@/lib/migrations"
import type { Goal, GoalContribution, GoalsBootstrap } from "@/lib/goals/types"

export async function getGoalsSql() {
  return readMigration("0003_goals.sql")
}

function mapGoal(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    name: String(row.name),
    target_amount: toNumber(row.target_amount),
    initial_amount: toNumber(row.initial_amount),
    target_date: row.target_date ? String(row.target_date).slice(0, 10) : null,
    priority: row.priority as Goal["priority"],
    kind: row.kind as Goal["kind"],
    color: String(row.color),
    monthly_plan: toNumber(row.monthly_plan),
    notes: (row.notes as string | null) ?? null,
    status: row.status as Goal["status"],
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
    created_at: String(row.created_at),
  }
}

function mapContribution(row: Record<string, unknown>): GoalContribution {
  return {
    id: String(row.id),
    goal_id: String(row.goal_id),
    amount: toNumber(row.amount),
    contributed_on: String(row.contributed_on).slice(0, 10),
    notes: (row.notes as string | null) ?? null,
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
  }
}

function emptyBootstrap(
  extra: Partial<GoalsBootstrap> & Pick<GoalsBootstrap, "userId">
): GoalsBootstrap {
  return {
    ready: false,
    schemaSql: "",
    goals: [],
    contributions: [],
    ...extra,
  }
}

export const getGoalsBootstrap = cache(async (): Promise<GoalsBootstrap> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isAllowedEmail(user.email)) {
    return emptyBootstrap({ userId: "" })
  }

  const { error: probeError } = await supabase.from("goals").select("id").limit(1)

  if (isMissingTable(probeError)) {
    return emptyBootstrap({
      userId: user.id,
      schemaSql: await getGoalsSql(),
    })
  }

  const [goalsRes, contributionsRes] = await Promise.all([
    supabase.from("goals").select("*").order("created_at", { ascending: false }),
    supabase
      .from("goal_contributions")
      .select("*")
      .order("contributed_on", { ascending: false }),
  ])

  if (isMissingTable(goalsRes.error) || isMissingTable(contributionsRes.error)) {
    return emptyBootstrap({
      userId: user.id,
      schemaSql: await getGoalsSql(),
    })
  }

  return {
    ready: true,
    schemaSql: "",
    userId: user.id,
    goals: (goalsRes.data ?? []).map((row) => mapGoal(row as Record<string, unknown>)),
    contributions: (contributionsRes.data ?? []).map((row) =>
      mapContribution(row as Record<string, unknown>)
    ),
  }
})
