"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EventForm } from "@/components/events/event-form"
import {
  formatBRL,
  formatDay,
  formatMonthLabel,
  monthBounds,
  todayISO,
} from "@/lib/finance/format"
import {
  deleteEvent,
  setEventStatus,
} from "@/lib/events/actions"
import {
  eventsOnDay,
  monthCells,
  occurrenceInMonth,
  reminderLabel,
  upcomingOccurrences,
} from "@/lib/events/calendar"
import {
  EVENT_KINDS,
  EVENT_STATUSES,
  type CoupleEvent,
  type EventOccurrence,
} from "@/lib/events/types"

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]

export function EventsWorkspace({
  events,
  userId,
}: {
  events: CoupleEvent[]
  userId: string
}) {
  const today = todayISO()
  const initial = monthBounds(today)
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [selected, setSelected] = useState(today)
  const [createOpen, setCreateOpen] = useState(false)
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const cells = monthCells(year, month)
  const upcoming = upcomingOccurrences(events, 14, today)
  const dayEvents = eventsOnDay(events, selected)
  const hiddenSurprises = events.filter(
    (event) =>
      event.is_surprise &&
      event.owner_id === userId &&
      event.occurs_on > today
  ).length

  const dotted = useMemo(() => {
    const dates = new Set<string>()
    for (const event of events) {
      const on = occurrenceInMonth(event, year, month)
      if (on) dates.add(on)
    }
    return dates
  }, [events, year, month])

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">Eventos e dates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Calendário de vocês dois, com espaço para uma surpresa.
          </p>
          {hiddenSurprises > 0 ? (
            <p className="mt-1 text-xs text-primary">
              {hiddenSurprises} surpresa{hiddenSurprises === 1 ? "" : "s"} só você vê
              por enquanto.
            </p>
          ) : null}
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl" />}>
            <Plus className="size-4" />
            Novo
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo encontro</DialogTitle>
            </DialogHeader>
            <EventForm
              defaultDate={selected}
              onSaved={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {upcoming.length > 0 ? (
        <section>
          <h3 className="mb-2 font-heading text-lg">Em breve</h3>
          <ul className="space-y-2">
            {upcoming.slice(0, 5).map((event) => (
              <EventRow
                key={`${event.id}-${event.occurrence_on}`}
                event={event}
                userId={userId}
                occurrenceOn={event.occurrence_on}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl bg-card/90 p-4 ring-1 ring-foreground/8">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => shiftMonth(-1)}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="font-heading capitalize">{formatMonthLabel(monthStart)}</p>
          <button
            type="button"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => shiftMonth(1)}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, index) => {
            if (!cell) return <span key={`empty-${index}`} />
            const isToday = cell === today
            const isSelected = cell === selected
            const hasEvent = dotted.has(cell)
            return (
              <button
                key={cell}
                type="button"
                onClick={() => setSelected(cell)}
                className={`flex h-10 flex-col items-center justify-center rounded-xl text-sm ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-muted font-medium"
                      : "hover:bg-muted/80"
                }`}
              >
                {Number(cell.slice(-2))}
                {hasEvent ? (
                  <span
                    className={`mt-0.5 size-1 rounded-full ${
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
                ) : (
                  <span className="mt-0.5 size-1" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-heading text-lg">
          {selected === today ? "Hoje" : formatDay(selected)}
        </h3>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada neste dia. Que tal marcar um date?
          </p>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <EventRow
                key={`${event.id}-${event.occurrence_on}`}
                event={event}
                userId={userId}
                occurrenceOn={event.occurrence_on}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function EventRow({
  event,
  userId,
  occurrenceOn,
}: {
  event: EventOccurrence | CoupleEvent
  userId: string
  occurrenceOn: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const kind = EVENT_KINDS.find((item) => item.value === event.kind)?.label
  const status = EVENT_STATUSES.find((item) => item.value === event.status)?.label
  const hidden =
    event.is_surprise && event.owner_id === userId && event.occurs_on > todayISO()

  async function remove() {
    const result = await deleteEvent(event.id)
    if (result.error) toast.error(result.error)
    else toast.success("Apagado do calendário")
  }

  async function done() {
    const result = await setEventStatus(event.id, "done")
    if (result.error) toast.error(result.error)
    else toast.success("Marcado como realizado")
  }

  return (
    <li className="rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {kind} · {reminderLabel(occurrenceOn)}
            {hidden ? " · surpresa escondida" : ""}
            {event.is_surprise && !hidden ? " · surpresa" : ""}
            {event.is_shared ? "" : " · só você"}
          </p>
          <p className="mt-1 font-medium">{event.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {status}
            {event.place ? ` · ${event.place}` : ""}
            {event.planned_amount > 0 ? ` · ${formatBRL(event.planned_amount)}` : ""}
          </p>
          {event.notes ? (
            <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {event.status !== "done" ? (
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              onClick={() => void done()}
            >
              Feito
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
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => void remove()}
          >
            Apagar
          </button>
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar</DialogTitle>
          </DialogHeader>
          <EventForm event={event} onSaved={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </li>
  )
}
