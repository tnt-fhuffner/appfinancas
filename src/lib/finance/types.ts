export type AccountType = "checking" | "savings" | "wallet" | "credit_card"
export type CategoryKind = "income" | "expense"
export type TransactionType = "income" | "expense" | "transfer"
export type Recurrence = "once" | "monthly" | "installment"
export type PaymentMethod = "pix" | "debit" | "credit" | "cash" | "boleto" | "other"
export type BillKind = "payable" | "receivable"
export type BillStatus = "pending" | "paid"
export type AlertLevel = "red" | "yellow"

export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
}

export type Account = {
  id: string
  name: string
  type: AccountType
  owner_id: string
  is_shared: boolean
  color: string | null
  initial_balance: number
  archived_at: string | null
  created_at: string
}

export type Category = {
  id: string
  name: string
  kind: CategoryKind
  color: string
  icon: string | null
  owner_id: string
  is_shared: boolean
  created_at: string
}

export type Transaction = {
  id: string
  amount: number
  type: TransactionType
  category_id: string | null
  account_id: string
  transfer_account_id: string | null
  occurred_on: string
  owner_id: string
  is_shared: boolean
  payment_method: string | null
  recurrence: Recurrence
  installment_count: number | null
  notes: string | null
  receipt_path: string | null
  trip_id: string | null
  created_at: string
  category: Category | null
  account: Account | null
  transfer_account: Account | null
}

export type Budget = {
  id: string
  category_id: string
  month_start: string
  planned_amount: number
  owner_id: string
  is_shared: boolean
}

export type Bill = {
  id: string
  title: string
  amount: number
  kind: BillKind
  due_on: string
  status: BillStatus
  category_id: string | null
  account_id: string | null
  paid_transaction_id: string | null
  owner_id: string
  is_shared: boolean
  notes: string | null
}

export type FinanceAlert = {
  id: string
  level: AlertLevel
  title: string
  detail: string
}

export type HealthStatus = {
  level: "green" | "yellow" | "red"
  color: string
  label: string
}

export type FinanceBootstrap = {
  ready: boolean
  alertsReady: boolean
  schemaSql: string
  schemaSqlPhase3: string
  userId: string
  accounts: Account[]
  categories: Category[]
  profiles: Profile[]
  transactions: Transaction[]
  budgets: Budget[]
  bills: Bill[]
}

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "wallet", label: "Carteira" },
  { value: "credit_card", label: "Cartão de crédito" },
]

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "cash", label: "Dinheiro" },
  { value: "boleto", label: "Boleto" },
  { value: "other", label: "Outro" },
]

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" },
  { value: "transfer", label: "Transferência" },
]
