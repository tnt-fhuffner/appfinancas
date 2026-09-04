"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { fieldClass } from "@/components/finance/fields"
import {
  copyPreviousMonthBudgets,
  saveMonthBudgets,
} from "@/lib/finance/actions"
import { budgetRows } from "@/lib/finance/alerts"
import { formatBRL, monthBounds, parseMoneyInput } from "@/lib/finance/format"
import type { FinanceBootstrap } from "@/lib/finance/types"

function moneyField(value: number) {
  if (!value) return ""
  return value.toFixed(2).replace(".", ",")
}

export function BudgetPanel({ data }: { data: FinanceBootstrap }) {
  const { start, end } = monthBounds()
  const rows = useMemo(
    () => budgetRows(data.categories, data.budgets, data.transactions, start, end),
    [data.budgets, data.categories, data.transactions, start, end]
  )
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.category.id, moneyField(row.planned)]))
  )
  const [pending, setPending] = useState(false)

  const totals = rows.reduce(
    (acc, row) => ({
      planned: acc.planned + row.planned,
      spent: acc.spent + row.spent,
    }),
    { planned: 0, spent: 0 }
  )

  async function save() {
    setPending(true)
    const result = await saveMonthBudgets(
      start,
      rows.map((row) => {
        const parsed = parseMoneyInput(values[row.category.id] ?? "")
        return {
          category_id: row.category.id,
          planned_amount: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
        }
      })
    )
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Orçamento salvo")
  }

  async function copyPrevious() {
    setPending(true)
    const result = await copyPreviousMonthBudgets(start)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Orçamento do mês anterior copiado")
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie categorias de despesa para montar o orçamento do mês.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg">Orçamento do mês</h3>
          <p className="text-sm text-muted-foreground">
            Previsto {formatBRL(totals.planned)} · gasto {formatBRL(totals.spent)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            disabled={pending}
            onClick={() => void copyPrevious()}
          >
            Copiar mês anterior
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl"
            disabled={pending}
            onClick={() => void save()}
          >
            {pending ? "Salvando..." : "Salvar orçamento"}
          </Button>
        </div>
      </div>

      <ul className="space-y-3">
        {rows.map((row) => {
          const over = row.planned > 0 && row.spent > row.planned
          const warn = row.planned > 0 && row.percent >= 80 && !over
          const bar = Math.min(100, row.percent)
          return (
            <li
              key={row.category.id}
              className="rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: row.category.color }}
                    />
                    {row.category.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBRL(row.spent)} de {formatBRL(row.planned)}
                    {row.planned > 0 ? ` · ${Math.round(row.percent)}%` : ""}
                  </p>
                </div>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-label={`Previsto para ${row.category.name}`}
                  className={`${fieldClass} h-10 w-28 text-right`}
                  value={values[row.category.id] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [row.category.id]: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    over ? "bg-red-500" : warn ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${bar}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
