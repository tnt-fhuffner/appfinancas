"use client"

import type { ReactNode } from "react"
import { Heart } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertsList } from "@/components/finance/alerts-list"
import {
  CoupleBalanceCard,
  MonthMetrics,
} from "@/components/finance/couple-balance"
import { BalanceLine, CategoryPie } from "@/components/finance/lazy-charts"
import { PeriodFilter } from "@/components/finance/period-filter"
import { TransactionsList } from "@/components/finance/transactions-list"
import { periodLabel, usePeriod } from "@/components/finance/use-period"
import {
  budgetRows,
  buildAlerts,
  healthFromAlerts,
  projectedMonthEndBalance,
} from "@/lib/finance/alerts"
import {
  monthExpensesByCategory,
  monthTotals,
  monthlyBalanceSeries,
  periodMovement,
  totalBalance,
} from "@/lib/finance/balances"
import { formatBRL, todayISO } from "@/lib/finance/format"
import {
  isCurrentMonth,
  isSingleMonth,
  seriesMonths,
  type PeriodRange,
} from "@/lib/finance/period"
import type { FinanceBootstrap } from "@/lib/finance/types"

export function HouseholdDashboard({
  data,
  range,
  preset,
  customStart,
  customEnd,
  onPreset,
  onCustomStart,
  onCustomEnd,
  children,
  showFilter = true,
}: {
  data: FinanceBootstrap
  range: PeriodRange
  preset: PeriodRange["preset"]
  customStart: string
  customEnd: string
  onPreset: (preset: PeriodRange["preset"]) => void
  onCustomStart: (value: string) => void
  onCustomEnd: (value: string) => void
  children?: ReactNode
  showFilter?: boolean
}) {
  const { start, end } = range
  const label = periodLabel(range)
  const currentMonth = isCurrentMonth(range)
  const singleMonth = isSingleMonth(range)
  const asOf = todayISO()
  const settledTransactions = data.transactions.filter(
    (transaction) => transaction.occurred_on <= asOf
  )
  const pie = monthExpensesByCategory(settledTransactions, start, end)
  const totals = monthTotals(settledTransactions, start, end)
  const movement = periodMovement(data.transactions, start, end, asOf)
  const coupleTotal = totalBalance(data.accounts, data.transactions)
  const plannedHint =
    movement.planned.expense > 0 || movement.planned.income > 0
      ? `Ainda vem neste período: gastos ${formatBRL(movement.planned.expense)}${
          movement.planned.income > 0
            ? ` · receitas ${formatBRL(movement.planned.income)}`
            : ""
        }. O saldo de hoje ainda não inclui isso.`
      : undefined
  const series = monthlyBalanceSeries(
    data.accounts,
    data.transactions,
    seriesMonths(range)
  )
  const periodTransactions = data.transactions.filter(
    (transaction) =>
      transaction.occurred_on >= start && transaction.occurred_on <= end
  )
  const rows = budgetRows(
    data.categories,
    data.budgets,
    data.transactions,
    start,
    end
  )
  const projected = projectedMonthEndBalance(
    data.accounts,
    data.transactions,
    data.bills,
    start,
    end
  )
  const alerts =
    data.alertsReady && currentMonth ? buildAlerts(rows, data.bills, projected) : []
  const health =
    data.alertsReady && currentMonth
      ? healthFromAlerts(
          alerts,
          data.budgets.some((budget) => budget.planned_amount > 0)
        )
      : null

  return (
    <div className="flex flex-col gap-6">
      {showFilter ? (
        <PeriodFilter
          preset={preset}
          customStart={customStart}
          customEnd={customEnd}
          onPreset={onPreset}
          onCustomStart={onCustomStart}
          onCustomEnd={onCustomEnd}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <CoupleBalanceCard coupleTotal={coupleTotal} />
        <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
          <CardHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Heart className="size-5" />
            </span>
            <CardTitle>{currentMonth ? "Saúde do mês" : "Neste período"}</CardTitle>
            <CardDescription>
              Receitas {formatBRL(totals.income)} · gastos {formatBRL(totals.expense)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {health ? (
              <div className="flex items-center gap-3">
                <span className={`size-3 rounded-full ${health.color}`} />
                <p className="text-sm">{health.label}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{label}</p>
            )}
            {currentMonth ? (
              <p className="text-sm text-muted-foreground">
                Previsão no fim do mês: {formatBRL(projected)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Saldo do período: {formatBRL(totals.net)}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Movimento do período</CardTitle>
          <CardDescription className="capitalize">{label}</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthMetrics
            income={totals.income}
            expense={totals.expense}
            net={totals.net}
            netLabel={singleMonth ? "Saldo do mês" : "Saldo do período"}
            plannedHint={plannedHint}
          />
        </CardContent>
      </Card>

      {alerts.length > 0 ? (
        <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Orçamento, saldo projetado e vencimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertsList alerts={alerts} />
          </CardContent>
        </Card>
      ) : null}

      {children}

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPie data={pie} />
          </CardContent>
        </Card>
        <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Evolução do saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceLine data={series} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-lg">Lançamentos do período</h3>
        <TransactionsList
          transactions={periodTransactions.slice(0, 8)}
          profiles={data.profiles}
        />
      </section>
    </div>
  )
}

export function HouseholdDashboardWithPeriod({
  data,
  children,
}: {
  data: FinanceBootstrap
  children?: ReactNode
}) {
  const period = usePeriod()

  return (
    <HouseholdDashboard
      data={data}
      range={period.range}
      preset={period.preset}
      customStart={period.customStart}
      customEnd={period.customEnd}
      onPreset={period.setPreset}
      onCustomStart={period.setCustomStart}
      onCustomEnd={period.setCustomEnd}
    >
      {children}
    </HouseholdDashboard>
  )
}
