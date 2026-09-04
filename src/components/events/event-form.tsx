"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { checkboxClass, fieldClass } from "@/components/finance/fields"
import { parseMoneyInput, todayISO } from "@/lib/finance/format"
import { createEvent, updateEvent } from "@/lib/events/actions"
import {
  EVENT_KINDS,
  EVENT_STATUSES,
  type CoupleEvent,
  type EventKind,
} from "@/lib/events/types"

export function EventForm({
  event,
  defaultDate,
  onSaved,
}: {
  event?: CoupleEvent
  defaultDate?: string
  onSaved?: () => void
}) {
  const [pending, setPending] = useState(false)
  const [kind, setKind] = useState<EventKind>(event?.kind ?? "date")
  const yearlyDefault =
    event?.repeats_yearly ?? (kind === "birthday" || kind === "anniversary")

  async function onSubmit(formData: FormData) {
    const planned = parseMoneyInput(String(formData.get("planned_amount") ?? "0"))
    const payload = {
      title: String(formData.get("title") ?? ""),
      occurs_on: String(formData.get("occurs_on") ?? todayISO()),
      kind,
      status: String(formData.get("status") ?? "planned") as CoupleEvent["status"],
      place: String(formData.get("place") ?? "").trim() || null,
      planned_amount: Number.isFinite(planned) && planned > 0 ? planned : 0,
      notes: String(formData.get("notes") ?? "").trim() || null,
      is_surprise: formData.get("is_surprise") === "on",
      repeats_yearly: formData.get("repeats_yearly") === "on",
      is_shared: formData.get("is_shared") === "on",
    }

    setPending(true)
    const result = event
      ? await updateEvent(event.id, payload)
      : await createEvent(payload)
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(event ? "Atualizado" : "Guardado no calendário")
    onSaved?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-title">Nome</Label>
        <input
          id="event-title"
          name="title"
          required
          defaultValue={event?.title}
          placeholder={kind === "date" ? "Jantar no italiano" : "Aniversário"}
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="event-kind">Tipo</Label>
          <select
            id="event-kind"
            className={fieldClass}
            value={kind}
            onChange={(change) => setKind(change.target.value as EventKind)}
          >
            {EVENT_KINDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-status">Status</Label>
          <select
            id="event-status"
            name="status"
            className={fieldClass}
            defaultValue={event?.status ?? "planned"}
          >
            {EVENT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="event-date">Data</Label>
          <input
            id="event-date"
            name="occurs_on"
            type="date"
            required
            defaultValue={event?.occurs_on ?? defaultDate ?? todayISO()}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-budget">Orçamento</Label>
          <input
            id="event-budget"
            name="planned_amount"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={
              event && event.planned_amount
                ? String(event.planned_amount).replace(".", ",")
                : ""
            }
            className={fieldClass}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-place">Local</Label>
        <input
          id="event-place"
          name="place"
          defaultValue={event?.place ?? ""}
          placeholder="Opcional"
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-notes">Notas</Label>
        <input
          id="event-notes"
          name="notes"
          defaultValue={event?.notes ?? ""}
          placeholder="Opcional"
          className={fieldClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_shared"
          className={checkboxClass}
          defaultChecked={event?.is_shared ?? true}
        />
        Compartilhado com o casal
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_surprise"
          className={checkboxClass}
          defaultChecked={event?.is_surprise ?? false}
        />
        Surpresa — a outra pessoa só vê no dia
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="repeats_yearly"
          className={checkboxClass}
          defaultChecked={yearlyDefault}
        />
        Repete todo ano
      </label>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : event ? "Salvar alterações" : "Salvar no calendário"}
      </Button>
    </form>
  )
}
