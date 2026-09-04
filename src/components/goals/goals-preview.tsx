import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatBRL } from "@/lib/finance/format"
import type { GoalProgress } from "@/lib/goals/types"

export function GoalsPreview({ items }: { items: GoalProgress[] }) {
  if (items.length === 0) return null

  return (
    <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>Sonhos em andamento</CardTitle>
        <CardDescription>
          <Link href="/metas" className="hover:text-foreground">
            Ver todos
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.goal.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="font-medium">{item.goal.name}</p>
              <p className="text-muted-foreground">{Math.round(item.percent)}%</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, item.percent)}%`,
                  background: item.goal.color,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatBRL(item.saved)} de {formatBRL(item.goal.target_amount)}
              {item.monthlyNeeded != null
                ? ` · ${formatBRL(item.monthlyNeeded)}/mês`
                : ""}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
