"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { parseMoneyInput, todayISO } from "@/lib/finance/format"
import { addGoalContribution } from "@/lib/goals/actions"

export function ContributeForm({
  goalId,
  onSaved,
}: {
  goalId: string
  onSaved?: () => void
}) {
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    const amount = parseMoneyInput(String(formData.get("amount") ?? ""))
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido.")
      return
    }

    setPending(true)
    const result = await addGoalContribution({
      goal_id: goalId,
      amount,
      contributed_on: String(formData.get("contributed_on") ?? todayISO()),
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Aporte registrado")
    onSaved?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contrib-amount">Quanto vão guardar agora</Label>
        <input
          id="contrib-amount"
          name="amount"
          required
          inputMode="decimal"
          placeholder="0,00"
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contrib-date">Data</Label>
        <input
          id="contrib-date"
          name="contributed_on"
          type="date"
          defaultValue={todayISO()}
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contrib-notes">Notas</Label>
        <input
          id="contrib-notes"
          name="notes"
          className={fieldClass}
          placeholder="Opcional"
        />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : "Registrar aporte"}
      </Button>
    </form>
  )
}
