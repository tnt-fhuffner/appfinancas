import { notFound } from "next/navigation"
import { SetupBanner } from "@/components/finance/setup-banner"
import { TripDetailView } from "@/components/trips/trip-detail"
import { getFinanceBootstrap } from "@/lib/finance/queries"
import { getTripDetail } from "@/lib/trips/queries"

export default async function ViagemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [detail, finance] = await Promise.all([
    getTripDetail(id),
    getFinanceBootstrap(),
  ])

  if (!detail.ready) {
    return (
      <SetupBanner
        sql={detail.schemaSql}
        title="Viagens"
        description="Rode este SQL no Editor do Supabase para criar as tabelas de viagens. Depois recarregue a página."
      />
    )
  }

  if (!detail.trip) notFound()

  return <TripDetailView detail={detail} accounts={finance.accounts} />
}
