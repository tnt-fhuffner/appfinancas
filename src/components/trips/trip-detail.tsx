"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { checkboxClass, fieldClass } from "@/components/finance/fields"
import { TripForm } from "@/components/trips/trip-form"
import {
  formatBRL,
  formatDateRange,
  formatDay,
  parseMoneyInput,
  todayISO,
} from "@/lib/finance/format"
import type { Account } from "@/lib/finance/types"
import {
  addChecklistItem,
  addItineraryItem,
  addTripExpense,
  deleteChecklistItem,
  deleteItineraryItem,
  deleteTrip,
  saveTripBudget,
  toggleChecklistItem,
} from "@/lib/trips/actions"
import { countdownLabel, tripSpent } from "@/lib/trips/countdown"
import {
  TRIP_BUDGET_KINDS,
  TRIP_STATUSES,
  type TripDetail,
} from "@/lib/trips/types"

const TABS = [
  { id: "visao", label: "Visão" },
  { id: "orcamento", label: "Orçamento" },
  { id: "checklist", label: "Checklist" },
  { id: "roteiro", label: "Roteiro" },
] as const

export function TripDetailView({
  detail,
  accounts,
}: {
  detail: TripDetail
  accounts: Account[]
}) {
  const trip = detail.trip
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("visao")
  const [editOpen, setEditOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  const kindOrder = useMemo(
    () =>
      Object.fromEntries(TRIP_BUDGET_KINDS.map((kind, index) => [kind.value, index])),
    []
  )
  const budgetItems = useMemo(
    () =>
      [...detail.budgetItems].sort(
        (a, b) => (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9)
      ),
    [detail.budgetItems, kindOrder]
  )
  const spent = tripSpent(budgetItems, detail.expenses)

  if (!trip) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-muted-foreground">Viagem não encontrada.</p>
        <Link href="/viagens" className="mt-3 inline-block text-sm text-primary">
          Voltar
        </Link>
      </div>
    )
  }

  const status = TRIP_STATUSES.find((item) => item.value === trip.status)
  const percent =
    trip.planned_amount > 0
      ? Math.min(100, (spent.total / trip.planned_amount) * 100)
      : spent.total > 0
        ? 100
        : 0
  const tripId = trip.id

  async function remove() {
    const result = await deleteTrip(tripId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Viagem apagada")
    router.push("/viagens")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/viagens"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Viagens
          </Link>
          <h2 className="font-heading text-3xl tracking-tight">{trip.destination}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateRange(trip.start_on, trip.end_on)} · {status?.label}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">{countdownLabel(trip)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setEditOpen(true)}
          >
            Editar
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => void remove()}
          >
            Apagar
          </button>
        </div>
      </div>

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
        <div className="space-y-4">
          <div className="rounded-3xl bg-card/90 p-4 ring-1 ring-foreground/8">
            <p className="text-xs text-muted-foreground">Orçado vs gasto</p>
            <p className="mt-1 font-heading text-2xl">
              {formatBRL(spent.total)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                de {formatBRL(trip.planned_amount)}
              </span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  spent.total > trip.planned_amount && trip.planned_amount > 0
                    ? "bg-red-500"
                    : "bg-primary"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          {trip.notes ? (
            <p className="text-sm text-muted-foreground">{trip.notes}</p>
          ) : null}
          <div>
            <h3 className="mb-2 font-heading text-lg">Últimos gastos</h3>
            {detail.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum gasto vinculado ainda. Lance na aba Orçamento.
              </p>
            ) : (
              <ul className="space-y-2">
                {detail.expenses.slice(0, 8).map((expense) => (
                  <li
                    key={expense.id}
                    className="flex justify-between rounded-2xl bg-card/90 px-4 py-3 text-sm ring-1 ring-foreground/8"
                  >
                    <span>
                      {formatDay(expense.occurred_on)}
                      {expense.notes ? ` · ${expense.notes}` : ""}
                    </span>
                    <span className="font-medium">{formatBRL(expense.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {tab === "orcamento" ? (
        <BudgetTab
          key={budgetItems
            .map((item) => `${item.id}:${item.planned_amount}`)
            .join("|")}
          tripId={trip.id}
          rows={spent.rows}
          accounts={accounts}
          expenseOpen={expenseOpen}
          setExpenseOpen={setExpenseOpen}
        />
      ) : null}

      {tab === "checklist" ? (
        <ChecklistTab tripId={trip.id} items={detail.checklist} />
      ) : null}

      {tab === "roteiro" ? (
        <ItineraryTab
          tripId={trip.id}
          startOn={trip.start_on}
          items={detail.itinerary}
        />
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar viagem</DialogTitle>
          </DialogHeader>
          <TripForm trip={trip} onSaved={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BudgetTab({
  tripId,
  rows,
  accounts,
  expenseOpen,
  setExpenseOpen,
}: {
  tripId: string
  rows: ReturnType<typeof tripSpent>["rows"]
  accounts: Account[]
  expenseOpen: boolean
  setExpenseOpen: (open: boolean) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.item.id,
        row.item.planned_amount
          ? String(row.item.planned_amount).replace(".", ",")
          : "",
      ])
    )
  )
  const [pending, setPending] = useState(false)

  async function save() {
    setPending(true)
    const result = await saveTripBudget(
      tripId,
      rows.map((row) => {
        const parsed = parseMoneyInput(values[row.item.id] ?? "")
        return {
          id: row.item.id,
          planned_amount: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
        }
      })
    )
    setPending(false)
    if (result.error) toast.error(result.error)
    else toast.success("Orçamento da viagem salvo")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg">Por categoria</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            disabled={pending}
            onClick={() => void save()}
          >
            Salvar previsto
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl"
            onClick={() => setExpenseOpen(true)}
          >
            <Plus className="size-4" />
            Gasto
          </Button>
        </div>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => {
          const label =
            TRIP_BUDGET_KINDS.find((kind) => kind.value === row.item.kind)?.label ??
            row.item.kind
          const over = row.item.planned_amount > 0 && row.spent > row.item.planned_amount
          const bar =
            row.item.planned_amount > 0
              ? Math.min(100, (row.spent / row.item.planned_amount) * 100)
              : row.spent > 0
                ? 100
                : 0
          return (
            <li
              key={row.item.id}
              className="rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBRL(row.spent)} de {formatBRL(row.item.planned_amount)}
                  </p>
                </div>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-label={`Previsto para ${label}`}
                  className={`${fieldClass} h-10 w-28 text-right`}
                  value={values[row.item.id] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [row.item.id]: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${over ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${bar}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gasto da viagem</DialogTitle>
          </DialogHeader>
          <TripExpenseForm
            tripId={tripId}
            items={rows.map((row) => row.item)}
            accounts={accounts}
            onSaved={() => setExpenseOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TripExpenseForm({
  tripId,
  items,
  accounts,
  onSaved,
}: {
  tripId: string
  items: { id: string; kind: string }[]
  accounts: Account[]
  onSaved?: () => void
}) {
  const [pending, setPending] = useState(false)

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie uma conta em Finanças antes de lançar um gasto da viagem.
      </p>
    )
  }

  async function onSubmit(formData: FormData) {
    const amount = parseMoneyInput(String(formData.get("amount") ?? ""))
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido.")
      return
    }
    setPending(true)
    const result = await addTripExpense({
      trip_id: tripId,
      trip_budget_item_id: String(formData.get("trip_budget_item_id") ?? ""),
      account_id: String(formData.get("account_id") ?? ""),
      amount,
      occurred_on: String(formData.get("occurred_on") ?? todayISO()),
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Gasto lançado em Finanças")
    onSaved?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="trip-exp-kind">Categoria da viagem</Label>
        <select id="trip-exp-kind" name="trip_budget_item_id" className={fieldClass}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {TRIP_BUDGET_KINDS.find((kind) => kind.value === item.kind)?.label ??
                item.kind}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trip-exp-amount">Valor</Label>
        <input
          id="trip-exp-amount"
          name="amount"
          required
          inputMode="decimal"
          placeholder="0,00"
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trip-exp-account">Conta</Label>
        <select id="trip-exp-account" name="account_id" required className={fieldClass}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trip-exp-date">Data</Label>
        <input
          id="trip-exp-date"
          name="occurred_on"
          type="date"
          defaultValue={todayISO()}
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trip-exp-notes">Notas</Label>
        <input id="trip-exp-notes" name="notes" className={fieldClass} placeholder="Opcional" />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : "Lançar gasto"}
      </Button>
    </form>
  )
}

function ChecklistTab({
  tripId,
  items,
}: {
  tripId: string
  items: TripDetail["checklist"]
}) {
  const [pending, setPending] = useState(false)

  async function add(formData: FormData) {
    setPending(true)
    const result = await addChecklistItem(tripId, String(formData.get("title") ?? ""))
    setPending(false)
    if (result.error) toast.error(result.error)
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl bg-card/90 px-4 py-3 ring-1 ring-foreground/8"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={item.done}
                onChange={() => void toggleChecklistItem(item.id, tripId, !item.done)}
              />
              <span className={item.done ? "text-muted-foreground line-through" : ""}>
                {item.title}
              </span>
            </label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={() => void deleteChecklistItem(item.id, tripId)}
            >
              Apagar
            </button>
          </li>
        ))}
      </ul>
      <form action={add} className="flex gap-2">
        <input
          name="title"
          required
          placeholder="Nova tarefa"
          className={fieldClass}
        />
        <Button type="submit" className="h-11 rounded-xl" disabled={pending}>
          {pending ? "..." : "Adicionar"}
        </Button>
      </form>
    </div>
  )
}

function ItineraryTab({
  tripId,
  startOn,
  items,
}: {
  tripId: string
  startOn: string
  items: TripDetail["itinerary"]
}) {
  const [pending, setPending] = useState(false)

  async function add(formData: FormData) {
    setPending(true)
    const result = await addItineraryItem({
      trip_id: tripId,
      occurs_on: String(formData.get("occurs_on") ?? startOn),
      title: String(formData.get("title") ?? ""),
      place: String(formData.get("place") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    setPending(false)
    if (result.error) toast.error(result.error)
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
      <form action={add} className="space-y-3 rounded-3xl bg-card/90 p-4 ring-1 ring-foreground/8">
        <h3 className="font-heading text-lg">Novo passeio</h3>
        <div className="space-y-2">
          <Label htmlFor="itin-title">O quê</Label>
          <input id="itin-title" name="title" required className={fieldClass} placeholder="Museu" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="itin-date">Dia</Label>
          <input
            id="itin-date"
            name="occurs_on"
            type="date"
            defaultValue={startOn}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="itin-place">Onde</Label>
          <input id="itin-place" name="place" className={fieldClass} placeholder="Opcional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="itin-notes">Notas</Label>
          <input id="itin-notes" name="notes" className={fieldClass} placeholder="Opcional" />
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar ao roteiro"}
        </Button>
      </form>
      <div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            O roteiro ainda está em branco. Um dia de cada vez.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{formatDay(item.occurs_on)}</p>
                  <p className="mt-1 text-sm font-medium">{item.title}</p>
                  {item.place ? (
                    <p className="text-xs text-muted-foreground">{item.place}</p>
                  ) : null}
                  {item.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => void deleteItineraryItem(item.id, tripId)}
                >
                  Apagar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
