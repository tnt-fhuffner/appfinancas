"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth/session"
import { addDaysISO, addMonthsClamped, todayISO } from "@/lib/finance/format"
import { composeSeriesNotes, seriesBaseNotes } from "@/lib/finance/upcoming"
import {
  asUuid,
  dbError,
  hexColor,
  isoDate,
  isoMonthStart,
  money,
  moneyPositive,
  notesField,
  shortText,
  zodError,
} from "@/lib/safe"

const accountSchema = z.object({
  name: shortText("Dê um nome para a conta."),
  type: z.enum(["checking", "savings", "wallet", "credit_card"]),
  is_shared: z.boolean(),
  initial_balance: money,
})

const categorySchema = z.object({
  name: shortText("Dê um nome para a categoria."),
  kind: z.enum(["income", "expense"]),
  color: hexColor,
  is_shared: z.boolean(),
})

const transactionSchema = z.object({
  amount: moneyPositive,
  type: z.enum(["income", "expense", "transfer"]),
  account_id: z.string().uuid(),
  transfer_account_id: z.string().uuid().nullable(),
  category_id: z.string().uuid().nullable(),
  occurred_on: isoDate,
  is_shared: z.boolean(),
  payment_method: z.string().max(32).nullable(),
  notes: notesField,
  recurrence: z.enum(["once", "monthly", "installment"]).default("once"),
  installment_count: z.number().int().min(2).max(36).nullable().optional(),
})

function refreshFinance() {
  revalidatePath("/")
  revalidatePath("/financas")
  revalidatePath("/viagens")
}

export async function createAccount(input: z.infer<typeof accountSchema>) {
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from("accounts").insert({
    ...parsed.data,
    is_shared: true,
    owner_id: user.id,
  })
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}

export async function createCategory(input: z.infer<typeof categorySchema>) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from("categories").insert({
    ...parsed.data,
    is_shared: true,
    owner_id: user.id,
  })
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}

export async function deleteCategory(id: string) {
  const categoryId = asUuid(id)
  if (!categoryId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("categories").delete().eq("id", categoryId)
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}

export async function createTransaction(
  input: z.infer<typeof transactionSchema>
) {
  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const data = parsed.data

  if (data.type === "transfer" && !data.transfer_account_id) {
    return { error: "Escolha a conta de destino." }
  }

  const recurrence = data.type === "transfer" ? "once" : data.recurrence
  const count =
    recurrence === "once" ? 1 : (data.installment_count ?? 0)
  if (recurrence !== "once" && (count < 2 || count > 36)) {
    return { error: "Diga quantas vezes, entre 2 e 36." }
  }

  const { supabase, user } = await requireUser()
  const rows = Array.from({ length: count }, (_, index) => ({
    amount: data.amount,
    type: data.type,
    account_id: data.account_id,
    transfer_account_id:
      data.type === "transfer" ? data.transfer_account_id : null,
    category_id: data.type === "transfer" ? null : data.category_id,
    occurred_on: addMonthsClamped(data.occurred_on, index),
    is_shared: true,
    payment_method: data.payment_method,
    notes: composeSeriesNotes(recurrence, index + 1, count, data.notes),
    recurrence,
    installment_count: count > 1 ? count : null,
    owner_id: user.id,
  }))

  const { error } = await supabase.from("transactions").insert(rows)
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null, count }
}

