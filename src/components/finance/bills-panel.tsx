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
import { createBill, deleteBill, payBill, updateBill } from "@/lib/finance/actions"
import {
  formatBRL,
  formatDay,
  moneyToInput,
  parseMoneyInput,
  todayISO,
} from "@/lib/finance/format"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conta</DialogTitle>
            </DialogHeader>
            <BillForm
              accounts={data.accounts}
              categories={data.categories}
              onSaved={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <BillSection
        title="Pendentes"
        empty="Nada pendente. Quando chegar um boleto, lance aqui."
        bills={pending}
        accounts={data.accounts}
        categories={data.categories}
        editable
      />
      <BillSection
        title="Pagas"
        empty="Nenhuma conta quitada ainda."
        bills={paid}
        accounts={data.accounts}
        categories={data.categories}
      />
    </div>
  )
}

function BillSection({
  title,
  empty,
  bills,
  accounts,
  categories,
  editable = false,
}: {
  title: string
  empty: string
  bills: Bill[]
  accounts: FinanceBootstrap["accounts"]
  categories: FinanceBootstrap["categories"]
  editable?: boolean
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
            accounts={accounts}
            categories={categories}
            editable={editable}
          />
        ))}
      </ul>
    </div>
  )
}

function BillRow({
  bill,
  accountName,
  accounts,
  categories,
  editable,
}: {
  bill: Bill
  accountName: string | null
  accounts: FinanceBootstrap["accounts"]
  categories: FinanceBootstrap["categories"]
  editable: boolean
}) {
  const [pending, setPending] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const overdue = bill.status === "pending" && bill.due_on < todayISO()
  const repeat = bill.title.match(/ · (\d+)\/(\d+)$/)
  const title = bill.title.replace(/ · \d+\/\d+$/, "")

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
    <>
    <li className="flex items-start justify-between gap-3 rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {title}
          {repeat ? (
            <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {repeat[1]}/{repeat[2]}
            </span>
          ) : null}
        </p>
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
        {editable ? (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setEditOpen(true)}
          >
            Editar
          </button>
        ) : null}
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
    {editable ? (
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar conta</DialogTitle>
          </DialogHeader>
          <BillForm
            bill={bill}
            accounts={accounts}
            categories={categories}
            onSaved={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    ) : null}
    </>
  )
}

function BillForm({
  accounts,
  categories,
  bill,
  onSaved,
}: {
  accounts: FinanceBootstrap["accounts"]
  categories: FinanceBootstrap["categories"]
  bill?: Bill
  onSaved?: () => void
}) {
  const [kind, setKind] = useState<"payable" | "receivable">(bill?.kind ?? "payable")
  const [repeat, setRepeat] = useState<"once" | "monthly">("once")
  const [months, setMonths] = useState(12)
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

    const payload = {
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
    }

    setPending(true)
    const result = bill
      ? await updateBill(bill.id, payload)
      : await createBill({
          ...payload,
          repeat_count: repeat === "monthly" ? months : 1,
        })
    setPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (bill) {
      toast.success("Conta atualizada")
    } else {
      const createdCount =
        "count" in result && typeof result.count === "number" ? result.count : 1
      toast.success(
        createdCount && createdCount > 1
          ? `${createdCount} vencimentos na agenda`
          : "Conta lançada"
      )
    }
    onSaved?.()
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
          defaultValue={bill?.title}
          placeholder={kind === "payable" ? "Aluguel" : "Reembolso"}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bill-amount">Valor</Label>
          <input
            id="bill-amount"
            name="amount"
            required
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={bill ? moneyToInput(bill.amount) : undefined}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bill-due">
            {!bill && repeat === "monthly" ? "1º vencimento" : "Vencimento"}
          </Label>
          <input
            id="bill-due"
            name="due_on"
            type="date"
            defaultValue={bill?.due_on ?? todayISO()}
            className={fieldClass}
          />
        </div>
      </div>
      {!bill ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Se repete?</p>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
            {(
              [
                ["once", "Só esta"],
                ["monthly", "Todo mês"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRepeat(value)}
                className={`rounded-xl px-2 py-2 text-xs font-medium ${
                  repeat === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {repeat === "monthly" ? (
            <div className="space-y-2">
              <Label htmlFor="bill-months">Por quantos meses?</Label>
              <input
                id="bill-months"
                type="number"
                min={2}
                max={24}
                value={months}
                onChange={(event) => setMonths(Number(event.target.value) || 2)}
                className={fieldClass}
              />
              <p className="text-xs text-muted-foreground">
                Aluguel, internet, academia — criamos os vencimentos na agenda.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bill-account">Conta para quitar</Label>
          <select
            id="bill-account"
            name="account_id"
            required
            className={fieldClass}
            defaultValue={bill?.account_id ?? undefined}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bill-category">Categoria</Label>
          <select
            id="bill-category"
            name="category_id"
            className={fieldClass}
            defaultValue={bill?.category_id ?? ""}
          >
            <option value="">Sem categoria</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bill-notes">Notas</Label>
        <input
          id="bill-notes"
          name="notes"
          className={fieldClass}
          placeholder="Opcional"
          defaultValue={bill?.notes ?? undefined}
        />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
        {pending
          ? "Salvando..."
          : bill
            ? "Salvar alterações"
            : repeat === "monthly"
              ? `Agendar ${months} meses`
              : "Salvar conta"}
      </Button>
    </form>
  )
}
