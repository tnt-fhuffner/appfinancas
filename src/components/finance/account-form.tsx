"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { createAccount, updateAccount } from "@/lib/finance/actions"
import { ACCOUNT_TYPES, type Account } from "@/lib/finance/types"
import { moneyToInput, parseMoneyInput } from "@/lib/finance/format"

export function AccountForm({
  account,
  onSaved,
}: {
  account?: Account
  onSaved?: () => void
}) {
  const [pending, setPending] = useState(false)
  const prefix = account?.id ?? "new"

  async function onSubmit(formData: FormData) {
    setPending(true)
    const amount = parseMoneyInput(String(formData.get("initial_balance") ?? "0"))
    const payload = {
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "checking") as (typeof ACCOUNT_TYPES)[number]["value"],
      is_shared: true,
      initial_balance: Number.isFinite(amount) ? amount : 0,
    }
    const result = account
      ? await updateAccount(account.id, payload)
      : await createAccount(payload)
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(account ? "Conta atualizada" : "Conta criada")
    onSaved?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-account-name`}>Nome</Label>
        <input
          id={`${prefix}-account-name`}
          name="name"
          required
          defaultValue={account?.name}
          placeholder="Nubank conjunto"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-account-type`}>Tipo</Label>
          <select
            id={`${prefix}-account-type`}
            name="type"
            className={fieldClass}
            defaultValue={account?.type ?? "checking"}
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-account-balance`}>Saldo inicial</Label>
          <input
            id={`${prefix}-account-balance`}
            name="initial_balance"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={account ? moneyToInput(account.initial_balance) : "0"}
            className={fieldClass}
          />
        </div>
      </div>
      {account ? (
        <p className="text-xs text-muted-foreground">
          O saldo inicial é o ponto de partida. Os lançamentos continuam iguais.
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : account ? "Salvar alterações" : "Salvar conta"}
      </Button>
    </form>
  )
}
