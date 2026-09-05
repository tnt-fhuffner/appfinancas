"use client"

import { useMemo, useState } from "react"
import { CalendarClock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import {
  cancelRemainingInSeries,
  deleteBill,
  deleteTransaction,
  payBill,
} from "@/lib/finance/actions"
import { formatBRL, formatDay } from "@/lib/finance/format"
import {
  BUCKET_LABELS,
  buildUpcomingItems,
  groupUpcoming,
  upcomingTotals,
  type UpcomingBucket,
  type UpcomingItem,
} from "@/lib/finance/upcoming"
import type { FinanceBootstrap } from "@/lib/finance/types"

const FILTERS = [
  { id: "all", label: "Tudo" },
  { id: "overdue", label: "Atrasado" },
  { id: "week", label: "Semana" },
  { id: "installments", label: "Parcelas" },
  { id: "bills", label: "Contas" },
] as const

type FilterId = (typeof FILTERS)[number]["id"]

export function UpcomingAgenda({ data }: { data: FinanceBootstrap }) {
  const [filter, setFilter] = useState<FilterId>("all")
  const items = useMemo(
    () => buildUpcomingItems(data.transactions, data.bills),
    [data.transactions, data.bills]
  )
  const visible = useMemo(() => filterItems(items, filter), [items, filter])
  const groups = groupUpcoming(visible)
  const totals = upcomingTotals(visible)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-lg">Agenda</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Parcelas, gastos marcados e contas que ainda vão vencer. O saldo de
          hoje só muda quando o dia chegar.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-2xl bg-muted p-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap ${
              filter === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryChip
            label="Ainda vai sair"
            value={formatBRL(totals.out)}
            tone="out"
          />
          <SummaryChip
            label="Ainda vai entrar"
            value={formatBRL(totals.in)}
            tone="in"
          />
        </div>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nada marcado à frente"
          description="Quando parcelar o celular, agendar o aluguel ou lançar um boleto, aparece aqui organizado por data."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.bucket}>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                {sectionTitle(group.bucket, group.items.length)}
              </h4>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <AgendaRow key={`${item.source}-${item.id}`} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function filterItems(items: UpcomingItem[], filter: FilterId) {
  if (filter === "all") return items
  if (filter === "overdue") return items.filter((item) => item.bucket === "overdue")
  if (filter === "week") {
    return items.filter(
      (item) =>
        item.bucket === "overdue" ||
        item.bucket === "today" ||
        item.bucket === "week"
    )
  }
  if (filter === "installments") {
    return items.filter(
      (item) => item.source === "transaction" && item.isSeries
    )
  }
  return items.filter((item) => item.source === "bill")
}

function sectionTitle(bucket: UpcomingBucket, count: number) {
  const noun = count === 1 ? "item" : "itens"
  return `${BUCKET_LABELS[bucket]} · ${count} ${noun}`
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "in" | "out"
}) {
  return (
    <div className="rounded-2xl bg-card/90 px-4 py-3 ring-1 ring-foreground/8">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-medium ${
          tone === "in"
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function AgendaRow({ item }: { item: UpcomingItem }) {
  const [pending, setPending] = useState(false)

  async function settle() {
    setPending(true)
    const result = await payBill(item.id)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(item.billKind === "receivable" ? "Recebimento lançado" : "Conta paga")
  }

  async function remove() {
    setPending(true)
    const result =
      item.source === "bill"
        ? await deleteBill(item.id)
        : await deleteTransaction(item.id)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(item.source === "bill" ? "Conta apagada" : "Lançamento apagado")
  }

  async function cancelRest() {
    setPending(true)
    const result = await cancelRemainingInSeries(item.id)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    const cancelled = "count" in result ? result.count : 1
    toast.success(
      cancelled && cancelled > 1
        ? `${cancelled} parcelas canceladas`
        : "Série cancelada"
    )
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">{item.title}</p>
          {item.recurrenceLabel ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {item.recurrenceLabel}
            </span>
          ) : null}
          {item.bucket === "overdue" ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
              Atrasado
            </span>
          ) : item.source === "transaction" ? (
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
              Agendado
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.bucket === "today" ? "Hoje" : formatDay(item.date)}
          {item.detail ? ` · ${item.detail}` : ""}
        </p>
        <p
          className={`mt-2 text-sm font-medium ${
            item.direction === "in"
              ? "text-emerald-700 dark:text-emerald-400"
              : item.direction === "transfer"
                ? "text-sky-700 dark:text-sky-400"
                : "text-primary"
          }`}
        >
          {item.direction === "in" ? "+" : item.direction === "out" ? "−" : ""}
          {formatBRL(item.amount)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {item.canPay ? (
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={() => void settle()}
          >
            {item.billKind === "receivable" ? "Receber" : "Pagar"}
          </Button>
        ) : null}
        {item.source === "transaction" && item.isSeries ? (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={pending}
            onClick={() => void cancelRest()}
          >
            Cancelar as que faltam
          </button>
        ) : null}
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive"
          disabled={pending}
          onClick={() => void remove()}
        >
          {item.source === "transaction" && item.isSeries
            ? "Apagar só esta"
            : "Apagar"}
        </button>
      </div>
    </li>
  )
}
