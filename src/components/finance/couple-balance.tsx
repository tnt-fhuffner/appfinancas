import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatBRL } from "@/lib/finance/format"

export function CoupleBalanceCard({ coupleTotal }: { coupleTotal: number }) {
  return (
    <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>Saldo conjunto</CardTitle>
        <CardDescription>O que já aconteceu — sem o que ainda vai vencer</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl">{formatBRL(coupleTotal)}</p>
      </CardContent>
    </Card>
  )
}

export function MonthMetrics({
  income,
  expense,
  net,
  netLabel = "Saldo do mês",
  plannedHint,
}: {
  income: number
  expense: number
  net: number
  netLabel?: string
  plannedHint?: string
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Receitas" value={formatBRL(income)} />
        <Metric label="Despesas" value={formatBRL(expense)} />
        <Metric label={netLabel} value={formatBRL(net)} />
      </div>
      {plannedHint ? (
        <p className="text-sm text-muted-foreground">{plannedHint}</p>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/70 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-medium">{value}</p>
    </div>
  )
}
