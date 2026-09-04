import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDay } from "@/lib/finance/format"
import { reminderLabel } from "@/lib/events/calendar"
import { EVENT_KINDS, type EventOccurrence } from "@/lib/events/types"

export function EventPreview({ event }: { event: EventOccurrence | null }) {
  if (!event) return null
  const kind = EVENT_KINDS.find((item) => item.value === event.kind)?.label

  return (
    <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>Próximo encontro</CardTitle>
        <CardDescription>
          <Link href="/eventos" className="hover:text-foreground">
            Ver calendário
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl tracking-tight">{event.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {kind} · {formatDay(event.occurrence_on)}
          {event.place ? ` · ${event.place}` : ""}
        </p>
        <p className="mt-3 text-sm font-medium text-primary">
          {reminderLabel(event.occurrence_on)}
        </p>
      </CardContent>
    </Card>
  )
}
