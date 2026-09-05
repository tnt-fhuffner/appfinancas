export const FINANCE_TABS = [
  { id: "visao", label: "Visão" },
  { id: "agenda", label: "Agenda" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "orcamento", label: "Orçamento" },
  { id: "a-pagar", label: "A pagar" },
  { id: "contas", label: "Contas" },
  { id: "categorias", label: "Categorias" },
] as const

export type FinanceTab = (typeof FINANCE_TABS)[number]["id"]

export function isFinanceTab(value: string | undefined): value is FinanceTab {
  return FINANCE_TABS.some((tab) => tab.id === value)
}
