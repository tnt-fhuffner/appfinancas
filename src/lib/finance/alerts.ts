import type { Account, Category, Transaction } from "@/lib/finance/types"
import type { Bill, Budget, FinanceAlert, HealthStatus } from "@/lib/finance/types"
import { monthTotals, totalBalance } from "@/lib/finance/balances"
import { toNumber, todayISO } from "@/lib/finance/format"

export type BudgetRow = {
  category: Category
  planned: number
  spent: number
  remaining: number
  percent: number
}

export function budgetRows(
  categories: Category[],
  budgets: Budget[],
  transactions: Transaction[],
  monthStart: string,
  monthEnd: string
): BudgetRow[] {
  const plannedByCategory = new Map(
    budgets
      .filter((budget) => budget.month_start === monthStart)
      .map((budget) => [budget.category_id, toNumber(budget.planned_amount)])
  )

  return categories
    .filter((category) => category.kind === "expense")
    .map((category) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.category_id === category.id &&
            transaction.occurred_on >= monthStart &&
            transaction.occurred_on <= monthEnd
        )
        .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0)
      const planned = plannedByCategory.get(category.id) ?? 0
      const percent = planned > 0 ? (spent / planned) * 100 : spent > 0 ? 100 : 0
      return {
        category,
        planned,
        spent,
        remaining: planned - spent,
        percent,
      }
    })
    .sort((a, b) => b.spent - a.spent)
}

export function projectedMonthEndBalance(
  accounts: Account[],
  transactions: Transaction[],
  bills: Bill[],
  monthStart: string,
  monthEnd: string,
  today = todayISO()
) {
  const current = totalBalance(accounts, transactions)
  const day = Number(today.slice(-2))
  const daysInMonth = Number(monthEnd.slice(-2))
  const elapsed = Math.max(1, Math.min(day, daysInMonth))
  const remaining = Math.max(0, daysInMonth - elapsed)
  const totals = monthTotals(transactions, monthStart, today < monthEnd ? today : monthEnd)

  const projectedFromPace =
    current +
    (totals.income / elapsed) * remaining -
    (totals.expense / elapsed) * remaining

  const pendingUntilMonthEnd = bills.filter(
    (bill) =>
      bill.status === "pending" &&
      bill.due_on > today &&
      bill.due_on <= monthEnd
  )

  const billDelta = pendingUntilMonthEnd.reduce((sum, bill) => {
    const amount = toNumber(bill.amount)
    return bill.kind === "payable" ? sum - amount : sum + amount
  }, 0)

  return projectedFromPace + billDelta
}

export function buildAlerts(
  rows: BudgetRow[],
  bills: Bill[],
  projected: number,
  today = todayISO()
): FinanceAlert[] {
  const alerts: FinanceAlert[] = []

  for (const row of rows) {
    if (row.planned > 0 && row.spent > row.planned) {
      alerts.push({
        id: `over-${row.category.id}`,
        level: "red",
        title: `${row.category.name} passou do orçamento`,
        detail: `Previsto ${row.planned.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · gasto ${row.spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      })
    } else if (row.planned > 0 && row.percent >= 80) {
      alerts.push({
        id: `warn-${row.category.id}`,
        level: "yellow",
        title: `${row.category.name} está perto do limite`,
        detail: `${Math.round(row.percent)}% do orçamento já foi usado`,
      })
    }
  }

  if (projected < 0) {
    alerts.push({
      id: "negative-projection",
      level: "red",
      title: "Saldo pode ficar negativo este mês",
      detail: `A projeção até o fim do mês é ${projected.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    })
  }

  for (const bill of bills.filter((item) => item.status === "pending")) {
    const diff =
      (Date.parse(`${bill.due_on}T12:00:00`) - Date.parse(`${today}T12:00:00`)) /
      86_400_000
    if (diff < 0) {
      alerts.push({
        id: `overdue-${bill.id}`,
        level: "red",
        title: `${bill.kind === "payable" ? "Conta atrasada" : "Recebimento atrasado"}: ${bill.title}`,
        detail: `Venceu em ${bill.due_on.split("-").reverse().join("/")}`,
      })
    } else if (diff <= 3) {
      alerts.push({
        id: `due3-${bill.id}`,
        level: "red",
        title: `${bill.kind === "payable" ? "Vence em breve" : "A receber em breve"}: ${bill.title}`,
        detail: diff === 0 ? "Vence hoje" : `Faltam ${diff} dia(s)`,
      })
    } else if (diff <= 7) {
      alerts.push({
        id: `due7-${bill.id}`,
        level: "yellow",
        title: `${bill.title} vence esta semana`,
        detail: `Dia ${bill.due_on.split("-").reverse().slice(0, 2).join("/")}`,
      })
    }
  }

  return alerts
}

export function healthFromAlerts(
  alerts: FinanceAlert[],
  hasBudgets: boolean
): HealthStatus {
  if (alerts.some((alert) => alert.level === "red")) {
    return {
      level: "red",
      color: "bg-red-500",
      label: "Atenção: tem risco neste mês",
    }
  }
  if (alerts.some((alert) => alert.level === "yellow")) {
    return {
      level: "yellow",
      color: "bg-amber-400",
      label: "Mês no limite — vale olhar os alertas",
    }
  }
  if (!hasBudgets) {
    return {
      level: "yellow",
      color: "bg-amber-400",
      label: "Defina o orçamento para o semáforo ficar preciso",
    }
  }
  return {
    level: "green",
    color: "bg-emerald-500",
    label: "Saúde financeira em dia",
  }
}
