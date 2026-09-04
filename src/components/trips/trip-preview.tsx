import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateRange } from "@/lib/finance/format"
import { countdownLabel } from "@/lib/trips/countdown"
import type { Trip } from "@/lib/trips/types"

export function TripPreview({ trip }: { trip: Trip | null }) {
  if (!trip) return null

  return (
    <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>Próxima viagem</CardTitle>
        <CardDescription>
          <Link href={`/viagens/${trip.id}`} className="hover:text-foreground">
            Abrir planejamento
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl tracking-tight">{trip.destination}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateRange(trip.start_on, trip.end_on)}
        </p>
        <p className="mt-3 text-sm font-medium text-primary">{countdownLabel(trip)}</p>
      </CardContent>
    </Card>
  )
}
