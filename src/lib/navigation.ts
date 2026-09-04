import {
  CalendarHeart,
  Home,
  Plane,
  Settings,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  description: string
}

export const primaryNav: NavItem[] = [
  {
    href: "/",
    label: "Início",
    icon: Home,
    description: "Visão do dia e saúde do mês",
  },
  {
    href: "/financas",
    label: "Finanças",
    icon: Wallet,
    description: "Contas, gastos e orçamento",
  },
  {
    href: "/metas",
    label: "Metas",
    icon: Sparkles,
    description: "Sonhos e progresso",
  },
  {
    href: "/viagens",
    label: "Viagens",
    icon: Plane,
    description: "Roteiros e orçamento de viagem",
  },
  {
    href: "/eventos",
    label: "Eventos",
    icon: CalendarHeart,
    description: "Dates, aniversários e surpresas",
  },
]

export const settingsNav: NavItem = {
  href: "/configuracoes",
  label: "Configurações",
  icon: Settings,
  description: "Conta, tema e preferências",
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
