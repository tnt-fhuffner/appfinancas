import { cache } from "react"
import type { User } from "@supabase/supabase-js"
import { isAllowedEmail } from "@/lib/auth/allowlist"
import { readMigration } from "@/lib/migrations"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_CATEGORIES } from "@/lib/finance/defaults"
import { isMissingTable } from "@/lib/finance/errors"
import { monthBounds, toNumber } from "@/lib/finance/format"
import { getDisplayName } from "@/lib/auth/user"
import type {
  Account,
  Bill,
  Budget,
  Category,
  FinanceBootstrap,
  Profile,
  Transaction,
} from "@/lib/finance/types"

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as Account["type"],
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
    color: (row.color as string | null) ?? null,
    initial_balance: toNumber(row.initial_balance),
    archived_at: (row.archived_at as string | null) ?? null,
    created_at: String(row.created_at),
  }
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    kind: row.kind as Category["kind"],
    color: String(row.color),
    icon: (row.icon as string | null) ?? null,
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
    created_at: String(row.created_at),
  }
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  const category = row.category as Record<string, unknown> | null
  const account = row.account as Record<string, unknown> | null
  const transferAccount = row.transfer_account as Record<string, unknown> | null

  return {
    id: String(row.id),
    amount: toNumber(row.amount),
    type: row.type as Transaction["type"],
    category_id: (row.category_id as string | null) ?? null,
    account_id: String(row.account_id),
    transfer_account_id: (row.transfer_account_id as string | null) ?? null,
    occurred_on: String(row.occurred_on).slice(0, 10),
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
    payment_method: (row.payment_method as string | null) ?? null,
    recurrence: (row.recurrence as Transaction["recurrence"]) ?? "once",
    installment_count: row.installment_count
      ? Number(row.installment_count)
      : null,
    notes: (row.notes as string | null) ?? null,
    receipt_path: (row.receipt_path as string | null) ?? null,
    trip_id: (row.trip_id as string | null) ?? null,
    created_at: String(row.created_at),
    category: category ? mapCategory(category) : null,
    account: account ? mapAccount(account) : null,
    transfer_account: transferAccount ? mapAccount(transferAccount) : null,
  }
}

export async function getSchemaSql() {
  return readMigration("0001_finance.sql")
}

export async function getPhase3Sql() {
  return readMigration("0002_budgets_bills.sql")
}

export async function getHouseholdSql() {
  return readMigration("0006_household.sql")
}

function emptyBootstrap(
  extra: Partial<FinanceBootstrap> & Pick<FinanceBootstrap, "userId">
): FinanceBootstrap {
  return {
    ready: false,
    alertsReady: false,
    householdReady: true,
    schemaSql: "",
    schemaSqlPhase3: "",
    schemaSqlHousehold: "",
    accounts: [],
    categories: [],
    profiles: [],
    transactions: [],
    budgets: [],
    bills: [],
    ...extra,
  }
}

function mapBudget(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    category_id: String(row.category_id),
    month_start: String(row.month_start).slice(0, 10),
    planned_amount: toNumber(row.planned_amount),
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
  }
}

function mapBill(row: Record<string, unknown>): Bill {
  return {
    id: String(row.id),
    title: String(row.title),
    amount: toNumber(row.amount),
    kind: row.kind as Bill["kind"],
    due_on: String(row.due_on).slice(0, 10),
    status: row.status as Bill["status"],
    category_id: (row.category_id as string | null) ?? null,
    account_id: (row.account_id as string | null) ?? null,
    paid_transaction_id: (row.paid_transaction_id as string | null) ?? null,
    owner_id: String(row.owner_id),
    is_shared: Boolean(row.is_shared),
    notes: (row.notes as string | null) ?? null,
  }
}

type ServerClient = Awaited<ReturnType<typeof createClient>>

async function ensureProfile(supabase: ServerClient, user: User) {
  const fullName = getDisplayName(user)
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  if (
    existing &&
    existing.full_name === fullName &&
    existing.avatar_url === avatarUrl
  ) {
    return
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    avatar_url: avatarUrl,
  })
}

