"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth/session"
import {
  asUuid,
  dbError,
  hexColor,
  isoDate,
  isoDateOrNull,
  money,
  moneyPositive,
  notesField,
  shortText,
  zodError,
} from "@/lib/safe"

const goalSchema = z.object({
  name: shortText("Dê um nome para o sonho.", 120),
  target_amount: moneyPositive,
  initial_amount: money,
  target_date: isoDateOrNull,
  priority: z.enum(["low", "medium", "high"]),
  kind: z.enum(["travel", "home", "vehicle", "emergency", "other"]),
  color: hexColor,
  monthly_plan: money,
  notes: notesField,
  is_shared: z.boolean(),
})

const contributionSchema = z.object({
  goal_id: z.string().uuid(),
  amount: moneyPositive,
  contributed_on: isoDate,
  notes: notesField,
})

function refreshGoals() {
  revalidatePath("/")
  revalidatePath("/metas")
}

export async function createGoal(input: z.infer<typeof goalSchema>) {
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from("goals").insert({
    ...parsed.data,
    target_date: parsed.data.target_date || null,
    is_shared: true,
    status: "active",
    owner_id: user.id,
  })
  if (error) return { error: dbError(error.message) }
  refreshGoals()
  return { error: null }
}

export async function updateGoal(
  id: string,
  input: z.infer<typeof goalSchema>
) {
  const goalId = asUuid(id)
  if (!goalId) return { error: "Pedido inválido." }
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("goals")
    .update({
      ...parsed.data,
      target_date: parsed.data.target_date || null,
      is_shared: true,
    })
    .eq("id", goalId)
  if (error) return { error: dbError(error.message) }
  refreshGoals()
  return { error: null }
}

export async function setGoalStatus(
  id: string,
  status: "active" | "paused" | "completed"
) {
  const goalId = asUuid(id)
  if (!goalId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("goals").update({ status }).eq("id", goalId)
  if (error) return { error: dbError(error.message) }
  refreshGoals()
  return { error: null }
}

export async function deleteGoal(id: string) {
  const goalId = asUuid(id)
  if (!goalId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("goals").delete().eq("id", goalId)
  if (error) return { error: dbError(error.message) }
  refreshGoals()
  return { error: null }
}

export async function addGoalContribution(
  input: z.infer<typeof contributionSchema>
) {
  const parsed = contributionSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase, user } = await requireUser()
  const { data: goal, error: loadError } = await supabase
    .from("goals")
    .select("id, is_shared")
    .eq("id", parsed.data.goal_id)
    .single()

  if (loadError || !goal) {
    return { error: "Meta não encontrada." }
  }

  const { error } = await supabase.from("goal_contributions").insert({
    goal_id: parsed.data.goal_id,
    amount: parsed.data.amount,
    contributed_on: parsed.data.contributed_on,
    notes: parsed.data.notes,
    owner_id: user.id,
    is_shared: true,
  })
  if (error) return { error: dbError(error.message) }
  refreshGoals()
  return { error: null }
}

export async function deleteGoalContribution(id: string) {
  const contributionId = asUuid(id)
  if (!contributionId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("id", contributionId)
  if (error) return { error: dbError(error.message) }
  refreshGoals()
  return { error: null }
}
