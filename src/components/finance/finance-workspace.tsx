"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { BillsPanel } from "@/components/finance/bills-panel"
import { BudgetPanel } from "@/components/finance/budget-panel"
import { CategoryForm } from "@/components/finance/category-form"
import { HouseholdDashboard } from "@/components/finance/household-dashboard"
import { PeriodFilter } from "@/components/finance/period-filter"
import { SetupBanner } from "@/components/finance/setup-banner"
import { TransactionForm } from "@/components/finance/transaction-form"
import { TransactionsList } from "@/components/finance/transactions-list"
import { usePeriod } from "@/components/finance/use-period"
import { archiveAccount, deleteCategory } from "@/lib/finance/actions"
import { accountBalance } from "@/lib/finance/balances"
import { formatBRL } from "@/lib/finance/format"
import { ACCOUNT_TYPES, type FinanceBootstrap } from "@/lib/finance/types"

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
  const period = usePeriod()
  const periodTransactions = useMemo(
    () =>
      data.transactions.filter(
        (transaction) =>
          transaction.occurred_on >= period.range.start &&
          transaction.occurred_on <= period.range.end
      ),
    [data.transactions, period.range.start, period.range.end]
  )

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

      {tab === "visao" || tab === "lancamentos" ? (
        <PeriodFilter
          preset={period.preset}
          customStart={period.customStart}
          customEnd={period.customEnd}
          onPreset={period.setPreset}
          onCustomStart={period.setCustomStart}
          onCustomEnd={period.setCustomEnd}
        />
      ) : null}

      {tab === "visao" ? (
        <HouseholdDashboard
          data={data}
          range={period.range}
          preset={period.preset}
          customStart={period.customStart}
          customEnd={period.customEnd}
          onPreset={period.setPreset}
          onCustomStart={period.setCustomStart}
          onCustomEnd={period.setCustomEnd}
          showFilter={false}
        />
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
            <h3 className="mb-3 font-heading text-lg">Histórico do período</h3>
            <TransactionsList
              transactions={periodTransactions}
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
                    {(() => {
                      const owner = data.profiles.find((profile) => profile.id === account.owner_id)
                      const firstName = owner?.full_name?.trim().split(/\s+/)[0]
                      return firstName ? ` · ${firstName}` : ""
                    })()}
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
