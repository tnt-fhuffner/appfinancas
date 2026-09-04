import { HouseholdDashboardWithPeriod } from "@/components/finance/household-dashboard"
import { SetupBanner } from "@/components/finance/setup-banner"
import { EventPreview } from "@/components/events/event-preview"
import { GoalsPreview } from "@/components/goals/goals-preview"
import { TripPreview } from "@/components/trips/trip-preview"
import { greetingForNow, toAppUser } from "@/lib/auth/user"
import { getFinanceBootstrap } from "@/lib/finance/queries"
import { progressForGoals } from "@/lib/goals/progress"
import { getGoalsBootstrap } from "@/lib/goals/queries"
import { nextEvent } from "@/lib/events/calendar"
import { getEventsBootstrap } from "@/lib/events/queries"
import { nextTrip } from "@/lib/trips/countdown"
import { getTripsBootstrap } from "@/lib/trips/queries"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const [{ data: { user } }, finance, goals, trips, events] = await Promise.all([
    supabase.auth.getUser(),
    getFinanceBootstrap(),
    getGoalsBootstrap(),
    getTripsBootstrap(),
    getEventsBootstrap(),
  ])
  const name = user ? toAppUser(user).name.split(" ")[0] : "vocês"
  const greeting = greetingForNow()

  if (!finance.ready) {
    return <SetupBanner sql={finance.schemaSql} />
  }

  const goalItems = goals.ready
    ? progressForGoals(goals.goals, goals.contributions)
        .filter((item) => item.goal.status === "active")
        .slice(0, 3)
    : []
  const upcomingTrip = trips.ready ? nextTrip(trips.trips) : null
  const upcomingEvent = events.ready ? nextEvent(events.events) : null

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {!finance.alertsReady ? (
        <SetupBanner sql={finance.schemaSqlPhase3} compact />
      ) : null}
      {!finance.householdReady ? (
        <SetupBanner
          sql={finance.schemaSqlHousehold}
          compact
          title="Painéis ainda não estão conjuntos"
          description="Rode este SQL no Supabase para vocês dois verem as mesmas contas, gastos e o saldo conjunto. Depois recarregue."
        />
      ) : null}
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">{greeting}</p>
        <h2 className="font-heading text-3xl tracking-tight text-pretty md:text-4xl">
          Olá, {name}.
        </h2>
      </section>

      <HouseholdDashboardWithPeriod data={finance}>
        <GoalsPreview items={goalItems} />
        {upcomingTrip || upcomingEvent ? (
          <section className="grid gap-4 md:grid-cols-2">
            <TripPreview trip={upcomingTrip} />
            <EventPreview event={upcomingEvent} />
          </section>
        ) : null}
      </HouseholdDashboardWithPeriod>
    </div>
  )
}
