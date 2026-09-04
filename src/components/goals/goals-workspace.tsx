"use client"

import { useState } from "react"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { GoalCard } from "@/components/goals/goal-card"
import { GoalForm } from "@/components/goals/goal-form"
import { progressForGoals } from "@/lib/goals/progress"
import type { GoalsBootstrap } from "@/lib/goals/types"

export function GoalsWorkspace({ data }: { data: GoalsBootstrap }) {
  const [open, setOpen] = useState(false)
  const items = progressForGoals(data.goals, data.contributions)
  const active = items.filter((item) => item.goal.status !== "completed")
  const done = items.filter((item) => item.goal.status === "completed")

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">Metas e sonhos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quanto falta, o ritmo por mês e o progresso de vocês dois.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="rounded-xl" />}>
            <Plus className="size-4" />
            Novo sonho
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo sonho</DialogTitle>
            </DialogHeader>
            <GoalForm onSaved={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="O primeiro sonho"
          description="Casa, reserva, viagem: o que vocês querem construir juntos começa com um valor e uma data."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((item) => (
            <GoalCard key={item.goal.id} item={item} />
          ))}
        </div>
      )}

      {done.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-heading text-lg">Já conquistados</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {done.map((item) => (
              <GoalCard key={item.goal.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
