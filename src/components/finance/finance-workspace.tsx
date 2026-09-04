"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AccountForm } from "@/components/finance/account-form"
import { AlertsList } from "@/components/finance/alerts-list"
import { BillsPanel } from "@/components/finance/bills-panel"
import { BudgetPanel } from "@/components/finance/budget-panel"
import { CategoryForm } from "@/components/finance/category-form"
import {
  CoupleBalanceCard,
  MonthMetrics,
} from "@/components/finance/couple-balance"
import { BalanceLine, CategoryPie } from "@/components/finance/lazy-charts"
import { SetupBanner } from "@/components/finance/setup-banner"
import { TransactionForm } from "@/components/finance/transaction-form"
import { TransactionsList } from "@/components/finance/transactions-list"
import { archiveAccount, deleteCategory } from "@/lib/finance/actions"
import {
  budgetRows,
  buildAlerts,
  healthFromAlerts,
  projectedMonthEndBalance,
} from "@/lib/finance/alerts"
import {
  accountBalance,
  balanceByOwner,
  monthExpensesByCategory,
  monthTotals,
  monthlyBalanceSeries,
  sharedBalance,
  totalBalance,
} from "@/lib/finance/balances"
import { ACCOUNT_TYPES } from "@/lib/finance/types"
import {
  addMonthsISO,
  formatBRL,
  formatMonthLabel,
  monthBounds,
} from "@/lib/finance/format"
import type { FinanceBootstrap } from "@/lib/finance/types"

const TABS = [
  { id: "visao", label: "Visão" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "orcamento", label: "Orçamento" },
  { id: "a-pagar", label: "A pagar" },
  { id: "contas", label: "Contas" },
  { id: "categorias", label: "Categorias" },
] as const

export function FinanceWorkspace({
  data,
  defaultTab = "visao",
}: {
  data: FinanceBootstrap
  defaultTab?: (typeof TABS)[number]["id"]
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(defaultTab)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const { start, end } = monthBounds()
  const monthLabel = formatMonthLabel(start)

  const monthTransactions = useMemo(
    () =>
      data.transactions.filter(
        (transaction) =>
          transaction.occurred_on >= start && transaction.occurred_on <= end
      ),
    [data.transactions, start, end]
  )

  const pie = monthExpensesByCategory(data.transactions, start, end)
  const totals = monthTotals(data.transactions, start, end)
  const coupleTotal = totalBalance(data.accounts, data.transactions)
  const joint = sharedBalance(data.accounts, data.transactions)
  const personal = balanceByOwner(
    data.accounts,
    data.transactions,
    data.userId
  )
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
  const series = monthlyBalanceSeries(data.accounts, data.transactions, months)
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
  const alerts = data.alertsReady ? buildAlerts(rows, data.bills, projected) : []
  const health = data.alertsReady
    ? healthFromAlerts(
        alerts,
        data.budgets.some((budget) => budget.planned_amount > 0)
      )
    : {
        level: "yellow" as const,
        color: "bg-amber-400",
        label: "Rode o SQL de orçamento para o semáforo ficar preciso",
      }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {!data.alertsReady ? <SetupBanner sql={data.schemaSqlPhase3} compact /> : null}
      {!data.householdReady ? (
        <SetupBanner
          sql={data.schemaSqlHousehold}
          compact
          title="Painéis ainda não estão conjuntos"
          description="Rode este SQL no Supabase para vocês dois verem as mesmas contas, gastos e o saldo conjunto. Depois recarregue."
        />
      ) : null}
      <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-2xl bg-muted p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap ${
              tab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "visao" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <CoupleBalanceCard
              coupleTotal={coupleTotal}
              joint={joint}
              personal={personal}
            />
          </div>
          <Card className="border-none bg-card/90 shadow-none ring-foreground/8 md:col-span-2">
            <CardHeader>
              <CardTitle>Este mês</CardTitle>
              <CardDescription className="capitalize">{monthLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthMetrics
                income={totals.income}
                expense={totals.expense}
                net={totals.net}
              />
            </CardContent>
          </Card>
          <Card className="border-none bg-card/90 shadow-none ring-foreground/8 md:col-span-2">
            <CardHeader>
              <CardTitle>Saúde e alertas</CardTitle>
              <CardDescription>Semáforo do mês e contas que vencem</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsList alerts={alerts} health={health} projected={projected} />
            </CardContent>
          </Card>
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
          <Card className="border-none bg-card/90 shadow-none ring-foreground/8 md:col-span-2">
            <CardHeader>
              <CardTitle>Últimos lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsList
                transactions={monthTransactions.slice(0, 6)}
                profiles={data.profiles}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "lancamentos" ? (
        <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
          <Card className="border-none bg-card/90 shadow-none ring-foreground/8">
            <CardHeader>
              <CardTitle>Novo lançamento</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm
                accounts={data.accounts}
                categories={data.categories}
              />
            </CardContent>
          </Card>
          <div>
            <h3 className="mb-3 font-heading text-lg">Histórico</h3>
            <TransactionsList
              transactions={data.transactions}
              profiles={data.profiles}
            />
          </div>
        </div>
      ) : null}

      {tab === "orcamento" ? (
        data.alertsReady ? (
          <BudgetPanel
            key={data.budgets
              .map((budget) => `${budget.category_id}:${budget.planned_amount}`)
              .join("|")}
            data={data}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Rode o SQL acima para começar o orçamento por categoria.
          </p>
        )
      ) : null}

      {tab === "a-pagar" ? (
        data.alertsReady ? (
          <BillsPanel data={data} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Rode o SQL acima para lançar contas a pagar e a receber.
          </p>
        )
      ) : null}

      {tab === "contas" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg">Contas</h3>
            <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
              <DialogTrigger render={<Button className="rounded-xl" />}>
                <Plus className="size-4" />
                Nova conta
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova conta</DialogTitle>
                </DialogHeader>
                <AccountForm onCreated={() => setAccountOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          {data.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conta ainda. Crie a corrente conjunta para começar.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.accounts.map((account) => (
                <li
                  key={account.id}
                  className="rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8"
                >
                  <p className="text-sm text-muted-foreground">
                    {ACCOUNT_TYPES.find((item) => item.value === account.type)?.label}
                    {account.is_shared ? " · conjunta" : " · pessoal"}
                  </p>
                  <p className="mt-1 font-heading text-xl">{account.name}</p>
                  <p className="mt-2 text-lg font-medium">
                    {formatBRL(accountBalance(account, data.transactions))}
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-xs text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      const result = await archiveAccount(account.id)
                      if (result.error) toast.error(result.error)
                      else toast.success("Conta arquivada")
                    }}
                  >
                    Arquivar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "categorias" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg">Categorias</h3>
            <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
              <DialogTrigger render={<Button className="rounded-xl" />}>
                <Plus className="size-4" />
                Nova
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova categoria</DialogTitle>
                </DialogHeader>
                <CategoryForm onCreated={() => setCategoryOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between rounded-2xl bg-card/90 px-4 py-3 ring-1 ring-foreground/8"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className="size-3 rounded-full"
                    style={{ background: category.color }}
                  />
                  {category.name}
                  <span className="text-xs text-muted-foreground">
                    {category.kind === "income" ? "receita" : "despesa"}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    const result = await deleteCategory(category.id)
                    if (result.error) toast.error(result.error)
                    else toast.success("Categoria apagada")
                  }}
                >
                  Apagar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
