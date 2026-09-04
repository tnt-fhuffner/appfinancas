"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { createAccount } from "@/lib/finance/actions"
import { ACCOUNT_TYPES } from "@/lib/finance/types"
import { parseMoneyInput } from "@/lib/finance/format"

export function AccountForm({ onCreated }: { onCreated?: () => void }) {
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    setPending(true)
    const amount = parseMoneyInput(String(formData.get("initial_balance") ?? "0"))
    const result = await createAccount({
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "checking") as (typeof ACCOUNT_TYPES)[number]["value"],
      is_shared: true,
      initial_balance: Number.isFinite(amount) ? amount : 0,
    })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Conta criada")
    onCreated?.()
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="account-name">Nome</Label>
        <input
          id="account-name"
          name="name"
          required
          placeholder="Nubank conjunto"
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-type">Tipo</Label>
        <select id="account-type" name="type" className={fieldClass} defaultValue="checking">
          {ACCOUNT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-balance">Saldo inicial</Label>
        <input
          id="account-balance"
          name="initial_balance"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue="0"
          className={fieldClass}
        />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : "Salvar conta"}
      </Button>
    </form>
  )
}
