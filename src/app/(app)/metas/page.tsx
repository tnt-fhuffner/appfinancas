import { SetupBanner } from "@/components/finance/setup-banner"
import { GoalsWorkspace } from "@/components/goals/goals-workspace"
import { getGoalsBootstrap } from "@/lib/goals/queries"

export default async function MetasPage() {
  const goals = await getGoalsBootstrap()

  if (!goals.ready) {
    return (
      <SetupBanner
        sql={goals.schemaSql}
        title="Metas e sonhos"
        description="Rode este SQL no Editor do Supabase para criar as tabelas de metas e aportes. Depois recarregue a página."
      />
    )
  }

  return <GoalsWorkspace data={goals} />
}
