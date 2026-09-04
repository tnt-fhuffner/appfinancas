"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth/session"
import { todayISO } from "@/lib/finance/format"
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

  const { supabase, user } = await requireUser()
  const accountIds = [data.account_id, data.transfer_account_id].filter(
    (id): id is string => Boolean(id)
  )
  const { data: relatedAccounts } = await supabase
    .from("accounts")
    .select("id, is_shared")
    .in("id", accountIds)
  const isShared =
    data.is_shared ||
    Boolean(relatedAccounts?.some((account) => account.is_shared))

  const { error } = await supabase.from("transactions").insert({
    amount: data.amount,
    type: data.type,
    account_id: data.account_id,
    transfer_account_id:
      data.type === "transfer" ? data.transfer_account_id : null,
    category_id: data.type === "transfer" ? null : data.category_id,
    occurred_on: data.occurred_on,
    is_shared: isShared,
    payment_method: data.payment_method,
    notes: data.notes,
    recurrence: data.recurrence,
    owner_id: user.id,
  })
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
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
})

export async function createBill(input: z.infer<typeof billSchema>) {
  const parsed = billSchema.safeParse(input)
  if (!parsed.success) return zodError(parsed.error)
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from("bills").insert({
    ...parsed.data,
    status: "pending",
    owner_id: user.id,
  })
  if (error) return { error: dbError(error.message) }
  refreshFinance()
  return { error: null }
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
      is_shared: bill.is_shared,
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