export async function deleteTransaction(id: string) {
  const transactionId = asUuid(id)
  if (!transactionId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("transactions").delete().eq("id", transactionId)
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}

export async function cancelRemainingInSeries(id: string) {
  const transactionId = asUuid(id)
  if (!transactionId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { data: current, error: loadError } = await supabase
    .from("transactions")
    .select(
      "id, amount, type, account_id, transfer_account_id, category_id, occurred_on, payment_method, recurrence, installment_count, notes"
    )
    .eq("id", transactionId)
    .single()

  if (loadError || !current) return { error: "Lançamento não encontrado." }
  if (current.recurrence === "once") {
    return deleteTransaction(transactionId)
  }

  const fromDate =
    current.occurred_on > todayISO()
      ? current.occurred_on
      : addDaysISO(todayISO(), 1)

  const { data: rows, error: listError } = await supabase
    .from("transactions")
    .select(
      "id, amount, type, account_id, transfer_account_id, category_id, occurred_on, payment_method, recurrence, installment_count, notes"
    )
    .eq("account_id", current.account_id)
    .eq("type", current.type)
    .eq("recurrence", current.recurrence)
    .eq("amount", current.amount)
    .gte("occurred_on", fromDate)

  if (listError) return { error: dbError(listError.message) }

  const ids = (rows ?? [])
    .filter((row) =>
      sameSeriesRow(
        current as Record<string, unknown>,
        row as Record<string, unknown>
      )
    )
    .map((row) => String(row.id))

  if (ids.length === 0) {
    return { error: "Não há parcelas futuras nesta série." }
  }

  const { error } = await supabase.from("transactions").delete().in("id", ids)
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null, count: ids.length }
}

function sameSeriesRow(
  left: Record<string, unknown>,
  right: Record<string, unknown>
) {
  return (
    String(left.recurrence) === String(right.recurrence) &&
    Number(left.installment_count ?? 0) === Number(right.installment_count ?? 0) &&
    Number(left.amount) === Number(right.amount) &&
    String(left.account_id) === String(right.account_id) &&
    String(left.transfer_account_id ?? "") ===
      String(right.transfer_account_id ?? "") &&
    String(left.category_id ?? "") === String(right.category_id ?? "") &&
    String(left.type) === String(right.type) &&
    String(left.payment_method ?? "") === String(right.payment_method ?? "") &&
    seriesBaseNotes((left.notes as string | null) ?? null) ===
      seriesBaseNotes((right.notes as string | null) ?? null)
  )
}

export async function archiveAccount(id: string) {
  const accountId = asUuid(id)
  if (!accountId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("accounts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", accountId)
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}

const budgetItemSchema = z.object({
  category_id: z.string().uuid(),
  planned_amount: money,
})

export async function saveMonthBudgets(
  monthStart: string,
  items: z.infer<typeof budgetItemSchema>[]
) {
  const month = isoMonthStart.safeParse(monthStart)
  if (!month.success) return { error: "Mês inválido." }
  const parsed = z.array(budgetItemSchema).max(50).safeParse(items)
  if (!parsed.success) return zodError(parsed.error)
  if (parsed.data.length === 0) {
    return { error: "Não há categorias de despesa." }
  }
  const { supabase, user } = await requireUser()

  const rows = parsed.data.map((item) => ({
    category_id: item.category_id,
    month_start: month.data,
    planned_amount: item.planned_amount,
    owner_id: user.id,
    is_shared: true,
  }))

  const { error } = await supabase.from("budgets").upsert(rows, {
    onConflict: "category_id,month_start",
  })
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}

export async function copyPreviousMonthBudgets(monthStart: string) {
  const month = isoMonthStart.safeParse(monthStart)
  if (!month.success) return { error: "Mês inválido." }
  const { supabase, user } = await requireUser()
  const previous = new Date(`${month.data}T12:00:00`)
  previous.setMonth(previous.getMonth() - 1)
  const prevStart = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}-01`

  const { data, error } = await supabase
    .from("budgets")
    .select("category_id, planned_amount")
    .eq("month_start", prevStart)

  if (error) return { error: dbError(error.message) }
  if (!data?.length) return { error: "Não há orçamento no mês anterior para copiar." }

  const { error: upsertError } = await supabase.from("budgets").upsert(
    data.map((item) => ({
      category_id: item.category_id,
      month_start: month.data,
      planned_amount: item.planned_amount,
      owner_id: user.id,
      is_shared: true,
    })),
    { onConflict: "category_id,month_start" }
  )
  if (upsertError) return { error: dbError(upsertError.message) }
  refreshFinance()
  return { error: null }
}

const billSchema = z.object({
  title: shortText("Dê um nome para a conta.", 120),
  amount: moneyPositive,
  kind: z.enum(["payable", "receivable"]),
  due_on: isoDate,
  category_id: z.string().uuid().nullable(),
  account_id: z.string().uuid().nullable(),
  is_shared: z.boolean(),
  notes: notesField,
  repeat_count: z.number().int().min(1).max(24).default(1),
})

export async function createBill(input: z.infer<typeof billSchema>) {
  const parsed = billSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const data = parsed.data
  const count = data.repeat_count
  const { supabase, user } = await requireUser()
  const rows = Array.from({ length: count }, (_, index) => ({
    title:
      count > 1 ? `${data.title} · ${index + 1}/${count}` : data.title,
    amount: data.amount,
    kind: data.kind,
    due_on: addMonthsClamped(data.due_on, index),
    category_id: data.category_id,
    account_id: data.account_id,
    is_shared: true,
    notes: data.notes,
    status: "pending",
    owner_id: user.id,
  }))
  const { error } = await supabase.from("bills").insert(rows)
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null, count }
}

export async function deleteBill(id: string) {
  const billId = asUuid(id)
  if (!billId) return { error: "Pedido inválido." }
  const { supabase } = await requireUser()
  const { error } = await supabase.from("bills").delete().eq("id", billId)
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}

export async function payBill(id: string) {
  const billId = asUuid(id)
  if (!billId) return { error: "Pedido inválido." }
  const { supabase, user } = await requireUser()
  const { data: bill, error: loadError } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .single()

  if (loadError || !bill) return { error: "Conta não encontrada." }
  if (bill.status === "paid") return { error: "Essa conta já foi quitada." }
  if (!bill.account_id) {
    return { error: "Vincule uma conta bancária antes de quitar." }
  }

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      amount: bill.amount,
      type: bill.kind === "payable" ? "expense" : "income",
      account_id: bill.account_id,
      category_id: bill.category_id,
      occurred_on: todayISO(),
      owner_id: user.id,
      is_shared: true,
      notes: bill.title,
      recurrence: "once",
    })
    .select("id")
    .single()

  if (txError) return { error: dbError(txError.message) }

  const { error } = await supabase
    .from("bills")
    .update({
      status: "paid",
      paid_transaction_id: transaction.id,
    })
    .eq("id", billId)

  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
}
