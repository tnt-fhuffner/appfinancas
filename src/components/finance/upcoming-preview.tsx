import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatBRL, formatDay } from "@/lib/finance/format"
import {
  BUCKET_LABELS,
  buildUpcomingItems,
  upcomingTotals,
} from "@/lib/finance/upcoming"
import type { Bill, Transaction } from "@/lib/finance/types"

export function UpcomingPreview({
  transactions,
  bills,
}: {
  transactions: Transaction[]
  bills: Bill[]
}) {
  const items = buildUpcomingItems(transactions, bills).slice(0, 4)
  if (items.length === 0) return null
  const totals = upcomingTotals(buildUpcomingItems(transactions, bills))

  return (
    <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>O que vem por aí</CardTitle>
        <CardDescription>
          {totals.out > 0 ? `Ainda vai sair ${formatBRL(totals.out)}` : "Agenda em dia"}
          {" · "}
          <Link href="/financas?tab=agenda" className="hover:text-foreground">
            Ver agenda
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.source}-${item.id}`}
            className="flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.bucket === "today" || item.bucket === "overdue"
                  ? BUCKET_LABELS[item.bucket]
                  : formatDay(item.date)}
                {item.recurrenceLabel ? ` · ${item.recurrenceLabel}` : ""}
              </p>
            </div>
            <p
              className={`shrink-0 text-sm font-medium ${
                item.direction === "in"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-primary"
              }`}
            >
              {item.direction === "in" ? "+" : item.direction === "out" ? "−" : ""}
              {formatBRL(item.amount)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
