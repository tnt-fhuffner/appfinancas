import { SetupBanner } from "@/components/finance/setup-banner"
import { TripsWorkspace } from "@/components/trips/trips-workspace"
import { getTripsBootstrap } from "@/lib/trips/queries"

export default async function ViagensPage() {
  const trips = await getTripsBootstrap()

  if (!trips.ready) {
    return (
      <SetupBanner
        sql={trips.schemaSql}
        title="Viagens"
        description="Rode este SQL no Editor do Supabase para criar as tabelas de viagens, checklist e roteiro. Depois recarregue a página."
      />
    )
  }

  return <TripsWorkspace trips={trips.trips} />
}
