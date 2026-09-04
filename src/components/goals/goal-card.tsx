"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ContributeForm } from "@/components/goals/contribute-form"
import { GoalForm } from "@/components/goals/goal-form"
import { formatBRL, formatMonthLabel } from "@/lib/finance/format"
import {
  deleteGoal,
  deleteGoalContribution,
  setGoalStatus,
} from "@/lib/goals/actions"
import { GOAL_KINDS, GOAL_PRIORITIES } from "@/lib/goals/types"
import type { GoalProgress } from "@/lib/goals/types"

export function GoalCard({ item }: { item: GoalProgress }) {
  const [contributeOpen, setContributeOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const { goal } = item
  const kindLabel = GOAL_KINDS.find((kind) => kind.value === goal.kind)?.label
  const priorityLabel = GOAL_PRIORITIES.find(
    (priority) => priority.value === goal.priority
  )?.label
  const bar = Math.min(100, item.percent)
  const statusLabel =
    goal.status === "completed"
      ? "Conquistado"
      : goal.status === "paused"
        ? "Pausado"
        : item.reached
          ? "Valor alcançado"
          : null

  async function changeStatus(status: "active" | "paused" | "completed") {
    const result = await setGoalStatus(goal.id, status)
    if (result.error) toast.error(result.error)
    else toast.success("Status atualizado")
  }

  async function remove() {
    const result = await deleteGoal(goal.id)
    if (result.error) toast.error(result.error)
    else toast.success("Sonho apagado")
  }

  return (
    <article className="rounded-3xl bg-card/90 p-4 ring-1 ring-foreground/8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="size-2.5 rounded-full"
              style={{ background: goal.color }}
            />
            {kindLabel}
            {priorityLabel ? ` · prioridade ${priorityLabel.toLowerCase()}` : ""}
            {goal.is_shared ? "" : " · pessoal"}
          </p>
          <h3 className="mt-1 font-heading text-xl tracking-tight">{goal.name}</h3>
        </div>
        {statusLabel ? (
          <span className="rounded-full bg-muted px-2 py-1 text-xs">{statusLabel}</span>
        ) : null}
      </div>

      <p className="mt-3 text-sm">
        {formatBRL(item.saved)} de {formatBRL(goal.target_amount)}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${bar}%`, background: goal.color }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Falta {formatBRL(item.remaining)}
        {item.monthlyNeeded != null
          ? ` · ${formatBRL(item.monthlyNeeded)} por mês`
          : ""}
        {goal.target_date
          ? ` · até ${formatMonthLabel(goal.target_date)}`
          : ""}
        {item.overdue ? " · a data já passou" : ""}
      </p>
      {goal.monthly_plan > 0 && item.monthlyNeeded != null ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Plano de vocês: {formatBRL(goal.monthly_plan)} / mês
          {goal.monthly_plan < item.monthlyNeeded
            ? " — um pouco abaixo do necessário"
            : " — no ritmo"}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {goal.status !== "completed" ? (
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            onClick={() => setContributeOpen(true)}
          >
            Aportar
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => setEditOpen(true)}
        >
          Editar
        </Button>
        {goal.status === "active" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl"
            onClick={() => void changeStatus("paused")}
          >
            Pausar
          </Button>
        ) : null}
        {goal.status === "paused" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl"
            onClick={() => void changeStatus("active")}
          >
            Retomar
          </Button>
        ) : null}
        {goal.status !== "completed" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl"
            onClick={() => void changeStatus("completed")}
          >
            Conquistamos
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl"
            onClick={() => void changeStatus("active")}
          >
            Reabrir
          </Button>
        )}
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={() => void remove()}
        >
          Apagar
        </button>
      </div>

      {item.contributions.length > 0 ? (
        <ul className="mt-4 space-y-1 border-t border-foreground/8 pt-3">
          {item.contributions.slice(0, 4).map((contribution) => (
            <li
              key={contribution.id}
              className="flex items-center justify-between text-xs text-muted-foreground"
            >
              <span>
                {contribution.contributed_on.split("-").reverse().join("/")} ·{" "}
                {formatBRL(contribution.amount)}
                {contribution.notes ? ` · ${contribution.notes}` : ""}
              </span>
              <button
                type="button"
                className="hover:text-destructive"
                onClick={async () => {
                  const result = await deleteGoalContribution(contribution.id)
                  if (result.error) toast.error(result.error)
                }}
              >
                desfazer
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aporte em {goal.name}</DialogTitle>
          </DialogHeader>
          <ContributeForm
            goalId={goal.id}
            onSaved={() => setContributeOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar sonho</DialogTitle>
          </DialogHeader>
          <GoalForm goal={goal} onSaved={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </article>
  )
}
