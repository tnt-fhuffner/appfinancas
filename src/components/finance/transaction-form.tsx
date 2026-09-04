"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { checkboxClass, fieldClass } from "@/components/finance/fields"
import { createTransaction } from "@/lib/finance/actions"
import { parseMoneyInput, todayISO } from "@/lib/finance/format"
import type { Account, Category, TransactionType } from "@/lib/finance/types"
import { PAYMENT_METHODS, TRANSACTION_TYPES } from "@/lib/finance/types"

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
  const [pending, setPending] = useState(false)

  const visibleCategories = useMemo(
    () =>
      categories.filter((category) =>
        type === "income" ? category.kind === "income" : category.kind === "expense"
      ),
    [categories, type]
  )

  async function onSubmit(formData: FormData) {
    const amount = parseMoneyInput(String(formData.get("amount") ?? ""))
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido.")
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
      occurred_on: String(formData.get("occurred_on") ?? todayISO()),
      is_shared: formData.get("is_shared") === "on",
      payment_method: formData.get("payment_method")
        ? String(formData.get("payment_method"))
        : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      recurrence: "once",
    })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Lançamento salvo")
    onCreated?.()
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie uma conta antes de lançar um gasto.
      </p>
    )
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {TRANSACTION_TYPES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setType(option.value)}
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
        <Label htmlFor="amount">Valor</Label>
        <input
          id="amount"
          name="amount"
          required
          inputMode="decimal"
          placeholder="0,00"
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
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="occurred_on">Data</Label>
          <input
            id="occurred_on"
            name="occurred_on"
            type="date"
            defaultValue={todayISO()}
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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_shared" className={checkboxClass} defaultChecked />
        Compartilhado com o casal
      </label>

      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : compact ? "Lançar agora" : "Salvar lançamento"}
      </Button>
    </form>
  )
}
