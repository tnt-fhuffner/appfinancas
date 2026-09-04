import { Heart } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertsList } from "@/components/finance/alerts-list"
import { CoupleBalanceCard } from "@/components/finance/couple-balance"
import { BalanceLine, CategoryPie } from "@/components/finance/lazy-charts"
import { SetupBanner } from "@/components/finance/setup-banner"
import { TransactionsList } from "@/components/finance/transactions-list"
import { EventPreview } from "@/components/events/event-preview"
import { GoalsPreview } from "@/components/goals/goals-preview"
import { TripPreview } from "@/components/trips/trip-preview"
import {
  budgetRows,
  buildAlerts,
  healthFromAlerts,
  projectedMonthEndBalance,
} from "@/lib/finance/alerts"
import { greetingForNow, toAppUser } from "@/lib/auth/user"
import {
  addMonthsISO,
  formatBRL,
  formatMonthLabel,
  monthBounds,
} from "@/lib/finance/format"
import {
  balanceByOwner,
  monthExpensesByCategory,
  monthTotals,
  monthlyBalanceSeries,
  sharedBalance,
  totalBalance,
} from "@/lib/finance/balances"
import { getFinanceBootstrap } from "@/lib/finance/queries"
import { progressForGoals } from "@/lib/goals/progress"
import { getGoalsBootstrap } from "@/lib/goals/queries"
import { nextEvent } from "@/lib/events/calendar"
import { getEventsBootstrap } from "@/lib/events/queries"
import { nextTrip } from "@/lib/trips/countdown"
import { getTripsBootstrap } from "@/lib/trips/queries"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const [{ data: { user } }, finance, goals, trips, events] = await Promise.all([
    supabase.auth.getUser(),
    getFinanceBootstrap(),
    getGoalsBootstrap(),
    getTripsBootstrap(),
    getEventsBootstrap(),
  ])
  const name = user ? toAppUser(user).name.split(" ")[0] : "vocês"
  const greeting = greetingForNow()

  if (!finance.ready) {
    return <SetupBanner sql={finance.schemaSql} />
  }

  const { start, end } = monthBounds()
  const pie = monthExpensesByCategory(finance.transactions, start, end)
  const totals = monthTotals(finance.transactions, start, end)
  const coupleTotal = totalBalance(finance.accounts, finance.transactions)
  const joint = sharedBalance(finance.accounts, finance.transactions)
  const personal = user
    ? balanceByOwner(finance.accounts, finance.transactions, user.id)
    : 0
  const months = Array.from({ length: 12 }, (_, index) => {
    const iso = addMonthsISO(start, index - 11)
    const bounds = monthBounds(iso)
    return {
      start: bounds.start,
      end: bounds.end,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
        new Date(bounds.year, bounds.month - 1, 1)
      ),
    }
  })
  const series = monthlyBalanceSeries(finance.accounts, finance.transactions, months)
  const rows = budgetRows(
    finance.categories,
    finance.budgets,
    finance.transactions,
    start,
    end
  )
  const projected = projectedMonthEndBalance(
    finance.accounts,
    finance.transactions,
    finance.bills,
    start,
    end
  )
  const alerts = finance.alertsReady
    ? buildAlerts(rows, finance.bills, projected)
    : []
  const health = finance.alertsReady
    ? healthFromAlerts(
        alerts,
        finance.budgets.some((budget) => budget.planned_amount > 0)
      )
    : {
        level: "yellow" as const,
        color: "bg-amber-400",
        label: "Rode o SQL de orçamento para o semáforo ficar preciso",
      }
  const goalItems = goals.ready
    ? progressForGoals(goals.goals, goals.contributions)
        .filter((item) => item.goal.status === "active")
        .slice(0, 3)
    : []
  const upcomingTrip = trips.ready ? nextTrip(trips.trips) : null
  const upcomingEvent = events.ready ? nextEvent(events.events) : null

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {!finance.alertsReady ? (
        <SetupBanner sql={finance.schemaSqlPhase3} compact />
      ) : null}
      {!finance.householdReady ? (
        <SetupBanner
          sql={finance.schemaSqlHousehold}
          compact
          title="Painéis ainda não estão conjuntos"
          description="Rode este SQL no Supabase para vocês dois verem as mesmas contas, gastos e o saldo conjunto. Depois recarregue."
        />
      ) : null}
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">{greeting}</p>
        <h2 className="font-heading text-3xl tracking-tight text-pretty md:text-4xl">
          Olá, {name}.
        </h2>
        <p className="text-sm text-muted-foreground capitalize">
          {formatMonthLabel(start)}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <CoupleBalanceCard
          coupleTotal={coupleTotal}
          joint={joint}
          personal={personal}
        />
        <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
          <CardHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Heart className="size-5" />
            </span>
            <CardTitle>Saúde do mês</CardTitle>
            <CardDescription>
              Receitas {formatBRL(totals.income)} · gastos {formatBRL(totals.expense)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`size-3 rounded-full ${health.color}`} />
              <p className="text-sm">{health.label}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Previsão no fim do mês: {formatBRL(projected)}
            </p>
          </CardContent>
        </Card>
      </section>

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

      <GoalsPreview items={goalItems} />
      {upcomingTrip || upcomingEvent ? (
        <section className="grid gap-4 md:grid-cols-2">
          <TripPreview trip={upcomingTrip} />
          <EventPreview event={upcomingEvent} />
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Gastos do mês</CardTitle>
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
        <h3 className="mb-3 font-heading text-lg">Últimos lançamentos</h3>
        <TransactionsList
          transactions={finance.transactions.slice(0, 8)}
          profiles={finance.profiles}
        />
      </section>
    </div>
  )
}
