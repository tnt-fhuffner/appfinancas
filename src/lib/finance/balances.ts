import type { Account, Transaction, TransactionType } from "@/lib/finance/types"
import { toNumber } from "@/lib/finance/format"

export function signedForAccount(
  transaction: Pick<
    Transaction,
    "type" | "amount" | "account_id" | "transfer_account_id"
  >,
  accountId: string
) {
  const amount = toNumber(transaction.amount)
  if (transaction.type === "income" && transaction.account_id === accountId) {
    return amount
  }
  if (transaction.type === "expense" && transaction.account_id === accountId) {
    return -amount
  }
  if (transaction.type === "transfer") {
    if (transaction.account_id === accountId) return -amount
    if (transaction.transfer_account_id === accountId) return amount
  }
  return 0
}

export function accountBalance(
  account: Account,
  transactions: Transaction[]
) {
  return (
    toNumber(account.initial_balance) +
    transactions.reduce(
      (sum, transaction) => sum + signedForAccount(transaction, account.id),
      0
    )
  )
}

export function totalBalance(accounts: Account[], transactions: Transaction[]) {
  return accounts.reduce(
    (sum, account) => sum + accountBalance(account, transactions),
    0
  )
}

export function balanceByOwner(
  accounts: Account[],
  transactions: Transaction[],
  ownerId: string
) {
  return accounts
    .filter((account) => account.owner_id === ownerId && !account.is_shared)
    .reduce(
      (sum, account) => sum + accountBalance(account, transactions),
      0
    )
}

export function sharedBalance(accounts: Account[], transactions: Transaction[]) {
  return accounts
    .filter((account) => account.is_shared)
    .reduce(
      (sum, account) => sum + accountBalance(account, transactions),
      0
    )
}

export function monthExpensesByCategory(
  transactions: Transaction[],
  start: string,
  end: string
) {
  const totals = new Map<
    string,
    { name: string; color: string; value: number }
  >()

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue
    if (transaction.occurred_on < start || transaction.occurred_on > end) {
      continue
    }

    const key = transaction.category_id ?? "sem-categoria"
    const current = totals.get(key) ?? {
      name: transaction.category?.name ?? "Sem categoria",
      color: transaction.category?.color ?? "#8a7e72",
      value: 0,
    }
    current.value += toNumber(transaction.amount)
    totals.set(key, current)
  }

  return [...totals.values()].sort((a, b) => b.value - a.value)
}

export function monthlyBalanceSeries(
  accounts: Account[],
  transactions: Transaction[],
  months: { start: string; end: string; label: string }[]
) {
  return months.map((month) => {
    const untilMonth = transactions.filter(
      (transaction) => transaction.occurred_on <= month.end
    )
    return {
      label: month.label,
      saldo: Number(totalBalance(accounts, untilMonth).toFixed(2)),
    }
  })
}

export function monthTotals(
  transactions: Transaction[],
  start: string,
  end: string
) {
  let income = 0
  let expense = 0

  for (const transaction of transactions) {
    if (transaction.occurred_on < start || transaction.occurred_on > end) {
      continue
    }
    if (transaction.type === "income") income += toNumber(transaction.amount)
    if (transaction.type === "expense") expense += toNumber(transaction.amount)
  }

  return { income, expense, net: income - expense }
}

export function typeLabel(type: TransactionType) {
  if (type === "income") return "Receita"
  if (type === "transfer") return "Transferência"
  return "Despesa"
}

export function typeColor(type: TransactionType) {
  if (type === "income") return "text-emerald-700 dark:text-emerald-400"
  if (type === "transfer") return "text-sky-700 dark:text-sky-400"
  return "text-primary"
}