async function ensureHouseholdSharing(supabase: ServerClient, userId: string) {
  await Promise.all([
    supabase.from("accounts").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("categories").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("transactions").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("budgets").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("bills").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("goals").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("goal_contributions").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("trips").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("trip_budget_items").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("trip_checklist").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("trip_itinerary").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
    supabase.from("events").update({ is_shared: true }).eq("owner_id", userId).eq("is_shared", false),
  ])
}

async function ensureDefaultCategories(supabase: ServerClient, userId: string) {
  const { data, error } = await supabase.from("categories").select("id").limit(1)
  if (error || (data && data.length > 0)) return

  await supabase.from("categories").insert(
    DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      owner_id: userId,
      is_shared: true,
    }))
  )
}

export const getFinanceBootstrap = cache(async (): Promise<FinanceBootstrap> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isAllowedEmail(user.email)) {
    return emptyBootstrap({ userId: "" })
  }

  const { error: probeError } = await supabase
    .from("accounts")
    .select("id")
    .limit(1)

  if (isMissingTable(probeError)) {
    const [schemaSql, schemaSqlPhase3] = await Promise.all([
      getSchemaSql(),
      getPhase3Sql(),
    ])
    return emptyBootstrap({
      userId: user.id,
      schemaSql,
      schemaSqlPhase3,
    })
  }

  await Promise.all([
    ensureProfile(supabase, user),
    ensureHouseholdSharing(supabase, user.id),
    ensureDefaultCategories(supabase, user.id),
  ])

  const { start: monthStart } = monthBounds()

  const [
    accountsRes,
    categoriesRes,
    profilesRes,
    transactionsRes,
    budgetsRes,
    billsRes,
    householdRes,
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .is("archived_at", null)
      .order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("profiles").select("id, full_name, avatar_url"),
    supabase
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3000),
    supabase.from("budgets").select("*").eq("month_start", monthStart),
    supabase
      .from("bills")
      .select("*")
      .order("due_on", { ascending: true })
      .limit(500),
    supabase.from("app_meta").select("key").eq("key", "household_select").maybeSingle(),
  ])

  const alertsReady = !isMissingTable(budgetsRes.error) && !isMissingTable(billsRes.error)
  const householdReady = !isMissingTable(householdRes.error)

  const accounts = (accountsRes.data ?? []).map((row) =>
    mapAccount(row as Record<string, unknown>)
  )
  const categories = (categoriesRes.data ?? []).map((row) =>
    mapCategory(row as Record<string, unknown>)
  )
  const accountsById = new Map(accounts.map((account) => [account.id, account]))
  const categoriesById = new Map(
    categories.map((category) => [category.id, category])
  )

  return {
    ready: true,
    alertsReady,
    householdReady,
    schemaSql: "",
    schemaSqlPhase3: alertsReady ? "" : await getPhase3Sql(),
    schemaSqlHousehold: householdReady ? "" : await getHouseholdSql(),
    userId: user.id,
    accounts,
    categories,
    profiles: (profilesRes.data ?? []) as Profile[],
    transactions: (transactionsRes.data ?? []).map((row) => {
      const mapped = mapTransaction(row as Record<string, unknown>)
      const category = mapped.category_id
        ? (categoriesById.get(mapped.category_id) ?? null)
        : null
      const account = accountsById.get(mapped.account_id) ?? null
      const transferAccount = mapped.transfer_account_id
        ? (accountsById.get(mapped.transfer_account_id) ?? null)
        : null

      return {
        ...mapped,
        category,
        account,
        transfer_account: transferAccount,
      }
    }),
    budgets: alertsReady
      ? (budgetsRes.data ?? []).map((row) => mapBudget(row as Record<string, unknown>))
      : [],
    bills: alertsReady
      ? (billsRes.data ?? []).map((row) => mapBill(row as Record<string, unknown>))
      : [],
  }
})

