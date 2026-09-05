"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { createTransaction } from "@/lib/finance/actions"
import {
  addMonthsClamped,
  formatDay,
  formatBRL,
  parseMoneyInput,
  todayISO,
} from "@/lib/finance/format"
import type { Account, Category, Recurrence, TransactionType } from "@/lib/finance/types"
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
  defaultType = "expense",
  compact = false,
  onCreated,
}: {
  accounts: Account[]
  categories: Category[]
  defaultType?: TransactionType
  compact?: boolean
  onCreated?: () => void
}) {
  const [type, setType] = useState<TransactionType>(defaultType)
  const [recurrence, setRecurrence] = useState<Recurrence>("once")
  const [count, setCount] = useState(12)
  const [amountText, setAmountText] = useState("")
  const [startDate, setStartDate] = useState(todayISO())
  const [pending, setPending] = useState(false)

  const visibleCategories = useMemo(
    () =>
      categories.filter((category) =>
        type === "income" ? category.kind === "income" : category.kind === "expense"
      ),
    [categories, type]
  )

  const seriesCount = type === "transfer" || recurrence === "once" ? 1 : count
  const amount = parseMoneyInput(amountText)
  const lastDate =
    seriesCount > 1 ? addMonthsClamped(startDate, seriesCount - 1) : startDate
  const preview =
    seriesCount > 1 && Number.isFinite(amount) && amount > 0
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

    const nextRecurrence = type === "transfer" ? "once" : recurrence
    if (nextRecurrence !== "once" && (count < 2 || count > 36)) {
      toast.error("Escolham entre 2 e 36 vezes.")
      return
    }

    setPending(true)
    const result = await createTransaction({
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
      is_shared: true,
      payment_method: formData.get("payment_method")
        ? String(formData.get("payment_method"))
        : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      recurrence: nextRecurrence,
      installment_count: nextRecurrence === "once" ? null : count,
    })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    const createdCount = "count" in result ? result.count : 1
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
    onCreated?.()
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie uma conta antes de lançar um gasto.
      </p>
    )
  }

  const dateLabel =
    type === "transfer" || recurrence === "once"
      ? "Data"
      : recurrence === "installment"
        ? "1ª parcela"
        : "Começa em"

  const submitLabel = pending
    ? "Salvando..."
    : compact && seriesCount === 1
      ? "Lançar agora"
      : seriesCount > 1 && recurrence === "installment"
        ? `Lançar ${seriesCount} parcelas`
        : seriesCount > 1
          ? `Agendar ${seriesCount} meses`
          : "Salvar lançamento"

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

      <div className="space-y-2">
        <Label htmlFor="amount">
          {recurrence === "installment" && type !== "transfer"
            ? "Valor de cada parcela"
            : recurrence === "monthly" && type !== "transfer"
              ? "Valor por mês"
              : "Valor"}
        </Label>
        <input
          id="amount"
          name="amount"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
          className={fieldClass}
          autoFocus={compact}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_id">
          {type === "transfer" ? "Sai de" : "Conta"}
        </Label>
        <select id="account_id" name="account_id" required className={fieldClass}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {type === "transfer" ? (
        <div className="space-y-2">
          <Label htmlFor="transfer_account_id">Entra em</Label>
          <select
            id="transfer_account_id"
            name="transfer_account_id"
            required
            className={fieldClass}
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
            <Label htmlFor="category_id">Categoria</Label>
            <select id="category_id" name="category_id" className={fieldClass}>
              <option value="">Sem categoria</option>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

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

          {recurrence !== "once" ? (
            <div className="space-y-2">
              <Label htmlFor="installment_count">
                {recurrence === "installment"
                  ? "Quantas parcelas?"
                  : "Por quantos meses?"}
              </Label>
              <input
                id="installment_count"
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="occurred_on">{dateLabel}</Label>
          <input
            id="occurred_on"
            name="occurred_on"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={fieldClass}
          />
        </div>
        {!compact ? (
          <div className="space-y-2">
            <Label htmlFor="payment_method">Pagamento</Label>
            <select id="payment_method" name="payment_method" className={fieldClass}>
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

      {!compact ? (
        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <input id="notes" name="notes" className={fieldClass} placeholder="Opcional" />
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
