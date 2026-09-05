"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { createTransaction, updateTransaction } from "@/lib/finance/actions"
import {
  addMonthsClamped,
  formatDay,
  formatBRL,
  moneyToInput,
  parseMoneyInput,
  todayISO,
} from "@/lib/finance/format"
import { seriesBaseNotes } from "@/lib/finance/upcoming"
import type {
  Account,
  Category,
  Recurrence,
  Transaction,
  TransactionType,
} from "@/lib/finance/types"
import { PAYMENT_METHODS, TRANSACTION_TYPES } from "@/lib/finance/types"

const RECURRENCE_OPTIONS: {
  value: Recurrence
  label: string
  hint: string
}[] = [
  {
    value: "once",
    label: "Uma vez",
    hint: "Hoje ou uma data futura. O saldo só muda quando o dia chegar.",
  },
  {
    value: "installment",
    label: "Parcelado",
    hint: "O valor é de cada parcela. Criamos todas as datas pra acompanhar.",
  },
  {
    value: "monthly",
    label: "Todo mês",
    hint: "Mesmo valor, todo mês — aluguel, academia, streaming.",
  },
]

export function TransactionForm({
  accounts,
  categories,
  transaction,
  defaultType = "expense",
  compact = false,
  onSaved,
}: {
  accounts: Account[]
  categories: Category[]
  transaction?: Transaction
  defaultType?: TransactionType
  compact?: boolean
  onSaved?: () => void
}) {
  const editing = Boolean(transaction)
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? defaultType
  )
  const [recurrence, setRecurrence] = useState<Recurrence>(
    transaction?.recurrence ?? "once"
  )
  const [count, setCount] = useState(transaction?.installment_count ?? 12)
  const [amountText, setAmountText] = useState(
    transaction ? moneyToInput(transaction.amount) : ""
  )
  const [startDate, setStartDate] = useState(
    transaction?.occurred_on ?? todayISO()
  )
  const [pending, setPending] = useState(false)
  const prefix = transaction?.id ?? "new"

  const visibleCategories = useMemo(
    () =>
      categories.filter((category) =>
        type === "income" ? category.kind === "income" : category.kind === "expense"
      ),
    [categories, type]
  )

  const seriesCount =
    editing || type === "transfer" || recurrence === "once" ? 1 : count
  const amount = parseMoneyInput(amountText)
  const lastDate =
    seriesCount > 1 ? addMonthsClamped(startDate, seriesCount - 1) : startDate
  const preview = editing
    ? null
    : seriesCount > 1 && Number.isFinite(amount) && amount > 0
      ? recurrence === "installment"
        ? `${seriesCount} parcelas de ${formatBRL(amount)} · última em ${formatDay(lastDate)}`
        : `${formatBRL(amount)} por ${seriesCount} meses · até ${formatDay(lastDate)}`
      : startDate > todayISO()
        ? `Fica na agenda até ${formatDay(startDate)}. O saldo de hoje não muda ainda.`
        : null

  async function onSubmit(formData: FormData) {
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido.")
      return
    }

    const payload = {
      amount,
      type,
      account_id: String(formData.get("account_id") ?? ""),
      transfer_account_id: formData.get("transfer_account_id")
        ? String(formData.get("transfer_account_id"))
        : null,
      category_id: formData.get("category_id")
        ? String(formData.get("category_id"))
        : null,
      occurred_on: startDate || todayISO(),
      payment_method: formData.get("payment_method")
        ? String(formData.get("payment_method"))
        : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    }

    setPending(true)
    const result = transaction
      ? await updateTransaction(transaction.id, payload)
      : await createTransaction({
          ...payload,
          is_shared: true,
          recurrence: type === "transfer" ? "once" : recurrence,
          installment_count:
            type === "transfer" || recurrence === "once" ? null : count,
        })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (transaction) {
      toast.success("Lançamento atualizado")
    } else {
      const createdCount =
        "count" in result && typeof result.count === "number" ? result.count : 1
      const nextRecurrence = type === "transfer" ? "once" : recurrence
      toast.success(
        createdCount && createdCount > 1
          ? nextRecurrence === "installment"
            ? `${createdCount} parcelas na agenda`
            : `${createdCount} meses na agenda`
          : startDate > todayISO()
            ? "Agendado"
            : "Lançamento salvo"
      )
      setAmountText("")
    }
    onSaved?.()
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie uma conta antes de lançar um gasto.
      </p>
    )
  }

  const dateLabel =
    editing || type === "transfer" || recurrence === "once"
      ? "Data"
      : recurrence === "installment"
        ? "1ª parcela"
        : "Começa em"

  const submitLabel = pending
    ? "Salvando..."
    : editing
      ? "Salvar alterações"
      : compact && seriesCount === 1
        ? "Lançar agora"
        : seriesCount > 1 && recurrence === "installment"
          ? `Lançar ${seriesCount} parcelas`
          : seriesCount > 1
            ? `Agendar ${seriesCount} meses`
            : "Salvar lançamento"

  const showExtras = editing || !compact

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {TRANSACTION_TYPES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setType(option.value)
              if (option.value === "transfer") setRecurrence("once")
            }}
            className={`rounded-xl px-2 py-2 text-xs font-medium ${
              type === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-amount`}>
            {!editing && recurrence === "installment" && type !== "transfer"
              ? "Valor de cada parcela"
              : !editing && recurrence === "monthly" && type !== "transfer"
                ? "Valor por mês"
                : "Valor"}
          </Label>
          <input
            id={`${prefix}-amount`}
            name="amount"
            required
            inputMode="decimal"
            placeholder="0,00"
            value={amountText}
            onChange={(event) => setAmountText(event.target.value)}
            className={fieldClass}
            autoFocus={compact && !editing}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-account`}>
            {type === "transfer" ? "Sai de" : "Conta"}
          </Label>
          <select
            id={`${prefix}-account`}
            name="account_id"
            required
            className={fieldClass}
            defaultValue={transaction?.account_id}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {type === "transfer" ? (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-transfer`}>Entra em</Label>
          <select
            id={`${prefix}-transfer`}
            name="transfer_account_id"
            required
            className={fieldClass}
            defaultValue={transaction?.transfer_account_id ?? undefined}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-category`}>Categoria</Label>
            <select
              id={`${prefix}-category`}
              name="category_id"
              className={fieldClass}
              defaultValue={transaction?.category_id ?? ""}
            >
              <option value="">Sem categoria</option>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {!editing ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Como acompanha?</p>
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
                {RECURRENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRecurrence(option.value)
                      if (option.value === "installment" && count < 2) setCount(6)
                      if (option.value === "monthly" && count < 2) setCount(12)
                    }}
                    className={`rounded-xl px-2 py-2 text-xs font-medium ${
                      recurrence === option.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {RECURRENCE_OPTIONS.find((option) => option.value === recurrence)?.hint}
              </p>
            </div>
          ) : transaction?.recurrence !== "once" ? (
            <p className="text-xs text-muted-foreground">
              Esta edição muda só este lançamento. As outras parcelas ficam como estão.
            </p>
          ) : null}

          {!editing && recurrence !== "once" ? (
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-count`}>
                {recurrence === "installment"
                  ? "Quantas parcelas?"
                  : "Por quantos meses?"}
              </Label>
              <input
                id={`${prefix}-count`}
                type="number"
                min={2}
                max={36}
                value={count}
                onChange={(event) => setCount(Number(event.target.value) || 2)}
                className={fieldClass}
              />
            </div>
          ) : null}
        </>
      )}

      <div className={`grid gap-3 ${showExtras ? "sm:grid-cols-2" : ""}`}>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-date`}>{dateLabel}</Label>
          <input
            id={`${prefix}-date`}
            name="occurred_on"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={fieldClass}
          />
        </div>
        {showExtras ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-payment`}>Pagamento</Label>
            <select
              id={`${prefix}-payment`}
              name="payment_method"
              className={fieldClass}
              defaultValue={transaction?.payment_method ?? ""}
            >
              <option value="">—</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {showExtras ? (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-notes`}>Notas</Label>
          <input
            id={`${prefix}-notes`}
            name="notes"
            className={fieldClass}
            placeholder="Opcional"
            defaultValue={
              transaction ? seriesBaseNotes(transaction.notes) : undefined
            }
          />
        </div>
      ) : null}

      {preview ? (
        <p className="rounded-2xl bg-primary/8 px-3 py-2 text-xs text-muted-foreground">
          {preview}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
