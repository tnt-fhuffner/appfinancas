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
import { Label } from "@/components/ui/label"
import { fieldClass } from "@/components/finance/fields"
import { createBill, deleteBill, payBill } from "@/lib/finance/actions"
import { formatBRL, formatDay, parseMoneyInput, todayISO } from "@/lib/finance/format"
import type { Bill, FinanceBootstrap } from "@/lib/finance/types"

export function BillsPanel({ data }: { data: FinanceBootstrap }) {
  const [open, setOpen] = useState(false)
  const pending = data.bills.filter((bill) => bill.status === "pending")
  const paid = data.bills.filter((bill) => bill.status === "paid")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg">A pagar e a receber</h3>
          <p className="text-sm text-muted-foreground">
            {pending.length} pendente{pending.length === 1 ? "" : "s"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="rounded-xl" />}>
            <Plus className="size-4" />
            Nova conta
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova conta</DialogTitle>
            </DialogHeader>
            <BillForm
              accounts={data.accounts}
              categories={data.categories}
              onCreated={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <BillSection
        title="Pendentes"
        empty="Nada pendente. Quando chegar um boleto, lance aqui."
        bills={pending}
        accounts={data.accounts}
      />
      <BillSection
        title="Pagas"
        empty="Nenhuma conta quitada ainda."
        bills={paid}
        accounts={data.accounts}
      />
    </div>
  )
}

function BillSection({
  title,
  empty,
  bills,
  accounts,
}: {
  title: string
  empty: string
  bills: Bill[]
  accounts: FinanceBootstrap["accounts"]
}) {
  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  )

  if (bills.length === 0) {
    return (
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h4>
      <ul className="space-y-2">
        {bills.map((bill) => (
          <BillRow
            key={bill.id}
            bill={bill}
            accountName={bill.account_id ? (accountsById.get(bill.account_id) ?? null) : null}
          />
        ))}
      </ul>
    </div>
  )
}

function BillRow({ bill, accountName }: { bill: Bill; accountName: string | null }) {
  const [pending, setPending] = useState(false)
  const overdue = bill.status === "pending" && bill.due_on < todayISO()

  async function settle() {
    setPending(true)
    const result = await payBill(bill.id)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(bill.kind === "payable" ? "Conta paga" : "Recebimento lançado")
  }

  async function remove() {
    setPending(true)
    const result = await deleteBill(bill.id)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Conta apagada")
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8">
      <div className="min-w-0">
        <p className="text-sm font-medium">{bill.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {bill.kind === "payable" ? "A pagar" : "A receber"} · {formatDay(bill.due_on)}
          {accountName ? ` · ${accountName}` : ""}
          {overdue ? " · atrasada" : ""}
        </p>
        <p className="mt-2 text-sm font-medium">{formatBRL(bill.amount)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {bill.status === "pending" ? (
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={() => void settle()}
          >
            {bill.kind === "payable" ? "Pagar" : "Receber"}
          </Button>
        ) : (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">Quitada</span>
        )}
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive"
          disabled={pending}
          onClick={() => void remove()}
        >
          Apagar
        </button>
      </div>
    </li>
  )
}

function BillForm({
  accounts,
  categories,
  onCreated,
}: {
  accounts: FinanceBootstrap["accounts"]
  categories: FinanceBootstrap["categories"]
  onCreated?: () => void
}) {
  const [kind, setKind] = useState<"payable" | "receivable">("payable")
  const [pending, setPending] = useState(false)
  const visibleCategories = categories.filter((category) =>
    kind === "receivable" ? category.kind === "income" : category.kind === "expense"
  )

  async function onSubmit(formData: FormData) {
    const amount = parseMoneyInput(String(formData.get("amount") ?? ""))
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido.")
      return
    }
    if (accounts.length === 0) {
      toast.error("Crie uma conta bancária antes.")
      return
    }

    setPending(true)
    const result = await createBill({
      title: String(formData.get("title") ?? ""),
      amount,
      kind,
      due_on: String(formData.get("due_on") ?? todayISO()),
      category_id: formData.get("category_id")
        ? String(formData.get("category_id"))
        : null,
      account_id: String(formData.get("account_id") ?? "") || null,
      is_shared: true,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Conta lançada")
    onCreated?.()
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie uma conta bancária antes de lançar um boleto.
      </p>
    )
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {(
          [
            ["payable", "A pagar"],
            ["receivable", "A receber"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`rounded-xl px-2 py-2 text-xs font-medium ${
              kind === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bill-title">Nome</Label>
        <input
          id="bill-title"
          name="title"
          required
          placeholder={kind === "payable" ? "Aluguel" : "Reembolso"}
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="bill-amount">Valor</Label>
          <input
            id="bill-amount"
            name="amount"
            required
            inputMode="decimal"
            placeholder="0,00"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bill-due">Vencimento</Label>
          <input
            id="bill-due"
            name="due_on"
            type="date"
            defaultValue={todayISO()}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bill-account">Conta para quitar</Label>
        <select id="bill-account" name="account_id" required className={fieldClass}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bill-category">Categoria</Label>
        <select id="bill-category" name="category_id" className={fieldClass}>
          <option value="">Sem categoria</option>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bill-notes">Notas</Label>
        <input id="bill-notes" name="notes" className={fieldClass} placeholder="Opcional" />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Salvando..." : "Salvar conta"}
      </Button>
    </form>
  )
}
