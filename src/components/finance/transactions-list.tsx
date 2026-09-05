"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { TransactionForm } from "@/components/finance/transaction-form"
import { deleteTransaction } from "@/lib/finance/actions"
import { formatBRL, formatDay, initialsFromName, todayISO, toNumber } from "@/lib/finance/format"
import { typeLabel, typeColor } from "@/lib/finance/balances"
import { recurrenceLabel } from "@/lib/finance/upcoming"
import type { Account, Category, Profile, Transaction } from "@/lib/finance/types"

export function TransactionsList({
  transactions,
  profiles,
  accounts = [],
  categories = [],
}: {
  transactions: Transaction[]
  profiles: Profile[]
  accounts?: Account[]
  categories?: Category[]
}) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
  const canEdit = accounts.length > 0

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="Nenhum lançamento ainda"
        description="O botão + no canto é o caminho mais rápido para registrar o café, o mercado, o date."
      />
    )
  }

  async function remove(id: string) {
    setPendingId(id)
    const result = await deleteTransaction(id)
    setPendingId(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Lançamento apagado")
  }

  return (
    <>
      <ul className="space-y-2">
        {transactions.map((transaction) => {
          const owner = profileMap.get(transaction.owner_id)
          const name = owner?.full_name?.trim() || "Vocês"
          const firstName = name.split(/\s+/)[0]
          const signed =
            transaction.type === "income"
              ? toNumber(transaction.amount)
              : transaction.type === "expense"
                ? -toNumber(transaction.amount)
                : 0
          const scheduled = transaction.occurred_on > todayISO()
          const seriesLabel = recurrenceLabel(transaction)

          return (
            <li
              key={transaction.id}
              className="flex items-center gap-3 rounded-2xl bg-card/80 px-3 py-3 ring-1 ring-foreground/8"
            >
              <Avatar
                size="default"
                title={`Lançado por ${name}`}
                aria-label={`Lançado por ${name}`}
              >
                {owner?.avatar_url ? (
                  <AvatarImage src={owner.avatar_url} alt={name} />
                ) : null}
                <AvatarFallback className="bg-primary/15 font-medium text-primary">
                  {initialsFromName(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {transaction.category?.name ??
                    (transaction.type === "transfer"
                      ? `${transaction.account?.name ?? "Conta"} → ${transaction.transfer_account?.name ?? "Conta"}`
                      : typeLabel(transaction.type))}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {firstName} · {formatDay(transaction.occurred_on)} ·{" "}
                  {transaction.account?.name}
                </p>
                {scheduled || seriesLabel ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {scheduled ? (
                      <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                        Agendado
                      </span>
                    ) : null}
                    {seriesLabel ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {seriesLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${typeColor(transaction.type)}`}>
                  {transaction.type === "transfer"
                    ? formatBRL(toNumber(transaction.amount))
                    : `${signed > 0 ? "+" : ""}${formatBRL(signed)}`}
                </p>
                <div className="mt-1 flex justify-end gap-2">
                  {canEdit ? (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditing(transaction)}
                      aria-label="Editar lançamento"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={pendingId === transaction.id}
                    onClick={() => void remove(transaction.id)}
                    aria-label="Apagar lançamento"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
          </DialogHeader>
          {editing ? (
            <TransactionForm
              key={editing.id}
              transaction={editing}
              accounts={accounts}
              categories={categories}
              onSaved={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
