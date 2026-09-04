"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { parseMoneyInput } from "@/lib/finance/format"
import { createGoal, updateGoal } from "@/lib/goals/actions"
import {
  GOAL_COLORS,
  GOAL_KINDS,
  GOAL_PRIORITIES,
  type Goal,
} from "@/lib/goals/types"

export function GoalForm({
  goal,
  onSaved,
}: {
  goal?: Goal
  onSaved?: () => void
}) {
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    const target = parseMoneyInput(String(formData.get("target_amount") ?? ""))
    const initial = parseMoneyInput(String(formData.get("initial_amount") ?? "0"))
    const monthly = parseMoneyInput(String(formData.get("monthly_plan") ?? "0"))

    if (!Number.isFinite(target) || target <= 0) {
      toast.error("Informe o valor que vocês querem alcançar.")
      return
    }

    setPending(true)
    const payload = {
      name: String(formData.get("name") ?? ""),
      target_amount: target,
      initial_amount: Number.isFinite(initial) && initial > 0 ? initial : 0,
      target_date: String(formData.get("target_date") ?? "") || null,
      priority: String(formData.get("priority") ?? "medium") as Goal["priority"],
      kind: String(formData.get("kind") ?? "other") as Goal["kind"],
      color: String(formData.get("color") ?? GOAL_COLORS[0]),
      monthly_plan: Number.isFinite(monthly) && monthly > 0 ? monthly : 0,
      notes: String(formData.get("notes") ?? "").trim() || null,
      is_shared: true,
    }
    const result = goal
      ? await updateGoal(goal.id, payload)
      : await createGoal(payload)
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(goal ? "Sonho atualizado" : "Sonho guardado")
    onSaved?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-name">O que vocês sonham</Label>
        <input
          id="goal-name"
          name="name"
          required
          defaultValue={goal?.name}
          placeholder="Casa própria"
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="goal-target">Valor alvo</Label>
          <input
            id="goal-target"
            name="target_amount"
            required
            inputMode="decimal"
            placeholder="80.000,00"
            defaultValue={goal ? String(goal.target_amount).replace(".", ",") : ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-initial">Já guardado</Label>
          <input
            id="goal-initial"
            name="initial_amount"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={
              goal && goal.initial_amount
                ? String(goal.initial_amount).replace(".", ",")
                : "0"
            }
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="goal-date">Data desejada</Label>
          <input
            id="goal-date"
            name="target_date"
            type="date"
            defaultValue={goal?.target_date ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-monthly">Guardar por mês</Label>
          <input
            id="goal-monthly"
            name="monthly_plan"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={
              goal && goal.monthly_plan
                ? String(goal.monthly_plan).replace(".", ",")
                : ""
            }
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="goal-kind">Tipo</Label>
          <select
            id="goal-kind"
            name="kind"
            className={fieldClass}
            defaultValue={goal?.kind ?? "other"}
          >
            {GOAL_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-priority">Prioridade</Label>
          <select
            id="goal-priority"
            name="priority"
            className={fieldClass}
            defaultValue={goal?.priority ?? "medium"}
          >
            {GOAL_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal-color">Cor</Label>
        <input
          id="goal-color"
          name="color"
          type="color"
          defaultValue={goal?.color ?? GOAL_COLORS[0]}
          className="h-11 w-full rounded-xl border border-input bg-transparent p-1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal-notes">Notas</Label>
        <input
          id="goal-notes"
          name="notes"
          defaultValue={goal?.notes ?? ""}
          placeholder="Opcional"
          className={fieldClass}
        />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : goal ? "Salvar alterações" : "Guardar sonho"}
      </Button>
    </form>
  )
}
