import { FinanceWorkspace } from "@/components/finance/finance-workspace"
import { SetupBanner } from "@/components/finance/setup-banner"
import { getFinanceBootstrap } from "@/lib/finance/queries"

export default async function FinancasPage() {
  const finance = await getFinanceBootstrap()

  if (!finance.ready) {
    return <SetupBanner sql={finance.schemaSql} />
  }

  return <FinanceWorkspace data={finance} />
}
