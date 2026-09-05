"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { UpcomingAgenda } from "@/components/finance/upcoming-agenda"
import { usePeriod } from "@/components/finance/use-period"
import { archiveAccount, deleteCategory } from "@/lib/finance/actions"
import { accountBalance } from "@/lib/finance/balances"
import { formatBRL } from "@/lib/finance/format"
import { ACCOUNT_TYPES, type Account, type Category, type FinanceBootstrap } from "@/lib/finance/types"
import { FINANCE_TABS, type FinanceTab } from "@/lib/finance/tabs"
import { pageShellClass } from "@/lib/ui"

export function FinanceWorkspace({
  data,
  defaultTab = "visao",
}: {
  data: FinanceBootstrap
  defaultTab?: FinanceTab
}) {
  const [tab, setTab] = useState<FinanceTab>(defaultTab)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [txOpen, setTxOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
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
    <div className={pageShellClass}>
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
        {FINANCE_TABS.map((item) => (
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

      {tab === "agenda" ? <UpcomingAgenda data={data} /> : null}

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
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg">Histórico do período</h3>
              <p className="text-sm text-muted-foreground">
                Toque no lápis para corrigir valor, data ou categoria.
              </p>
            </div>
            <Dialog open={txOpen} onOpenChange={setTxOpen}>
              <DialogTrigger render={<Button className="rounded-xl" />}>
                <Plus className="size-4" />
                Novo
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo lançamento</DialogTitle>
                </DialogHeader>
                <TransactionForm
                  accounts={data.accounts}
                  categories={data.categories}
                  onSaved={() => setTxOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <TransactionsList
            transactions={periodTransactions}
            profiles={data.profiles}
            accounts={data.accounts}
            categories={data.categories}
          />
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova conta</DialogTitle>
                </DialogHeader>
                <AccountForm onSaved={() => setAccountOpen(false)} />
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
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingAccount(account)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        const result = await archiveAccount(account.id)
                        if (result.error) toast.error(result.error)
                        else toast.success("Conta arquivada")
                      }}
                    >
                      Arquivar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Dialog
            open={Boolean(editingAccount)}
            onOpenChange={(open) => !open && setEditingAccount(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar conta</DialogTitle>
              </DialogHeader>
              {editingAccount ? (
                <AccountForm
                  key={editingAccount.id}
                  account={editingAccount}
                  onSaved={() => setEditingAccount(null)}
                />
              ) : null}
            </DialogContent>
          </Dialog>
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova categoria</DialogTitle>
                </DialogHeader>
                <CategoryForm onSaved={() => setCategoryOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card/90 px-4 py-3 ring-1 ring-foreground/8"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: category.color }}
                  />
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {category.kind === "income" ? "receita" : "despesa"}
                  </span>
                </span>
                <span className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingCategory(category)}
                  >
                    Editar
                  </button>
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
                </span>
              </li>
            ))}
          </ul>
          <Dialog
            open={Boolean(editingCategory)}
            onOpenChange={(open) => !open && setEditingCategory(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar categoria</DialogTitle>
              </DialogHeader>
              {editingCategory ? (
                <CategoryForm
                  key={editingCategory.id}
                  category={editingCategory}
                  onSaved={() => setEditingCategory(null)}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </div>
  )
}
