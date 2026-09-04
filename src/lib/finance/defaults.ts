import type { CategoryKind } from "@/lib/finance/types"

export const DEFAULT_CATEGORIES: {
  name: string
  kind: CategoryKind
  color: string
  icon: string
}[] = [
  { name: "Salário", kind: "income", color: "#5c8a6a", icon: "wallet" },
  { name: "Freelance", kind: "income", color: "#6a8f71", icon: "briefcase" },
  { name: "Extra", kind: "income", color: "#88a57a", icon: "plus" },
  { name: "Moradia", kind: "expense", color: "#c4785a", icon: "home" },
  { name: "Alimentação", kind: "expense", color: "#d08a4c", icon: "utensils" },
  { name: "Transporte", kind: "expense", color: "#b08968", icon: "car" },
  { name: "Saúde", kind: "expense", color: "#c45d5d", icon: "heart" },
  { name: "Lazer", kind: "expense", color: "#c4a35a", icon: "sparkles" },
  { name: "Date", kind: "expense", color: "#c46b84", icon: "heart" },
  { name: "Presente", kind: "expense", color: "#a66b9a", icon: "gift" },
  { name: "Viagem", kind: "expense", color: "#5b7c99", icon: "plane" },
  { name: "Outros", kind: "expense", color: "#8a7e72", icon: "dots" },
]
