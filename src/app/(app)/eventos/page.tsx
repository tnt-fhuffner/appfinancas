import { SetupBanner } from "@/components/finance/setup-banner"
import { EventsWorkspace } from "@/components/events/events-workspace"
import { getEventsBootstrap } from "@/lib/events/queries"

export default async function EventosPage() {
  const events = await getEventsBootstrap()

  if (!events.ready) {
    return (
      <SetupBanner
        sql={events.schemaSql}
        title="Eventos e dates"
        description="Rode este SQL no Editor do Supabase para criar a tabela de eventos, dates e surpresas. Depois recarregue a página."
      />
    )
  }

  return <EventsWorkspace events={events.events} userId={events.userId} />
}
