"use client"

import { useState } from "react"
import Link from "next/link"
import { Plane, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { TripForm } from "@/components/trips/trip-form"
import { formatDateRange } from "@/lib/finance/format"
import { countdownLabel, sortTrips, tripPhase } from "@/lib/trips/countdown"
import { TRIP_STATUSES, type Trip } from "@/lib/trips/types"
import { pageShellClass } from "@/lib/ui"

export function TripsWorkspace({ trips }: { trips: Trip[] }) {
  const [open, setOpen] = useState(false)
  const sorted = sortTrips(trips)

  return (
    <div className={pageShellClass}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">Viagens</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Destino, orçamento, checklist e a contagem regressiva.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="rounded-xl" />}>
            <Plus className="size-4" />
            Nova viagem
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova viagem</DialogTitle>
            </DialogHeader>
            <TripForm onSaved={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="Para onde vocês vão?"
          description="Crie a próxima viagem: destino, datas, orçamento e a contagem regressiva aparece no início."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {sorted.map((trip) => {
            const phase = tripPhase(trip)
            const status = TRIP_STATUSES.find((item) => item.value === trip.status)
            return (
              <li key={trip.id}>
                <Link
                  href={`/viagens/${trip.id}`}
                  className="block rounded-3xl bg-card/90 p-4 ring-1 ring-foreground/8 transition-colors hover:bg-muted/40"
                >
                  <p className="text-xs text-muted-foreground">
                    {status?.label}
                    {phase === "now" ? " · agora" : ""}
                  </p>
                  <h3 className="mt-1 font-heading text-xl tracking-tight">
                    {trip.destination}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateRange(trip.start_on, trip.end_on)}
                  </p>
                  <p className="mt-3 text-sm font-medium text-primary">
                    {countdownLabel(trip)}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
