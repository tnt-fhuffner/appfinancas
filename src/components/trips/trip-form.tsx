"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { checkboxClass, fieldClass } from "@/components/finance/fields"
import { parseMoneyInput, todayISO } from "@/lib/finance/format"
import { createTrip, updateTrip } from "@/lib/trips/actions"
import { TRIP_STATUSES, type Trip } from "@/lib/trips/types"

export function TripForm({
  trip,
  onSaved,
}: {
  trip?: Trip
  onSaved?: () => void
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    const planned = parseMoneyInput(String(formData.get("planned_amount") ?? "0"))
    const payload = {
      destination: String(formData.get("destination") ?? ""),
      start_on: String(formData.get("start_on") ?? todayISO()),
      end_on: String(formData.get("end_on") ?? todayISO()),
      planned_amount: Number.isFinite(planned) && planned > 0 ? planned : 0,
      status: String(formData.get("status") ?? "planning") as Trip["status"],
      notes: String(formData.get("notes") ?? "").trim() || null,
      is_shared: formData.get("is_shared") === "on",
    }

    setPending(true)
    if (trip) {
      const result = await updateTrip(trip.id, payload)
      setPending(false)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Viagem atualizada")
      onSaved?.()
      return
    }

    const result = await createTrip(payload)
    setPending(false)
    if (result.error || !result.id) {
      toast.error(result.error ?? "Não deu para criar.")
      return
    }
    toast.success("Viagem criada")
    onSaved?.()
    router.push(`/viagens/${result.id}`)
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="trip-destination">Destino</Label>
        <input
          id="trip-destination"
          name="destination"
          required
          defaultValue={trip?.destination}
          placeholder="Gramado"
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="trip-start">Ida</Label>
          <input
            id="trip-start"
            name="start_on"
            type="date"
            required
            defaultValue={trip?.start_on ?? todayISO()}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trip-end">Volta</Label>
          <input
            id="trip-end"
            name="end_on"
            type="date"
            required
            defaultValue={trip?.end_on ?? todayISO()}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="trip-budget">Orçamento</Label>
          <input
            id="trip-budget"
            name="planned_amount"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={
              trip && trip.planned_amount
                ? String(trip.planned_amount).replace(".", ",")
                : ""
            }
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trip-status">Status</Label>
          <select
            id="trip-status"
            name="status"
            className={fieldClass}
            defaultValue={trip?.status ?? "planning"}
          >
            {TRIP_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trip-notes">Notas</Label>
        <input
          id="trip-notes"
          name="notes"
          defaultValue={trip?.notes ?? ""}
          placeholder="Opcional"
          className={fieldClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_shared"
          className={checkboxClass}
          defaultChecked={trip?.is_shared ?? true}
        />
        Viagem de vocês dois
      </label>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : trip ? "Salvar alterações" : "Criar viagem"}
      </Button>
    </form>
  )
}
