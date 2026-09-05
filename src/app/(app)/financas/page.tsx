import {
  FinanceWorkspace,
  isFinanceTab,
} from "@/components/finance/finance-workspace"
import { SetupBanner } from "@/components/finance/setup-banner"
import { getFinanceBootstrap } from "@/lib/finance/queries"

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ tab }, finance] = await Promise.all([
    searchParams,
    getFinanceBootstrap(),
  ])

  if (!finance.ready) {
    return <SetupBanner sql={finance.schemaSql} />
  }

  return (
    <FinanceWorkspace
      data={finance}
      defaultTab={isFinanceTab(tab) ? tab : "visao"}
    />
  )
}
