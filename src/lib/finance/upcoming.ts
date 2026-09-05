import type { Bill, Transaction } from "@/lib/finance/types"
import { addDaysISO, monthBounds, todayISO, toNumber } from "@/lib/finance/format"

export type UpcomingBucket = "overdue" | "today" | "week" | "month" | "later"
export type UpcomingSource = "transaction" | "bill"

export type UpcomingItem = {
  id: string
  source: UpcomingSource
  date: string
  title: string
  detail: string
  amount: number
  direction: "in" | "out" | "transfer"
  bucket: UpcomingBucket
  recurrenceLabel: string | null
  isSeries: boolean
  canPay: boolean
  billKind?: "payable" | "receivable"
}

export const BUCKET_LABELS: Record<UpcomingBucket, string> = {
  overdue: "Atrasado",
  today: "Hoje",
  week: "Esta semana",
  month: "Ainda este mês",
  later: "Mais pra frente",
}

export const BUCKET_ORDER: UpcomingBucket[] = [
  "overdue",
  "today",
  "week",
  "month",
  "later",
]

export function seriesNotePrefix(
  recurrence: "once" | "monthly" | "installment",
  index: number,
  total: number
) {
  if (recurrence === "installment") return `Parcela ${index}/${total}`
  if (recurrence === "monthly") return `Mensal ${index}/${total}`
  return ""
}

export function composeSeriesNotes(
  recurrence: "once" | "monthly" | "installment",
  index: number,
  total: number,
  notes: string | null
) {
  const prefix = seriesNotePrefix(recurrence, index, total)
  if (!prefix) return notes
  return notes ? `${prefix} · ${notes}` : prefix
}

export function seriesBaseNotes(notes: string | null) {
  if (!notes) return ""
  return notes.replace(/^(Parcela|Mensal) \d+\/\d+( · )?/u, "").trim()
}

export function withSeriesNotes(existingNotes: string | null, nextNotes: string | null) {
  const match = existingNotes?.match(/^(Parcela|Mensal) \d+\/\d+/)
  if (!match) return nextNotes
  return nextNotes ? `${match[0]} · ${nextNotes}` : match[0]
}

export function recurrenceLabel(
  transaction: Pick<Transaction, "notes" | "recurrence" | "installment_count">
) {
  const match = transaction.notes?.match(/^(Parcela|Mensal) (\d+)\/(\d+)/)
  if (match) {
    return match[1] === "Parcela"
      ? `Parcela ${match[2]}/${match[3]}`
      : `${match[2]}/${match[3]} meses`
  }
  if (transaction.recurrence === "installment") {
    return transaction.installment_count
      ? `${transaction.installment_count}x`
      : "Parcelado"
  }
  if (transaction.recurrence === "monthly") return "Todo mês"
  return null
}

export function sameSeries(left: Transaction, right: Transaction) {
  return (
    left.recurrence !== "once" &&
    left.recurrence === right.recurrence &&
    left.installment_count === right.installment_count &&
    toNumber(left.amount) === toNumber(right.amount) &&
    left.account_id === right.account_id &&
    (left.transfer_account_id ?? null) === (right.transfer_account_id ?? null) &&
    (left.category_id ?? null) === (right.category_id ?? null) &&
    left.type === right.type &&
    (left.payment_method ?? null) === (right.payment_method ?? null) &&
    seriesBaseNotes(left.notes) === seriesBaseNotes(right.notes)
  )
}

function bucketFor(date: string, asOf: string): UpcomingBucket {
  if (date < asOf) return "overdue"
  if (date === asOf) return "today"
  if (date <= addDaysISO(asOf, 7)) return "week"
  const { end } = monthBounds(asOf)
  if (date <= end) return "month"
  return "later"
}

function billRepeatLabel(title: string) {
  const match = title.match(/ · (\d+)\/(\d+)$/)
  return match ? `${match[1]}/${match[2]}` : null
}

export function buildUpcomingItems(
  transactions: Transaction[],
  bills: Bill[],
  asOf = todayISO()
): UpcomingItem[] {
  const items: UpcomingItem[] = []

  for (const transaction of transactions) {
    if (transaction.occurred_on <= asOf) continue
    const title =
      transaction.category?.name ??
      (transaction.type === "transfer"
        ? `${transaction.account?.name ?? "Conta"} → ${transaction.transfer_account?.name ?? "Conta"}`
        : transaction.type === "income"
          ? "Receita"
          : "Despesa")
    const note = seriesBaseNotes(transaction.notes)
    items.push({
      id: transaction.id,
      source: "transaction",
      date: transaction.occurred_on,
      title,
      detail: [transaction.account?.name, note || null]
        .filter(Boolean)
        .join(" · "),
      amount: toNumber(transaction.amount),
      direction:
        transaction.type === "income"
          ? "in"
          : transaction.type === "transfer"
            ? "transfer"
            : "out",
      bucket: bucketFor(transaction.occurred_on, asOf),
      recurrenceLabel: recurrenceLabel(transaction),
      isSeries: transaction.recurrence !== "once",
      canPay: false,
    })
  }

  for (const bill of bills) {
    if (bill.status !== "pending") continue
    items.push({
      id: bill.id,
      source: "bill",
      date: bill.due_on,
      title: bill.title.replace(/ · \d+\/\d+$/, ""),
      detail: bill.kind === "payable" ? "Conta a pagar" : "A receber",
      amount: toNumber(bill.amount),
      direction: bill.kind === "receivable" ? "in" : "out",
      bucket: bucketFor(bill.due_on, asOf),
      recurrenceLabel: billRepeatLabel(bill.title),
      isSeries: Boolean(billRepeatLabel(bill.title)),
      canPay: true,
      billKind: bill.kind,
    })
  }

  return items.sort((left, right) => {
    const bucketDiff =
      BUCKET_ORDER.indexOf(left.bucket) - BUCKET_ORDER.indexOf(right.bucket)
    if (bucketDiff !== 0) return bucketDiff
    if (left.date !== right.date) return left.date < right.date ? -1 : 1
    return left.title.localeCompare(right.title, "pt-BR")
  })
}

export function groupUpcoming(items: UpcomingItem[]) {
  return BUCKET_ORDER.flatMap((bucket) => {
    const list = items.filter((item) => item.bucket === bucket)
    return list.length ? [{ bucket, items: list }] : []
  })
}

export function upcomingTotals(items: UpcomingItem[]) {
  return items.reduce(
    (totals, item) => {
      if (item.direction === "out") totals.out += item.amount
      if (item.direction === "in") totals.in += item.amount
      return totals
    },
    { out: 0, in: 0 }
  )
}
